#!/usr/bin/env python3
"""Compile reviewed local JPEG resources without changing their source files.

The two output sizes are transport resources, not new editorial photographs.
--check recreates the outputs in a private temporary directory and compares all
bytes. --write accepts only missing outputs or identical existing files.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import sys
import tempfile
import warnings

# The read-only mode must not leave Python cache files in the repository even
# when called without the interpreter's optional -B flag.
sys.dont_write_bytecode = True
import recetas_v3_intake as intake

ROOT = Path(__file__).resolve().parents[1]
SOURCE = PurePosixPath('referencias/recetas/V3/APP_LIGERO_10MB')
SOURCE_COMMIT = '69582c2010222769db8cf646b745aea544684e42'
DATA_SHA256 = 'e5654006ec2c6716b1cac8cdabbdca2f08422d31ba0982e9b3a888c02e874270'
SIDECAR_SHA256 = '4897b7f910684ce37fe6f9ac965a6c78c1004144ed5406a4e98478d5da3a366f'
SIDECAR_NAME = 'MANIFIESTO_FOTOS_INDIVIDUALES_150.json'
ASSET_ROOT = PurePosixPath('assets/recipes-v3')
MAP_PATH = PurePosixPath('src/data/recipePhotoAssets.ts')
MANIFEST_PATH = PurePosixPath('referencias/recetas-v3/manifest-assets.json')
MAX_OUTPUT_BYTES = 2 * 1024 * 1024
SHA1 = re.compile(r'[a-f0-9]{40}\Z')
VARIANTS = {'thumbnail': ('thumbnails', 192), 'detail': ('details', 960)}


class AssetError(ValueError):
    """A controlled error whose public message contains no input content."""


def require(condition: bool) -> None:
    if not condition:
        raise AssetError('Los recursos no superan los controles.')


def sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def blob_sha(payload: bytes) -> str:
    return hashlib.sha1(b'blob ' + str(len(payload)).encode('ascii') + b'\0' + payload).hexdigest()


def source_rows() -> list[dict]:
    """Validate the pinned delivery and independent GitHub photo sidecar."""
    profile = intake.load_profile('app10mb')
    require(profile.data_package.sha256 == DATA_SHA256
            and profile.data_package.size == 1_994_471)
    report = intake.verify_delivery(profile, ROOT / SOURCE,
                                    photos_dir=ROOT / SOURCE / 'fotos')
    require(report['complete'] and report['received_photos'] == 150
            and report['recipes'] == 150 and report['localized_records'] == 750)
    payload = intake._read(ROOT / SOURCE / SIDECAR_NAME, 512 * 1024)
    require(sha256(payload) == SIDECAR_SHA256)
    manifest = intake._json(payload)
    require(isinstance(manifest, dict) and manifest.get('recipe_count') == 150
            and manifest.get('photos_count') == 150)
    zmeta = manifest.get('data_zip')
    require(isinstance(zmeta, dict) and zmeta.get('sha256') == DATA_SHA256
            and zmeta.get('bytes') == profile.data_package.size
            and zmeta.get('path') == (SOURCE / profile.data_package.name).as_posix())
    photos = manifest.get('photos')
    require(isinstance(photos, list) and len(photos) == 150)
    ids, paths, hashes = set(), set(), set()
    rows = []
    for row in photos:
        require(isinstance(row, dict) and set(row) == {
            'recipe_id', 'path', 'bytes', 'sha256', 'git_blob_sha'})
        identity = row['recipe_id']
        require(isinstance(identity, str) and bool(intake.ID_PATTERN.fullmatch(identity)))
        require(row['path'] == (SOURCE / 'fotos' / (identity + '.jpg')).as_posix()
                and type(row['bytes']) is int and 0 < row['bytes'] <= intake.MAX_MEMBER_BYTES
                and isinstance(row['sha256'], str) and bool(intake.SHA_PATTERN.fullmatch(row['sha256']))
                and isinstance(row['git_blob_sha'], str) and bool(SHA1.fullmatch(row['git_blob_sha'])))
        require(identity not in ids and row['path'] not in paths and row['sha256'] not in hashes)
        ids.add(identity); paths.add(row['path']); hashes.add(row['sha256'])
        rows.append(row)
    require(ids == set(report['verified_photo_ids']))
    return sorted(rows, key=lambda row: row['recipe_id'])


def resize_jpeg(payload: bytes, max_width: int) -> tuple[bytes, int, int]:
    """Preserve proportions and pixels; output a fresh RGB JPEG without EXIF."""
    import PIL
    require(PIL.__version__ == '13.0.0' and max_width in (192, 960))
    from PIL import Image, ImageFile
    old_limit, old_truncated = Image.MAX_IMAGE_PIXELS, ImageFile.LOAD_TRUNCATED_IMAGES
    Image.MAX_IMAGE_PIXELS = 24_000_000
    ImageFile.LOAD_TRUNCATED_IMAGES = False
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(payload), formats=['JPEG']) as image:
                require(image.format == 'JPEG' and image.width >= 1536
                        and 0 < image.height <= 12000 and image.width <= 12000
                        and image.width * image.height <= 24_000_000
                        and image.getexif().get(274, 1) == 1)
                image.load()
                width = min(max_width, image.width)
                height = max(1, round(image.height * width / image.width))
                with image.convert('RGB') as rgb:
                    with rgb.resize((width, height), Image.Resampling.LANCZOS) as resized:
                        # A newly allocated image has no inherited EXIF, ICC,
                        # comments or other metadata from the incoming JPEG.
                        with Image.new('RGB', (width, height)) as clean:
                            clean.paste(resized)
                            output = io.BytesIO()
                            clean.save(output, format='JPEG', quality=80, optimize=True,
                                       progressive=True, subsampling=2)
                            encoded = output.getvalue()
        require(0 < len(encoded) <= MAX_OUTPUT_BYTES)
        return encoded, width, height
    finally:
        Image.MAX_IMAGE_PIXELS = old_limit
        ImageFile.LOAD_TRUNCATED_IMAGES = old_truncated


def asset_map(rows: list[dict]) -> bytes:
    lines = [
        '// Generated by scripts/prepare-recipe-photo-assets.py; do not edit by hand.',
        "import type { ImageSourcePropType } from 'react-native';", '',
        'export interface RecipePhotoAsset {',
        '  readonly thumbnail: ImageSourcePropType;',
        '  readonly detail: ImageSourcePropType;',
        '}', '',
        '// Literal requires let Metro include only the two reviewed local sizes.',
        'const assets: ReadonlyMap<string, RecipePhotoAsset> = new Map([',
    ]
    for row in rows:
        identity = row['recipeId']
        require(bool(intake.ID_PATTERN.fullmatch(identity)))
        lines.extend([
            "  ['" + identity + "', Object.freeze({",
            "    thumbnail: require('../../" + row['thumbnail']['path'] + "'),",
            "    detail: require('../../" + row['detail']['path'] + "'),",
            '  })],',
        ])
    lines.extend([
        ']);', '',
        '/** Exact identity lookup; unknown IDs never become a path or URL. */',
        'export function recipePhotoAsset(recipeId: string): RecipePhotoAsset | undefined {',
        '  return assets.get(recipeId);',
        '}', '',
    ])
    return '\n'.join(lines).encode('utf-8')


def build_outputs(temporary: Path) -> dict[PurePosixPath, dict]:
    rows = source_rows()
    generated = {}
    photos = []
    for row in rows:
        payload = intake._read(ROOT / row['path'], intake.MAX_MEMBER_BYTES)
        require(len(payload) == row['bytes'] and sha256(payload) == row['sha256']
                and blob_sha(payload) == row['git_blob_sha'])
        projected = {'recipeId': row['recipe_id'], 'sourceSHA256': row['sha256'],
                     'sourceGitBlobSHA': row['git_blob_sha'], 'sourceBytes': row['bytes']}
        for variant, (folder, width) in VARIANTS.items():
            relative = ASSET_ROOT / folder / (row['recipe_id'] + '.jpg')
            encoded, actual_width, height = resize_jpeg(payload, width)
            target = temporary / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open('xb') as stream:
                stream.write(encoded)
            metadata = {'path': relative.as_posix(), 'sha256': sha256(encoded),
                        'bytes': len(encoded), 'width': actual_width, 'height': height}
            projected[variant] = metadata
            generated[relative] = metadata
        photos.append(projected)
    manifest = {
        'schemaVersion': 1,
        'source': {'zipSHA256': DATA_SHA256, 'sidecarSHA256': SIDECAR_SHA256,
                   'commit': SOURCE_COMMIT},
        'transforms': {variant: {'maxWidth': width, 'quality': 80, 'format': 'JPEG',
                                'progressive': True, 'subsampling': 2}
                       for variant, (_, width) in VARIANTS.items()},
        'photos': photos,
        'totals': {'recipes': 150, 'assets': 300,
                   'sourceBytes': sum(row['bytes'] for row in rows),
                   'thumbnailBytes': sum(row['thumbnail']['bytes'] for row in photos),
                   'detailBytes': sum(row['detail']['bytes'] for row in photos)},
    }
    payloads = {MAP_PATH: asset_map(photos), MANIFEST_PATH:
                (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')}
    for relative, payload in payloads.items():
        target = temporary / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open('xb') as stream:
            stream.write(payload)
        generated[relative] = {'path': relative.as_posix(), 'bytes': len(payload),
                               'sha256': sha256(payload)}
    require(len(generated) == 302)
    return generated


def allowed_output(relative: PurePosixPath) -> bool:
    if relative in (MAP_PATH, MANIFEST_PATH):
        return True
    return (len(relative.parts) == 4 and relative.parts[:2] == ASSET_ROOT.parts
            and relative.parts[2] in ('thumbnails', 'details')
            and relative.suffix == '.jpg'
            and bool(intake.ID_PATTERN.fullmatch(relative.stem)))


def check_parents(root: Path, relative: PurePosixPath) -> None:
    require(allowed_output(relative))
    current = root
    for component in relative.parts[:-1]:
        current = current / component
        try:
            metadata = current.lstat()
        except FileNotFoundError:
            break
        require(stat.S_ISDIR(metadata.st_mode))


def check_asset_inventory(root: Path, expected: set[PurePosixPath]) -> None:
    directory = root / ASSET_ROOT
    if not directory.exists() and not directory.is_symlink():
        return
    gate = intake._gates()
    fd = gate.open_directory(directory)
    os.close(fd)
    count = 0
    for base, directories, files in os.walk(directory, followlinks=False):
        for name in directories:
            path = Path(base) / name
            require(path.parent == directory and name in ('thumbnails', 'details')
                    and not path.is_symlink())
        for name in files:
            count += 1
            require(count <= 300)
            path = Path(base) / name
            relative = PurePosixPath(path.relative_to(root).as_posix())
            require(relative in expected and not path.is_symlink())


def inspect_outputs(root: Path, generated: dict, *, require_complete: bool) -> list[PurePosixPath]:
    require(len(generated) <= 302 and all(allowed_output(path) for path in generated))
    check_asset_inventory(root, set(generated))
    missing = []
    for relative, expected in generated.items():
        check_parents(root, relative)
        path = root / relative
        try:
            metadata = path.lstat()
        except FileNotFoundError:
            missing.append(relative)
            continue
        require(stat.S_ISREG(metadata.st_mode) and metadata.st_size == expected['bytes'])
        payload = intake._read(path, MAX_OUTPUT_BYTES)
        require(sha256(payload) == expected['sha256'])
    require(not require_complete or not missing)
    return missing


def exclusive_write(root: Path, relative: PurePosixPath, payload: bytes) -> None:
    require(allowed_output(relative) and 0 < len(payload) <= MAX_OUTPUT_BYTES)
    fd = intake._gates().open_directory(root)
    try:
        for component in relative.parts[:-1]:
            try:
                os.mkdir(component, mode=0o755, dir_fd=fd)
            except FileExistsError:
                pass
            child = os.open(component, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW,
                            dir_fd=fd)
            os.close(fd)
            fd = child
        output = os.open(relative.name, os.O_WRONLY | os.O_CREAT | os.O_EXCL
                         | os.O_NOFOLLOW, 0o644, dir_fd=fd)
        try:
            with os.fdopen(output, 'wb', closefd=False) as stream:
                stream.write(payload)
                stream.flush()
                os.fsync(stream.fileno())
        finally:
            os.close(output)
    finally:
        os.close(fd)


def publish_outputs(root: Path, temporary: Path, generated: dict) -> None:
    # Reject changes/extra files before creating anything. Originals and every
    # unrelated path are outside this output allowlist.
    missing = set(inspect_outputs(root, generated, require_complete=False))
    order = [path for path in generated if path not in (MAP_PATH, MANIFEST_PATH)]
    order += [MAP_PATH, MANIFEST_PATH]  # Manifest is the final completeness record.
    for relative in order:
        if relative in missing:
            payload = intake._read(temporary / relative, MAX_OUTPUT_BYTES)
            require(len(payload) == generated[relative]['bytes']
                    and sha256(payload) == generated[relative]['sha256'])
            exclusive_write(root, relative, payload)
    inspect_outputs(root, generated, require_complete=True)


def main() -> int:
    parser = argparse.ArgumentParser(description='Compila recursos JPEG revisados; conserva las fuentes.')
    modes = parser.add_mutually_exclusive_group(required=True)
    modes.add_argument('--write', action='store_true')
    modes.add_argument('--check', action='store_true')
    args = parser.parse_args()
    try:
        with tempfile.TemporaryDirectory(prefix='jj-recipe-photo-assets-') as temporary:
            staging = Path(temporary)
            generated = build_outputs(staging)
            if args.write:
                publish_outputs(ROOT, staging, generated)
            else:
                inspect_outputs(ROOT, generated, require_complete=True)
            total = sum(metadata['bytes'] for path, metadata in generated.items()
                        if path not in (MAP_PATH, MANIFEST_PATH))
            print(json.dumps({'status': 'ASSETS_VERIFIED', 'mode': 'write' if args.write else 'check',
                              'recipes': 150, 'assets': 300, 'assetBytes': total,
                              'manifestSHA256': generated[MANIFEST_PATH]['sha256']}))
        return 0
    except (AssetError, intake.IntakeError, OSError, ValueError, TypeError, KeyError,
            RuntimeError, ImportError, RecursionError):
        print('BLOQUEADO: fuentes o recursos no superan los controles.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
