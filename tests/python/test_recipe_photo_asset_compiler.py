"""Resource compiler regressions; fixtures stay in temporary directories."""
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path, PurePosixPath
import sys
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
SPEC = importlib.util.spec_from_file_location('jj_photo_asset_compiler', ROOT/'scripts/prepare-recipe-photo-assets.py')
compiler = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(compiler)


def original(size=(1536, 1024), orientation=1):
    out = io.BytesIO()
    with Image.new('RGB', size, (23, 87, 45)) as image:
        exif = Image.Exif()
        exif[274] = orientation
        exif[270] = 'Temporary test metadata'
        image.save(out, format='JPEG', quality=93, exif=exif)
    return out.getvalue()


def outputs(staging):
    values = {
        PurePosixPath('assets/recipes-v3/thumbnails/JJ-R001.jpg'): b'temporary derived fixture',
        compiler.MAP_PATH: b'// temporary map fixture\n',
        compiler.MANIFEST_PATH: b'{"temporary":true}\n',
    }
    generated = {}
    for path, payload in values.items():
        target = staging/path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
        generated[path] = {'path': path.as_posix(), 'bytes': len(payload),
                           'sha256': hashlib.sha256(payload).hexdigest()}
    return generated


def snapshot(root):
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in root.rglob('*') if p.is_file() and not p.is_symlink()}


class PhotoEncodingTests(unittest.TestCase):
    def test_resizes_without_cropping_or_source_mutation_and_strips_metadata(self):
        payload = original()
        before = compiler.sha256(payload)
        for width, expected in [(192, (192, 128)), (960, (960, 640))]:
            derived, actual_width, actual_height = compiler.resize_jpeg(payload, width)
            self.assertEqual((actual_width, actual_height), expected)
            with Image.open(io.BytesIO(derived)) as image:
                image.load()
                self.assertEqual(image.size, expected)
                self.assertEqual(image.mode, 'RGB')
                self.assertEqual(image.format, 'JPEG')
                self.assertFalse(image.getexif())
                self.assertNotIn('icc_profile', image.info)
            self.assertEqual(compiler.sha256(payload), before)

    def test_four_by_three_source_keeps_its_ratio(self):
        derived, width, height = compiler.resize_jpeg(original((1600, 1200)), 960)
        self.assertEqual((width, height), (960, 720))
        self.assertTrue(derived.startswith(b'\xff\xd8'))

    def test_unreviewed_size_and_exif_rotation_are_rejected(self):
        with self.assertRaises(compiler.AssetError):
            compiler.resize_jpeg(original(), 320)
        with self.assertRaises(compiler.AssetError):
            compiler.resize_jpeg(original(orientation=6), 192)

    def test_wrong_decoder_is_rejected_before_opening(self):
        with patch('PIL.__version__', '12.3.0'), patch('PIL.Image.open') as image_open:
            with self.assertRaises(compiler.AssetError):
                compiler.resize_jpeg(b'untrusted', 192)
            image_open.assert_not_called()


class SidecarBoundaryTests(unittest.TestCase):
    def manifest(self):
        profile = compiler.intake.load_profile('app10mb')
        rows = [{'recipe_id': 'JJ-R' + str(index).zfill(3),
                 'path': (compiler.SOURCE/'fotos'/('JJ-R'+str(index).zfill(3)+'.jpg')).as_posix(),
                 'bytes': 1000, 'sha256': format(index+1, '064x'),
                 'git_blob_sha': format(index+1, '040x')} for index in range(150)]
        return profile, {'recipe_count': 150, 'photos_count': 150,
                         'data_zip': {'path': (compiler.SOURCE/profile.data_package.name).as_posix(),
                                      'bytes': profile.data_package.size,
                                      'sha256': compiler.DATA_SHA256}, 'photos': rows}

    def verify(self, manifest, profile):
        payload = json.dumps(manifest).encode()
        report = {'complete': True, 'received_photos': 150, 'recipes': 150,
                  'localized_records': 750,
                  'verified_photo_ids': ['JJ-R'+str(index).zfill(3) for index in range(150)]}
        with patch.object(compiler.intake, 'load_profile', return_value=profile), \
                patch.object(compiler.intake, 'verify_delivery', return_value=report), \
                patch.object(compiler.intake, '_read', return_value=payload), \
                patch.object(compiler, 'SIDECAR_SHA256', compiler.sha256(payload)):
            return compiler.source_rows()

    def test_duplicate_id_path_or_hash_is_rejected(self):
        profile, manifest = self.manifest()
        manifest['photos'][1] = dict(manifest['photos'][0])
        with self.assertRaises(compiler.AssetError):
            self.verify(manifest, profile)
        profile, manifest = self.manifest()
        manifest['photos'][1]['sha256'] = manifest['photos'][0]['sha256']
        with self.assertRaises(compiler.AssetError):
            self.verify(manifest, profile)

    def test_source_path_cannot_escape_or_change_the_fixed_identity(self):
        profile, manifest = self.manifest()
        for value in ['../outside.jpg', '/tmp/JJ-R000.jpg',
                      (compiler.SOURCE/'fotos'/'JJ-R001.jpg').as_posix()]:
            manifest['photos'][0]['path'] = value
            with self.assertRaises(compiler.AssetError):
                self.verify(manifest, profile)

    def test_invalid_git_blob_and_extra_record_are_rejected(self):
        profile, manifest = self.manifest()
        manifest['photos'][0]['git_blob_sha'] = 'x'*40
        with self.assertRaises(compiler.AssetError):
            self.verify(manifest, profile)
        profile, manifest = self.manifest()
        manifest['photos'].append(dict(manifest['photos'][0]))
        with self.assertRaises(compiler.AssetError):
            self.verify(manifest, profile)


class OutputBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='jj-photo-compiler-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)/'repo'
        self.staging = Path(self.temp.name)/'staging'
        self.root.mkdir(); self.staging.mkdir()
        self.generated = outputs(self.staging)

    def test_only_explicit_resource_and_metadata_paths_are_allowed(self):
        for value in ['../outside.jpg', '/assets/recipes-v3/details/JJ-R001.jpg',
                      'assets/recipes-v3/details/../JJ-R001.jpg',
                      'assets/recipes-v3/details/unknown.jpg',
                      'assets/recipes-v3/details/JJ-R001.png', 'src/data/recipes.ts',
                      'referencias/recetas/V3/APP_LIGERO_10MB/fotos/JJ-R001.jpg']:
            self.assertFalse(compiler.allowed_output(PurePosixPath(value)), value)

    def test_publish_is_exclusive_and_identical_repetition_is_safe(self):
        compiler.publish_outputs(self.root, self.staging, self.generated)
        before = snapshot(self.root)
        compiler.publish_outputs(self.root, self.staging, self.generated)
        self.assertEqual(snapshot(self.root), before)
        self.assertEqual(len(before), 3)

    def test_read_only_check_leaves_all_bytes_and_timestamps_intact(self):
        compiler.publish_outputs(self.root, self.staging, self.generated)
        before = snapshot(self.root)
        times = {str(p.relative_to(self.root)): p.stat().st_mtime_ns
                 for p in self.root.rglob('*') if p.is_file()}
        compiler.inspect_outputs(self.root, self.generated, require_complete=True)
        self.assertEqual(snapshot(self.root), before)
        self.assertEqual({str(p.relative_to(self.root)): p.stat().st_mtime_ns
                          for p in self.root.rglob('*') if p.is_file()}, times)

    def test_missing_output_check_rejects_without_creating_anything(self):
        with self.assertRaises(compiler.AssetError):
            compiler.inspect_outputs(self.root, self.generated, require_complete=True)
        self.assertEqual(list(self.root.iterdir()), [])

    def test_preflight_rejects_changed_work_before_creating_missing_outputs(self):
        target = self.root/compiler.MAP_PATH
        target.parent.mkdir(parents=True)
        target.write_bytes(b'previous work must survive')
        before = snapshot(self.root)
        with self.assertRaises(compiler.AssetError):
            compiler.publish_outputs(self.root, self.staging, self.generated)
        self.assertEqual(snapshot(self.root), before)
        self.assertFalse((self.root/compiler.ASSET_ROOT).exists())

    def test_extra_asset_rejects_and_is_not_deleted(self):
        compiler.publish_outputs(self.root, self.staging, self.generated)
        extra = self.root/compiler.ASSET_ROOT/'thumbnails'/'unreviewed.jpg'
        extra.write_bytes(b'preserve this unrelated file')
        before = snapshot(self.root)
        with self.assertRaises(compiler.AssetError):
            compiler.inspect_outputs(self.root, self.generated, require_complete=True)
        self.assertEqual(snapshot(self.root), before)

    def test_output_symlink_and_directory_symlink_are_rejected(self):
        outside = Path(self.temp.name)/'outside'
        outside.mkdir()
        (self.root/'assets').symlink_to(outside, target_is_directory=True)
        with self.assertRaises((compiler.AssetError, compiler.intake.IntakeError, OSError)):
            compiler.publish_outputs(self.root, self.staging, self.generated)
        self.assertEqual(list(outside.iterdir()), [])
        (self.root/'assets').unlink()
        target = self.root/compiler.MAP_PATH
        target.parent.mkdir(parents=True)
        file = outside/'map';file.write_bytes(b'outside original')
        target.symlink_to(file)
        with self.assertRaises(compiler.AssetError):
            compiler.publish_outputs(self.root, self.staging, self.generated)
        self.assertEqual(file.read_bytes(), b'outside original')

    @unittest.skipUnless(hasattr(os, 'mkfifo'), 'FIFO requires POSIX')
    def test_fifo_is_rejected_before_reading(self):
        target = self.root/compiler.MAP_PATH
        target.parent.mkdir(parents=True)
        os.mkfifo(target)
        with self.assertRaises(compiler.AssetError):
            compiler.inspect_outputs(self.root, self.generated, require_complete=False)

    def test_exclusive_creation_cannot_overwrite_a_raced_file(self):
        path = compiler.MAP_PATH
        compiler.exclusive_write(self.root, path, b'owner work')
        with self.assertRaises(FileExistsError):
            compiler.exclusive_write(self.root, path, b'new replacement')
        self.assertEqual((self.root/path).read_bytes(), b'owner work')


if __name__ == '__main__':
    unittest.main()
