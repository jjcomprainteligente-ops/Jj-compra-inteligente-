"""Temporary synthetic images only; no recipe photos or app assets are created."""
import contextlib
import copy
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import stat
import struct
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zlib

import PIL
from PIL import Image, ImageFile

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location('jj_photo_gate', ROOT / 'scripts/validate-recipe-photos.py')
gate = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(gate)


def missing_manifest():
    return {'schemaVersion': 1, 'scope': 'ACTIVE_127', 'recipes': [
        {'recipeId': recipe_id, 'state': 'NO_LOCALIZADA', 'asset': None, 'alt': None,
         'provenance': None, 'license': None, 'visualReview': None}
        for recipe_id in sorted(gate.active_recipe_ids())
    ]}


def image_bytes(kind='PNG', size=(1536, 64), color=(30, 90, 50)):
    output = io.BytesIO()
    with Image.new('RGB', size, color) as image:
        image.save(output, format=kind)
    return output.getvalue()


def png_chunk(kind, payload):
    return struct.pack('>I', len(payload)) + kind + payload + struct.pack('>I', zlib.crc32(kind + payload) & 0xffffffff)


class PhotoReceptionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='jj-photos-test-')
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        self.manifest = missing_manifest()

    def candidate(self, *, index=0, kind='PNG', size=(1536, 64), payload=None,
                  filename=None, documented=False, color=(30, 90, 50)):
        suffix = {'PNG': '.png', 'JPEG': '.jpg', 'WEBP': '.webp'}[kind]
        name = filename or f'synthetic-{index}{suffix}'
        data = image_bytes(kind, size, color) if payload is None else payload
        file = self.folder / name
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(data)
        reference = {'status': 'DOCUMENTADA', 'reference': 'Synthetic test reference'} if documented else {
            'status': 'PENDIENTE', 'reference': None}
        self.manifest['recipes'][index].update({
            'state': 'PENDIENTE',
            'asset': {'path': name, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data),
                      'width': size[0], 'height': size[1], 'format': kind},
            'alt': {language: 'Temporary synthetic fixture, not an app image' for language in gate.LANGUAGES},
            'provenance': {'kind': 'ORIGINAL_RECIPE_IMAGE', 'reference': 'Temporary test data only'},
            'license': copy.deepcopy(reference), 'visualReview': copy.deepcopy(reference),
        })
        return file

    def test_all_127_missing_is_valid_inventory_without_decoder_or_originals(self):
        with patch.object(gate, 'inspect_image', side_effect=AssertionError('No image should be decoded')):
            result = gate.validate_manifest(self.manifest)
        self.assertEqual(result['recipeIds'], 127)
        self.assertEqual(result['missingOriginals'], 127)
        self.assertEqual(result['candidateOriginals'], 0)
        self.assertEqual(result['automaticallyApproved'], 0)
        self.assertFalse(result['licenseOrVisualMatchCertifiedByTool'])

    def test_require_ready_fails_for_missing_photos(self):
        with self.assertRaises(ValueError):
            gate.validate_manifest(self.manifest, require_ready=True)

    def test_exact_catalogue_rejects_subset_duplicate_unknown_and_held_id(self):
        for change in ['subset', 'duplicate', 'unknown', 'held']:
            with self.subTest(change=change):
                manifest = missing_manifest()
                if change == 'subset':
                    manifest['recipes'].pop()
                elif change == 'duplicate':
                    manifest['recipes'][-1]['recipeId'] = manifest['recipes'][0]['recipeId']
                else:
                    manifest['recipes'][0]['recipeId'] = 'JJ-NOT-PRESENT-999' if change == 'unknown' else 'JJ-E03-011'
                with self.assertRaises(ValueError):
                    gate.validate_manifest(manifest)

    def test_original_legacy_identities_are_all_retained(self):
        self.assertEqual(gate.LEGACY_IDS, {
            'arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza',
            'pasta-tomate', 'pollo-papas', 'cuscus-verduras',
        })
        self.assertEqual(len(gate.active_recipe_ids()), 127)

    def test_extra_fields_approval_state_and_nonnull_missing_fields_are_rejected(self):
        mutations = [lambda row: row.update(extra='x'), lambda row: row.update(state='APROBADA'),
                     lambda row: row.update(alt={}), lambda row: row.update(asset={})]
        for mutate in mutations:
            manifest = missing_manifest()
            mutate(manifest['recipes'][0])
            with self.assertRaises(ValueError):
                gate.validate_manifest(manifest)

    def test_real_decode_accepts_png_jpeg_webp_as_pending_without_approval(self):
        for index, kind in enumerate(['PNG', 'JPEG', 'WEBP']):
            self.candidate(index=index, kind=kind)
        result = gate.validate_manifest(self.manifest, self.folder)
        self.assertEqual(result['candidateOriginals'], 3)
        self.assertEqual(result['missingOriginals'], 124)
        self.assertEqual(result['readyForManualApproval'], 0)
        self.assertEqual(result['automaticallyApproved'], 0)

    def test_documented_references_only_prepare_manual_review(self):
        self.candidate(documented=True)
        result = gate.validate_manifest(self.manifest, self.folder)
        self.assertEqual(result['readyForManualApproval'], 1)
        self.assertEqual(result['automaticallyApproved'], 0)
        self.assertEqual(self.manifest['recipes'][0]['state'], 'PENDIENTE')
        with self.assertRaises(ValueError):
            gate.validate_manifest(self.manifest, self.folder, require_ready=True)

    def test_fully_received_catalogue_still_does_not_approve_or_publish(self):
        for index in range(127):
            self.candidate(index=index, size=(1536, 16), documented=True,
                           color=(index, (index * 17) % 256, (index * 29) % 256))
        result = gate.validate_manifest(self.manifest, self.folder, require_ready=True)
        self.assertEqual(result['readyForManualApproval'], 127)
        self.assertEqual(result['imagesPublished'], 0)
        self.assertEqual(result['automaticallyApproved'], 0)

    def test_hash_size_declared_dimensions_and_real_format_must_match(self):
        file = self.candidate()
        original = copy.deepcopy(self.manifest)
        for field, bad in [('sha256', '0' * 64), ('bytes', file.stat().st_size + 1),
                           ('width', 1537), ('height', 65), ('format', 'JPEG')]:
            with self.subTest(field=field):
                self.manifest = copy.deepcopy(original)
                self.manifest['recipes'][0]['asset'][field] = bad
                with self.assertRaises(ValueError):
                    gate.validate_manifest(self.manifest, self.folder)

    def test_insufficient_width_or_excessive_declared_pixels_is_rejected(self):
        self.candidate(size=(1535, 64))
        with self.assertRaises(ValueError):
            gate.validate_manifest(self.manifest, self.folder)
        self.candidate()
        self.manifest['recipes'][0]['asset'].update(width=12000, height=12000)
        with self.assertRaises(ValueError):
            gate.validate_manifest(self.manifest, self.folder)

    def test_same_image_cannot_be_assigned_to_multiple_recipes(self):
        self.candidate(index=0)
        self.candidate(index=1)
        with self.assertRaises(ValueError):
            gate.validate_manifest(self.manifest, self.folder)

    def test_all_four_alt_languages_and_original_provenance_are_required(self):
        self.candidate()
        valid = copy.deepcopy(self.manifest)
        for mutation in ['missingLanguage', 'blankAlt', 'screenshot', 'missingReference']:
            self.manifest = copy.deepcopy(valid)
            row = self.manifest['recipes'][0]
            if mutation == 'missingLanguage':
                del row['alt']['de']
            elif mutation == 'blankAlt':
                row['alt']['fr'] = ' '
            elif mutation == 'screenshot':
                row['provenance']['kind'] = 'SCREENSHOT'
            else:
                row['provenance']['reference'] = ''
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                gate.validate_manifest(self.manifest, self.folder)

    def test_documented_review_requires_reference_and_pending_requires_null(self):
        self.candidate()
        valid = copy.deepcopy(self.manifest)
        for name, review in [('license', {'status': 'DOCUMENTADA', 'reference': None}),
                             ('visualReview', {'status': 'PENDIENTE', 'reference': 'Unconfirmed'}),
                             ('license', {'status': 'APROBADA', 'reference': 'not accepted'})]:
            self.manifest = copy.deepcopy(valid)
            self.manifest['recipes'][0][name] = review
            with self.assertRaises(ValueError):
                gate.validate_manifest(self.manifest, self.folder)

    def test_traversal_urls_ambiguous_paths_and_backslashes_are_rejected(self):
        self.candidate()
        for value in ['../outside.png', '/tmp/outside.png', 'https://example.test/a.png',
                      'a\\b.png', './a.png', 'a//b.png', 'a/', 'a%2fb.png', 'a.png?x=1', 'a.png#x']:
            self.manifest['recipes'][0]['asset']['path'] = value
            with self.subTest(value=value), self.assertRaises(ValueError):
                gate.validate_manifest(self.manifest, self.folder)

    def test_symlink_file_directory_and_originals_root_are_rejected(self):
        file = self.candidate()
        link = self.folder / 'linked.png'
        link.symlink_to(file)
        self.manifest['recipes'][0]['asset']['path'] = link.name
        with self.assertRaises((ValueError, OSError)):
            gate.validate_manifest(self.manifest, self.folder)
        self.manifest['recipes'][0]['asset']['path'] = file.name
        root_link = self.folder / 'root-link'
        root_link.symlink_to(self.folder, target_is_directory=True)
        with self.assertRaises(ValueError):
            gate.validate_manifest(self.manifest, root_link)
        sub_link = self.folder / 'sub-link'
        sub_link.symlink_to(self.folder, target_is_directory=True)
        self.manifest['recipes'][0]['asset']['path'] = 'sub-link/' + file.name
        with self.assertRaises((ValueError, OSError)):
            gate.validate_manifest(self.manifest, self.folder)

    def test_missing_or_oversized_file_fails_without_decoding(self):
        file = self.candidate()
        data = file.read_bytes()
        file.unlink()
        with self.assertRaises(OSError):
            gate.validate_manifest(self.manifest, self.folder)
        file.write_bytes(data)
        with file.open('r+b') as stream:
            stream.truncate(gate.MAX_IMAGE_BYTES + 1)
        with patch.object(gate, 'inspect_image', side_effect=AssertionError('Must reject before decode')):
            with self.assertRaises(ValueError):
                gate.validate_manifest(self.manifest, self.folder)

    def test_original_bytes_and_mtime_remain_unchanged(self):
        file = self.candidate(filename='nested/photo.png')
        before = (file.read_bytes(), file.stat().st_mtime_ns)
        manifest_before = copy.deepcopy(self.manifest)
        gate.validate_manifest(self.manifest, self.folder)
        self.assertEqual(before, (file.read_bytes(), file.stat().st_mtime_ns))
        self.assertEqual(self.manifest, manifest_before)

    def test_truncated_png_and_jpeg_are_rejected_even_if_global_allows_truncation(self):
        old = ImageFile.LOAD_TRUNCATED_IMAGES
        ImageFile.LOAD_TRUNCATED_IMAGES = True
        try:
            for kind in ['PNG', 'JPEG']:
                payload = image_bytes(kind)[:-30]
                self.candidate(kind=kind, payload=payload)
                with self.subTest(kind=kind), self.assertRaises(ValueError):
                    gate.validate_manifest(self.manifest, self.folder)
                self.assertTrue(ImageFile.LOAD_TRUNCATED_IMAGES)
        finally:
            ImageFile.LOAD_TRUNCATED_IMAGES = old

    def test_png_crc_corruption_is_rejected(self):
        data = bytearray(image_bytes())
        data[-1] ^= 1
        self.candidate(payload=bytes(data))
        with self.assertRaises(ValueError):
            gate.validate_manifest(self.manifest, self.folder)

    def test_real_oversized_dimensions_are_rejected_and_decoder_globals_restore(self):
        data = b'\x89PNG\r\n\x1a\n' + png_chunk(b'IHDR', struct.pack('>IIBBBBB', 100000, 100000, 8, 2, 0, 0, 0))
        data += png_chunk(b'IDAT', zlib.compress(b'\x00\x00\x00\x00')) + png_chunk(b'IEND', b'')
        self.candidate(payload=data)
        old = Image.MAX_IMAGE_PIXELS
        with self.assertRaises(ValueError):
            gate.validate_manifest(self.manifest, self.folder)
        self.assertEqual(Image.MAX_IMAGE_PIXELS, old)

    def test_animated_png_is_rejected(self):
        output = io.BytesIO()
        with Image.new('RGB', (1536, 64), 'red') as first, Image.new('RGB', (1536, 64), 'blue') as second:
            first.save(output, format='PNG', save_all=True, append_images=[second], duration=100, loop=0)
        self.candidate(payload=output.getvalue())
        with self.assertRaises(ValueError):
            gate.validate_manifest(self.manifest, self.folder)

    def test_decoder_absence_fails_closed_only_for_actual_candidate(self):
        self.candidate()
        with patch.dict(sys.modules, {'PIL': None}):
            with self.assertRaises(ValueError):
                gate.validate_manifest(self.manifest, self.folder)

    def test_old_decoder_version_is_rejected_before_opening_an_image(self):
        self.candidate()
        with patch.object(PIL, '__version__', '12.3.0'), patch.object(Image, 'open') as opened:
            with self.assertRaises(ValueError):
                gate.validate_manifest(self.manifest, self.folder)
        opened.assert_not_called()

    def test_directory_descriptor_is_closed_when_not_a_regular_file(self):
        fd = os.open(self.folder, os.O_RDONLY | os.O_DIRECTORY)
        with self.assertRaises(ValueError):
            gate.read_regular_fd(fd, gate.MAX_IMAGE_BYTES)
        with self.assertRaises(OSError):
            os.fstat(fd)

    def test_forged_container_extension_and_nonimage_payload_are_rejected(self):
        self.candidate(payload=b'not an image')
        with self.assertRaises(ValueError):
            gate.validate_manifest(self.manifest, self.folder)
        self.candidate(payload=image_bytes('JPEG'))
        with self.assertRaises(ValueError):
            gate.validate_manifest(self.manifest, self.folder)

    def test_manifest_duplicate_json_unsafe_keys_and_nonfinite_values_are_rejected(self):
        path = self.folder / 'manifest.json'
        for raw in [b'{"schemaVersion":1,"schemaVersion":1}', b'{"__proto__":{}}', b'{"value":NaN}']:
            path.write_bytes(raw)
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                gate.read_manifest(path)

    def test_boolean_version_and_invalid_scope_are_rejected(self):
        for field, value in [('schemaVersion', True), ('schemaVersion', 2), ('scope', 'ALL_150')]:
            manifest = missing_manifest()
            manifest[field] = value
            with self.assertRaises(ValueError):
                gate.validate_manifest(manifest)

    def test_manifest_symlink_and_size_cap_are_rejected(self):
        path = self.folder / 'manifest.json'
        path.write_text(json.dumps(self.manifest))
        link = self.folder / 'link.json'
        link.symlink_to(path)
        with self.assertRaises(ValueError):
            gate.read_manifest(link)
        with path.open('r+b') as stream:
            stream.truncate(gate.MAX_MANIFEST_BYTES + 1)
        with self.assertRaises(ValueError):
            gate.read_manifest(path)

    def test_cli_reports_counts_without_paths_or_automatic_approval(self):
        path = self.folder / 'PRIVATE_PATH_SENTINEL.json'
        path.write_text(json.dumps(self.manifest))
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            result = gate.main(['--manifest', str(path)])
        self.assertEqual(result, 0)
        summary = json.loads(stdout.getvalue())
        self.assertEqual(summary['missingOriginals'], 127)
        self.assertEqual(summary['automaticallyApproved'], 0)
        self.assertNotIn('PRIVATE_PATH_SENTINEL', stdout.getvalue())
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            result = gate.main(['--manifest', str(path), '--require-ready'])
        self.assertEqual(result, 2)
        self.assertNotIn('PRIVATE_PATH_SENTINEL', stderr.getvalue())

    def test_cli_invalid_arguments_do_not_echo_private_values(self):
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr), self.assertRaises(SystemExit) as raised:
            gate.main(['--manifest', 'PRIVATE_PATH_SENTINEL', '--PRIVATE_SECRET_SENTINEL'])
        self.assertEqual(raised.exception.code, 2)
        self.assertNotIn('PRIVATE_', stderr.getvalue())

    def test_fifo_manifest_is_rejected_without_waiting_for_a_writer(self):
        path = self.folder / 'manifest.json'
        os.mkfifo(path, mode=0o600)
        result = subprocess.run([sys.executable, str(ROOT / 'scripts/validate-recipe-photos.py'),
                                 '--manifest', str(path)], capture_output=True, timeout=3)
        self.assertEqual(result.returncode, 2)
        self.assertTrue(stat.S_ISFIFO(path.stat().st_mode))

    def test_fifo_candidate_is_rejected_without_waiting_for_a_writer(self):
        file = self.candidate()
        file.unlink()
        os.mkfifo(file, mode=0o600)
        manifest = self.folder / 'manifest.json'
        manifest.write_text(json.dumps(self.manifest))
        result = subprocess.run([sys.executable, str(ROOT / 'scripts/validate-recipe-photos.py'),
                                 '--manifest', str(manifest), '--originals-dir', str(self.folder)],
                                capture_output=True, timeout=3)
        self.assertEqual(result.returncode, 2)
        self.assertTrue(stat.S_ISFIFO(file.stat().st_mode))


if __name__ == '__main__':
    unittest.main()
