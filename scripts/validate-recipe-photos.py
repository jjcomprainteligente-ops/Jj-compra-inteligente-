#!/usr/bin/env python3
"""Read-only B04 reception gate for photos of the 127 active public recipes.

This validates references and image bytes. It never copies, edits, approves or
publishes images. Documented license/visual references remain operator records,
not legal certification or a visual match independently established by this tool.
Pillow is required only when a candidate image is present; absence fails closed.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import struct
import sys
import warnings
import zlib
from functools import lru_cache

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('jj_photo_source', ROOT / 'scripts/import-recipes-v83.py')
assert SPEC is not None and SPEC.loader is not None
importer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(importer)

LEGACY_IDS = frozenset((
    'arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza',
    'pasta-tomate', 'pollo-papas', 'cuscus-verduras',
))
LANGUAGES = frozenset(('es', 'en', 'de', 'fr'))
ROW_FIELDS = frozenset(('recipeId', 'state', 'asset', 'alt', 'provenance', 'license', 'visualReview'))
ASSET_FIELDS = frozenset(('path', 'sha256', 'bytes', 'width', 'height', 'format'))
MAX_MANIFEST_BYTES = 2 * 1024 * 1024
MAX_IMAGE_BYTES = 32 * 1024 * 1024
MAX_IMAGE_PIXELS = 24_000_000
MAX_IMAGE_SIDE = 12_000
MIN_ORIGINAL_WIDTH = 1536
REQUIRED_DECODER_VERSION = '13.0.0'
FORMATS = {'PNG': frozenset(('.png',)), 'JPEG': frozenset(('.jpg', '.jpeg')),
           'WEBP': frozenset(('.webp',))}


def require(condition: bool) -> None:
    if not condition:
        raise ValueError('Invalid photo manifest or candidate.')


def text(value: object, maximum: int = 1000) -> bool:
    return isinstance(value, str) and 0 < len(value.strip()) <= maximum and not importer.UNSAFE_TEXT.search(value)


@lru_cache(maxsize=1)
def active_recipe_ids() -> frozenset[str]:
    approved, _, _ = importer.validated_public_archive(importer.PUBLIC_ARCHIVE)
    ids = frozenset(recipe['id'] for recipe in approved) | LEGACY_IDS
    require(len(approved) == 120 and len(ids) == 127)
    return ids


def clean_absolute(path: Path) -> Path:
    """Reject symbolic links even in parent components; do not resolve them."""
    require('..' not in path.parts)
    absolute = path.absolute()
    for parent in (absolute, *absolute.parents):
        require(not parent.is_symlink())
    return absolute


def open_directory(path: Path) -> int:
    absolute = clean_absolute(path)
    fd = os.open(absolute.anchor, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        for component in absolute.parts[1:]:
            next_fd = os.open(component, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = next_fd
        return fd
    except BaseException:
        os.close(fd)
        raise


def read_regular_fd(fd: int, maximum: int) -> bytes:
    try:
        before = os.fstat(fd)
        require(stat.S_ISREG(before.st_mode) and 0 < before.st_size <= maximum)
        with os.fdopen(fd, 'rb', closefd=False) as stream:
            payload = stream.read(maximum + 1)
            after = os.fstat(fd)
            require(len(payload) == before.st_size and len(payload) <= maximum
                    and (before.st_size, before.st_mtime_ns, before.st_ino, before.st_dev)
                    == (after.st_size, after.st_mtime_ns, after.st_ino, after.st_dev))
            return payload
    finally:
        os.close(fd)


def read_manifest(path: Path) -> object:
    absolute = clean_absolute(path)
    parent = open_directory(absolute.parent)
    try:
        fd = os.open(absolute.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=parent)
        return importer.bounded_json(read_regular_fd(fd, MAX_MANIFEST_BYTES))
    finally:
        os.close(parent)


def relative_asset_path(value: object) -> PurePosixPath:
    require(isinstance(value, str) and 0 < len(value) <= 500
            and not importer.UNSAFE_TEXT.search(value)
            and not any(character in value for character in ('\\', ':', '\x00', '%', '?', '#')))
    path = PurePosixPath(value)
    # Comparing the exact canonical spelling also rejects doubled separators,
    # leading ./, trailing / and other spellings hidden by PurePosixPath.
    require(bool(path.parts) and not path.is_absolute() and path.as_posix() == value
            and all(part not in ('', '.', '..') for part in path.parts))
    return path


def read_candidate(originals: Path, relative: PurePosixPath) -> bytes:
    fd = open_directory(originals)
    try:
        for component in relative.parts[:-1]:
            next_fd = os.open(component, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = next_fd
        file_fd = os.open(relative.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=fd)
        return read_regular_fd(file_fd, MAX_IMAGE_BYTES)
    finally:
        os.close(fd)


def verify_container(payload: bytes, kind: str) -> None:
    """Reject damaged boundaries that a tolerant image decoder can ignore."""
    if kind == 'JPEG':
        require(payload.startswith(b'\xff\xd8') and payload.endswith(b'\xff\xd9'))
    elif kind == 'WEBP':
        require(len(payload) >= 12 and payload[:4] == b'RIFF' and payload[8:12] == b'WEBP'
                and struct.unpack('<I', payload[4:8])[0] + 8 == len(payload))
    else:
        require(kind == 'PNG' and payload.startswith(b'\x89PNG\r\n\x1a\n'))
        cursor, chunks, saw_data = 8, 0, False
        while cursor < len(payload):
            require(chunks < 4096 and cursor + 12 <= len(payload))
            length = struct.unpack('>I', payload[cursor:cursor + 4])[0]
            tag = payload[cursor + 4:cursor + 8]
            end = cursor + 12 + length
            require(end <= len(payload) and re.fullmatch(b'[A-Za-z]{4}', tag) is not None)
            require(chunks != 0 or (tag == b'IHDR' and length == 13))
            require(chunks == 0 or tag != b'IHDR')
            require(tag in (b'IHDR', b'PLTE', b'IDAT', b'IEND') or tag[0] & 32 != 0)
            content = payload[cursor + 8:cursor + 8 + length]
            require(zlib.crc32(tag + content) & 0xffffffff
                    == struct.unpack('>I', payload[cursor + 8 + length:end])[0])
            saw_data = saw_data or tag == b'IDAT'
            chunks += 1
            cursor = end
            if tag == b'IEND':
                require(length == 0 and saw_data and cursor == len(payload))
                return
        raise ValueError('Invalid image container.')


def inspect_image(payload: bytes, declared: dict) -> None:
    verify_container(payload, declared['format'])
    try:
        import PIL
        require(PIL.__version__ == REQUIRED_DECODER_VERSION)
        from PIL import Image, ImageFile
    except ImportError:
        raise ValueError('Image decoder unavailable.') from None
    old_limit, old_truncated = Image.MAX_IMAGE_PIXELS, ImageFile.LOAD_TRUNCATED_IMAGES
    Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS
    ImageFile.LOAD_TRUNCATED_IMAGES = False
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(payload), formats=list(FORMATS)) as image:
                width, height = image.size
                require(image.format == declared['format'] and width == declared['width']
                        and height == declared['height'] and MIN_ORIGINAL_WIDTH <= width <= MAX_IMAGE_SIDE
                        and 0 < height <= MAX_IMAGE_SIDE and width * height <= MAX_IMAGE_PIXELS)
                require(not getattr(image, 'is_animated', False) and getattr(image, 'n_frames', 1) == 1)
                image.verify()
            # verify() checks the container; decoding separately also rejects
            # truncated data that some format parsers accept at header time.
            with Image.open(io.BytesIO(payload), formats=list(FORMATS)) as image:
                image.load()
                require(image.size == (width, height))
    except Exception:
        # Decoder exceptions may carry input details; keep this boundary generic.
        raise ValueError('Image verification failed.') from None
    finally:
        Image.MAX_IMAGE_PIXELS = old_limit
        ImageFile.LOAD_TRUNCATED_IMAGES = old_truncated


def review_reference(record: object) -> bool:
    require(isinstance(record, dict) and set(record) == {'status', 'reference'})
    require(record['status'] in ('PENDIENTE', 'DOCUMENTADA'))
    if record['status'] == 'PENDIENTE':
        require(record['reference'] is None)
        return False
    require(text(record['reference']))
    return True


def validate_manifest(manifest: object, originals: Path | None = None, *, require_ready: bool = False) -> dict:
    require(isinstance(manifest, dict) and set(manifest) == {'schemaVersion', 'scope', 'recipes'})
    require(type(manifest['schemaVersion']) is int and manifest['schemaVersion'] == 1
            and manifest['scope'] == 'ACTIVE_127')
    rows = manifest['recipes']
    require(isinstance(rows, list) and len(rows) == 127)
    expected = active_recipe_ids()
    seen: set[str] = set()
    image_hashes: set[str] = set()
    missing, candidates, ready = 0, 0, 0
    for row in rows:
        require(isinstance(row, dict) and set(row) == ROW_FIELDS)
        recipe_id = row['recipeId']
        require(isinstance(recipe_id, str) and recipe_id in expected and recipe_id not in seen)
        seen.add(recipe_id)
        require(row['state'] in ('NO_LOCALIZADA', 'PENDIENTE'))
        if row['state'] == 'NO_LOCALIZADA':
            require(all(row[field] is None for field in ('asset', 'alt', 'provenance', 'license', 'visualReview')))
            missing += 1
            continue
        candidates += 1
        asset = row['asset']
        require(isinstance(asset, dict) and set(asset) == ASSET_FIELDS)
        relative = relative_asset_path(asset['path'])
        require(isinstance(asset['format'], str) and asset['format'] in FORMATS
                and relative.suffix.lower() in FORMATS[asset['format']])
        require(isinstance(asset['sha256'], str) and re.fullmatch(r'[a-f0-9]{64}', asset['sha256']) is not None)
        require(type(asset['bytes']) is int and 0 < asset['bytes'] <= MAX_IMAGE_BYTES)
        require(type(asset['width']) is int and MIN_ORIGINAL_WIDTH <= asset['width'] <= MAX_IMAGE_SIDE
                and type(asset['height']) is int and 0 < asset['height'] <= MAX_IMAGE_SIDE
                and asset['width'] * asset['height'] <= MAX_IMAGE_PIXELS)
        require(isinstance(row['alt'], dict) and set(row['alt']) == LANGUAGES
                and all(text(value, 500) for value in row['alt'].values()))
        require(isinstance(row['provenance'], dict) and set(row['provenance']) == {'kind', 'reference'}
                and row['provenance']['kind'] == 'ORIGINAL_RECIPE_IMAGE'
                and text(row['provenance']['reference']))
        license_documented = review_reference(row['license'])
        visual_documented = review_reference(row['visualReview'])
        require(originals is not None)
        payload = read_candidate(originals, relative)
        require(len(payload) == asset['bytes'] and hashlib.sha256(payload).hexdigest() == asset['sha256']
                and asset['sha256'] not in image_hashes)
        image_hashes.add(asset['sha256'])
        inspect_image(payload, asset)
        ready += int(license_documented and visual_documented)
    require(seen == expected)
    if require_ready:
        require(ready == 127)
    return {'schemaVersion': 1, 'scope': 'ACTIVE_127', 'recipeIds': 127,
            'missingOriginals': missing, 'candidateOriginals': candidates,
            'readyForManualApproval': ready, 'automaticallyApproved': 0,
            'imagesPublished': 0, 'imageBytesModified': False,
            'licenseOrVisualMatchCertifiedByTool': False}


class ReceptionParser(argparse.ArgumentParser):
    def error(self, message: str) -> None:
        self.exit(2, 'Photo reception failed: invalid command arguments.\n')


def main(argv: list[str] | None = None) -> int:
    parser = ReceptionParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--originals-dir', type=Path)
    parser.add_argument('--require-ready', action='store_true')
    args = parser.parse_args(argv)
    try:
        summary = validate_manifest(read_manifest(args.manifest), args.originals_dir,
                                    require_ready=args.require_ready)
    except (ValueError, TypeError, KeyError, OSError, OverflowError, RecursionError):
        print('Photo reception failed: invalid manifest, source or pending reception gate.', file=sys.stderr)
        return 2
    print(json.dumps(summary, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
