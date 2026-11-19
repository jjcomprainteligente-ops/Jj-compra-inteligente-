"""Bounded, offline V3 reception. It never modifies the application or originals.

The four delivery profiles have different pinned package and image hashes. Loose
photos are an explicit alternative to photo ZIPs, using the same pinned data ZIP.
Partial audits are reports only; staging requires a complete, revalidated set.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from decimal import Decimal
from functools import lru_cache
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
from typing import Callable
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[1]
LANGUAGES = frozenset(('es', 'en', 'de', 'fr', 'bg'))
MAX_ZIP_BYTES = 80 * 1024 * 1024
MAX_MEMBER_BYTES = 32 * 1024 * 1024
MAX_JSON_BYTES = 8 * 1024 * 1024
MAX_DATA_EXPANDED = 64 * 1024 * 1024
MAX_TOTAL_EXPANDED = 512 * 1024 * 1024
MAX_ENTRIES = 2000
MAX_RATIO = 2000
ID_PATTERN = re.compile(r'JJ-[A-Z0-9]+(?:-[A-Z0-9]+)*\Z')
SHA_PATTERN = re.compile(r'[a-f0-9]{64}\Z')


class IntakeError(ValueError):
    """Controlled rejection; messages never include absolute input paths."""


@dataclass(frozen=True)
class Package:
    name: str
    size: int
    sha256: str
    image_count: int | None = None


@dataclass(frozen=True)
class Profile:
    name: str
    data_package: Package
    photo_packages: tuple[Package, ...]
    recipe_entry: str
    photo_entry: str
    expected_count: int = 150


@dataclass
class _Budget:
    entries: int = 0
    expanded: int = 0

    def add(self, entries: int, expanded: int) -> None:
        _require(entries >= 0 and expanded >= 0, 'Límites de archivo inválidos.')
        _require(self.entries + entries <= MAX_ENTRIES, 'Demasiados archivos.')
        _require(self.expanded + expanded <= MAX_TOTAL_EXPANDED, 'Entrega demasiado grande.')
        self.entries += entries
        self.expanded += expanded


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise IntakeError(message)


def _text(value: object, maximum: int) -> bool:
    return isinstance(value, str) and 0 < len(value.strip()) <= maximum


def _localized_contents(row: dict) -> None:
    ingredients, steps = row['ingredients'], row['steps']
    _require(len(ingredients) <= 2000 and len(steps) <= 2000,
             'Ficha localizada fuera de los límites.')
    for ingredient in ingredients:
        _require(isinstance(ingredient, dict)
                 and {'line', 'name', 'quantity', 'unit'} <= set(ingredient),
                 'Ingrediente incompleto o no válido.')
        _require(type(ingredient['line']) is int and 1 <= ingredient['line'] <= 2000
                 and _text(ingredient['name'], 2000), 'Ingrediente incompleto o no válido.')
        quantity, unit = ingredient['quantity'], ingredient['unit']
        # Preserve the explicit unmeasured pair (e.g. salt to taste); never infer
        # a numeric amount or convert an unfamiliar culinary unit here.
        unmeasured = quantity is None and unit is None
        numeric = ((type(quantity) is int or isinstance(quantity, Decimal))
                   and 0 < quantity <= 1_000_000_000 and _text(unit, 120))
        _require(unmeasured or numeric, 'Cantidad o unidad de ingrediente no válida.')
    _require(all(_text(step, 20000) for step in steps), 'Paso de receta no válido.')
    if 'warnings' in row:
        _require(isinstance(row['warnings'], list) and len(row['warnings']) <= 2000
                 and all(_text(warning, 20000) for warning in row['warnings']),
                 'Advertencias de receta no válidas.')


@lru_cache(maxsize=1)
def _gates():
    # Trusted repository modules, never modules selected by an incoming package.
    path = ROOT / 'scripts/validate-recipe-photos.py'
    spec = importlib.util.spec_from_file_location('jj_v3_existing_photo_gate', path)
    if spec is None or spec.loader is None:
        raise IntakeError('No está disponible el control de imágenes.')
    gate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gate)
    return gate


def _json(payload: bytes):
    _require(len(payload) <= MAX_JSON_BYTES, 'JSON demasiado grande.')
    try:
        return _gates().importer.bounded_json(payload)
    except (UnicodeError, ValueError, TypeError, RecursionError) as error:
        raise IntakeError('JSON inválido o fuera de los límites.') from error


def _relative(value: object, *, directory: bool = False) -> PurePosixPath:
    _require(isinstance(value, str) and 0 < len(value) <= 500, 'Ruta no válida.')
    spelling = value[:-1] if directory and value.endswith('/') else value
    _require(not any(c in spelling for c in ('\\', ':', '\0', '%', '?', '#')),
             'Ruta no válida.')
    _require(not _gates().importer.UNSAFE_TEXT.search(spelling), 'Ruta no válida.')
    path = PurePosixPath(spelling)
    _require(bool(path.parts) and not path.is_absolute() and path.as_posix() == spelling
             and all(c not in ('', '.', '..') for c in path.parts), 'Ruta no válida.')
    return path


def _read(path: Path, maximum: int) -> bytes:
    try:
        gate = _gates()
        absolute = gate.clean_absolute(Path(path))
        parent = gate.open_directory(absolute.parent)
        try:
            fd = os.open(absolute.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK,
                         dir_fd=parent)
            return gate.read_regular_fd(fd, maximum)
        finally:
            os.close(parent)
    except (OSError, ValueError) as error:
        raise IntakeError('Archivo ausente, no regular, enlazado o fuera de los límites.') from error


def _package(package: Package) -> None:
    _require(isinstance(package, Package), 'Paquete no válido.')
    path = _relative(package.name)
    _require(len(path.parts) == 1 and path.suffix.lower() == '.zip', 'Paquete no válido.')
    _require(type(package.size) is int and 0 < package.size <= MAX_ZIP_BYTES,
             'Tamaño de paquete no válido.')
    _require(isinstance(package.sha256, str) and bool(SHA_PATTERN.fullmatch(package.sha256)),
             'Hash de paquete no válido.')
    _require(package.image_count is None or (type(package.image_count) is int
             and package.image_count >= 0), 'Conteo de paquete no válido.')


def _profile(profile: Profile) -> None:
    _require(isinstance(profile, Profile) and isinstance(profile.photo_packages, tuple),
             'Perfil no válido.')
    _require(type(profile.expected_count) is int and 1 <= profile.expected_count <= 1000,
             'Conteo de catálogo no válido.')
    _package(profile.data_package)
    for package in profile.photo_packages:
        _package(package)
    names = [profile.data_package.name, *(p.name for p in profile.photo_packages)]
    _require(len(names) == len(set(names)), 'Paquetes repetidos.')
    _relative(profile.recipe_entry)
    _relative(profile.photo_entry)
    _require(profile.recipe_entry != profile.photo_entry, 'Entradas de datos repetidas.')


def load_profile(name: str, root: Path = ROOT) -> Profile:
    base = Path(root) / 'referencias/recetas/V3'
    manifest_paths = {
        'original': 'MANIFIESTO_ENTREGA_V3.json',
        'github16': 'MANIFIESTO_GITHUB_16_PARTES.json',
        'v3b': 'MANIFIESTO_ENTREGA_V3B_LIGERA.json',
        'app10mb': 'APP_LIGERO_10MB/MANIFIESTO_APP_LIGERO_10MB.json',
    }
    _require(name in manifest_paths, 'Perfil desconocido.')
    manifest = _json(_read(base / manifest_paths[name], MAX_JSON_BYTES))
    _require(isinstance(manifest, dict), 'Manifiesto de entrega no válido.')
    try:
        if name in ('original', 'v3b'):
            rows = manifest['files']
            key = 'name' if name == 'original' else 'file'
            _require(isinstance(rows, list) and len(rows) == (6 if name == 'original' else 11),
                     'Número de paquetes incorrecto.')
            packages = tuple(Package(r[key], r['bytes'], r['sha256'],
                                     None if i == 0 else (30 if name == 'original' else r['count']))
                             for i, r in enumerate(rows))
        else:
            row = manifest['recipe_data_zip']
            data = Package(row['name'], row['size_bytes'], row['sha256'])
            rows = manifest['parts']
            _require(isinstance(rows, list) and len(rows) == (16 if name == 'github16' else 10),
                     'Número de paquetes incorrecto.')
            packages = (data, *(Package(r['filename'], r['size_bytes'], r['sha256'],
                                       r['image_count']) for r in rows))
        result = Profile(name, packages[0], tuple(packages[1:]),
                         'datos/recetas_150_5_idiomas_editorial_comercial_v3b.json'
                         if name == 'v3b' else 'datos/recetas_150_5_idiomas_editorial_comercial_v3.json',
                         'datos/manifest_photos_150_SHA256_V3B.json'
                         if name == 'v3b' else 'datos/manifest_photos_150_SHA256_V3.json')
    except (KeyError, TypeError, IndexError) as error:
        raise IntakeError('Manifiesto de entrega incompleto.') from error
    _profile(result)
    _require(sum(p.image_count or 0 for p in result.photo_packages) == 150,
             'El perfil debe declarar 150 fotografías.')
    return result


def _central_directory(payload: bytes) -> None:
    """Bound ZipInfo allocation before handing an untrusted ZIP to zipfile.

    These small, single-disk deliveries do not need ZIP64 or self-extracting ZIPs.
    Count actual central-directory records too: the EOCD count alone can lie.
    """
    end = payload.rfind(b'PK\x05\x06', max(0, len(payload) - 65557))
    _require(end >= 0 and end + 22 <= len(payload), 'Final de ZIP no válido.')
    disk, central_disk, disk_entries, entries, size, offset, comment = struct.unpack_from(
        '<4H2IH', payload, end + 4)
    _require(disk == central_disk == 0 and disk_entries == entries
             and entries <= MAX_ENTRIES and size != 0xffffffff and offset != 0xffffffff
             and end + 22 + comment == len(payload) and offset + size == end,
             'Directorio ZIP no permitido.')
    cursor, count = offset, 0
    while cursor < end:
        _require(count < MAX_ENTRIES and cursor + 46 <= end
                 and payload[cursor:cursor + 4] == b'PK\x01\x02',
                 'Directorio ZIP no válido o demasiado grande.')
        name, extra, note = struct.unpack_from('<3H', payload, cursor + 28)
        _require(0 < name <= 500, 'Nombre de miembro ZIP fuera de los límites.')
        cursor += 46 + name + extra + note
        _require(cursor <= end, 'Directorio ZIP truncado.')
        count += 1
    _require(cursor == end and count == entries, 'Conteo central ZIP incoherente.')


def _zip(payload: bytes, budget: _Budget, *, data: bool) -> zipfile.ZipFile:
    _central_directory(payload)
    try:
        archive = zipfile.ZipFile(io.BytesIO(payload))
        infos = archive.infolist()
        _require(len(infos) <= MAX_ENTRIES, 'Demasiados miembros ZIP.')
        expanded = sum(i.file_size for i in infos)
        _require(not data or expanded <= MAX_DATA_EXPANDED, 'ZIP de datos demasiado grande.')
        budget.add(len(infos), expanded)
        names = set()
        for info in infos:
            _require(info.orig_filename == info.filename, 'Nombre de miembro ZIP no válido.')
            path = _relative(info.filename, directory=info.is_dir())
            normalized = path.as_posix()
            _require(normalized not in names, 'Miembro ZIP repetido.')
            names.add(normalized)
            kind = stat.S_IFMT(info.external_attr >> 16)
            _require(kind in (0, stat.S_IFDIR if info.is_dir() else stat.S_IFREG),
                     'Miembro ZIP no regular.')
            _require(not info.flag_bits & 1, 'ZIP cifrado no permitido.')
            _require(info.compress_type in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED),
                     'Compresión ZIP no permitida.')
            _require(0 <= info.file_size <= MAX_MEMBER_BYTES
                     and info.file_size <= max(info.compress_size, 1) * MAX_RATIO,
                     'Miembro ZIP fuera de los límites.')
        return archive
    except BaseException:
        if 'archive' in locals():
            archive.close()
        raise


def _member(archive: zipfile.ZipFile, info: zipfile.ZipInfo, *, keep: bool) -> bytes:
    chunks = []
    size = 0
    with archive.open(info) as stream:
        while chunk := stream.read(1024 * 1024):
            size += len(chunk)
            _require(size <= info.file_size and size <= MAX_MEMBER_BYTES,
                     'Miembro ZIP fuera de los límites.')
            if keep:
                chunks.append(chunk)
    _require(size == info.file_size, 'Miembro ZIP truncado.')
    return b''.join(chunks)


def _payload(input_dir: Path, package: Package) -> bytes:
    payload = _read(input_dir / package.name, MAX_ZIP_BYTES)
    _require(len(payload) == package.size and hashlib.sha256(payload).hexdigest() == package.sha256,
             'El paquete no coincide con el perfil elegido.')
    return payload


def _data(profile: Profile, input_dir: Path, budget: _Budget):
    raw = {}
    with _zip(_payload(input_dir, profile.data_package), budget, data=True) as archive:
        for info in archive.infolist():
            if not info.is_dir():
                wanted = info.filename in (profile.recipe_entry, profile.photo_entry)
                value = _member(archive, info, keep=wanted)
                if wanted:
                    raw[info.filename] = value
    _require(set(raw) == {profile.recipe_entry, profile.photo_entry}, 'Faltan los datos del catálogo.')
    recipes = _json(raw[profile.recipe_entry])
    photos = _json(raw[profile.photo_entry])
    _require(isinstance(recipes, list) and isinstance(photos, list)
             and len(recipes) == len(photos) == profile.expected_count,
             'Conteo de recetas o fotografías incorrecto.')
    by_id = {}
    positions = set()
    for recipe in recipes:
        _require(isinstance(recipe, dict), 'Receta no válida.')
        rid = recipe.get('recipe_id')
        _require(isinstance(rid, str) and len(rid) <= 120 and bool(ID_PATTERN.fullmatch(rid))
                 and rid not in by_id, 'ID de receta inválido o repetido.')
        position = recipe.get('position')
        _require(type(position) is int and 1 <= position <= profile.expected_count
                 and position not in positions, 'Posición de receta inválida o repetida.')
        positions.add(position)
        localized = recipe.get('localized')
        _require(isinstance(localized, dict) and set(localized) == LANGUAGES,
                 'Idiomas incompletos.')
        for language, row in localized.items():
            _require(isinstance(row, dict) and row.get('recipe_id') == rid
                     and row.get('language') == language
                     and isinstance(row.get('title'), str) and bool(row['title'].strip())
                     and isinstance(row.get('ingredients'), list) and bool(row['ingredients'])
                     and isinstance(row.get('steps'), list) and bool(row['steps']),
                     'Ficha localizada incompleta o incoherente.')
            _localized_contents(row)
        _require(recipe.get('can_claim_allergen_safe') is False
                 and recipe.get('can_publish_real_price') is False,
                 'La fuente no debe certificar alérgenos ni precios reales.')
        for flag in ('can_publish_recipe_text', 'can_publish_photo'):
            _require(flag not in recipe or type(recipe[flag]) is bool, 'Estado editorial no válido.')
        by_id[rid] = recipe
    photo_by_path = {}
    photo_ids = set()
    hashes = set()
    for photo in photos:
        _require(isinstance(photo, dict), 'Metadatos de foto no válidos.')
        rid = photo.get('recipe_id')
        _require(isinstance(rid, str) and rid in by_id and rid not in photo_ids,
                 'ID fotográfico inválido o repetido.')
        path = _relative(photo.get('photo_archive_path'))
        _require(len(path.parts) == 2 and path.parts[0] == 'fotos' and path.stem == rid
                 and path.suffix.lower() in ('.png', '.jpg', '.jpeg'), 'Ruta fotográfica no válida.')
        sha = photo.get('sha256')
        _require(isinstance(sha, str) and bool(SHA_PATTERN.fullmatch(sha)) and sha not in hashes,
                 'Hash fotográfico inválido o repetido.')
        size, width, height = photo.get('bytes'), photo.get('width_px'), photo.get('height_px')
        _require(type(size) is int and 0 < size <= MAX_MEMBER_BYTES
                 and type(width) is int and type(height) is int
                 and 1536 <= width <= 12000 and 1024 <= height <= 12000
                 and width * height <= 24_000_000, 'Dimensiones o tamaño fotográfico no válidos.')
        link = by_id[rid].get('photo')
        _require(isinstance(link, dict) and link.get('photo_path') == str(path)
                 and link.get('sha256') == sha, 'Vínculo receta-foto incoherente.')
        photo_by_path[str(path)] = photo
        photo_ids.add(rid)
        hashes.add(sha)
    _require(photo_ids == set(by_id), 'Recetas y fotos no coinciden.')
    _require(sum(p['bytes'] for p in photos) <= MAX_TOTAL_EXPANDED,
             'Las fotografías declaradas exceden los límites.')
    return raw, photo_by_path


def _image(payload: bytes, name: str, photo: dict) -> None:
    _require(len(payload) == photo['bytes'] and hashlib.sha256(payload).hexdigest() == photo['sha256'],
             'La foto no coincide con su manifiesto.')
    kind = 'PNG' if PurePosixPath(name).suffix.lower() == '.png' else 'JPEG'
    try:
        _gates().inspect_image(payload, {'format': kind, 'width': photo['width_px'],
                                        'height': photo['height_px']})
    except (ValueError, OSError) as error:
        raise IntakeError('La foto no supera el contenedor o la decodificación completa.') from error


def _scan(profile: Profile, input_dir: Path, *, photos_dir: Path | None,
          audit_available: bool, consumer: Callable[[str, bytes], None] | None = None):
    _profile(profile)
    input_dir = Path(input_dir)
    budget = _Budget()
    raw, expected = _data(profile, input_dir, budget)
    verified = set()
    missing_packages = []

    def accept(name: str, payload: bytes) -> None:
        _require(name in expected and name not in verified, 'Foto desconocida o repetida.')
        _image(payload, name, expected[name])
        verified.add(name)
        if consumer:
            consumer(name, payload)

    if photos_dir is not None:
        # Opening the directory rejects symlinks in all parent components.
        try:
            fd = _gates().open_directory(Path(photos_dir))
            try:
                with os.scandir(fd) as entries:
                    for count, entry in enumerate(entries, 1):
                        _require(count <= MAX_ENTRIES, 'Demasiados archivos de fotografías.')
                        name = entry.name
                        path = _relative(name)
                        _require(len(path.parts) == 1 and 'fotos/' + name in expected,
                                 'Archivo fotográfico desconocido.')
                        metadata = os.stat(name, dir_fd=fd, follow_symlinks=False)
                        _require(stat.S_ISREG(metadata.st_mode)
                                 and metadata.st_size == expected['fotos/' + name]['bytes']
                                 and 0 < metadata.st_size <= MAX_MEMBER_BYTES,
                                 'La foto no es un archivo regular permitido.')
                        budget.add(1, metadata.st_size)
                        image_fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=fd)
                        accept('fotos/' + name, _gates().read_regular_fd(image_fd, MAX_MEMBER_BYTES))
            finally:
                os.close(fd)
        except (OSError, ValueError) as error:
            if isinstance(error, IntakeError):
                raise
            raise IntakeError('No se puede leer de forma segura la carpeta de fotografías.') from error
    else:
        for package in profile.photo_packages:
            path = input_dir / package.name
            if not path.exists() and not path.is_symlink() and audit_available:
                missing_packages.append(package.name)
                continue
            count = 0
            with _zip(_payload(input_dir, package), budget, data=False) as archive:
                for info in archive.infolist():
                    if info.is_dir():
                        continue
                    is_photo = info.filename.startswith('fotos/') and PurePosixPath(info.filename).suffix.lower() in ('.png', '.jpg', '.jpeg')
                    payload = _member(archive, info, keep=is_photo)
                    if is_photo:
                        count += 1
                        accept(info.filename, payload)
                _require(package.image_count is None or count == package.image_count,
                         'El paquete tiene un conteo fotográfico incorrecto.')
    missing = sorted(expected[name]['recipe_id'] for name in set(expected) - verified)
    _require(audit_available or not missing, 'La entrega está incompleta: faltan fotografías.')
    report = {'status': 'COMPLETE_VERIFIED' if not missing else 'INCOMPLETE_PHOTOS_PENDING',
              'profile': profile.name, 'complete': not missing, 'recipes': profile.expected_count,
              'localized_records': profile.expected_count * len(LANGUAGES),
              'expected_photos': profile.expected_count, 'received_photos': len(verified),
              'missing_photo_ids': missing,
              'verified_photo_ids': sorted(expected[name]['recipe_id'] for name in verified),
              'missing_packages': missing_packages,
              'data_zip_sha256': profile.data_package.sha256,
              'recipes_json_sha256': hashlib.sha256(raw[profile.recipe_entry]).hexdigest(),
              'photo_manifest_sha256': hashlib.sha256(raw[profile.photo_entry]).hexdigest(),
              'commercial_labels': 'PENDING', 'visual_or_allergen_certification': False}
    return report, raw


def verify_delivery(profile: Profile, input_dir: Path, *, photos_dir: Path | None = None,
                    audit_available: bool = False) -> dict:
    """Read-only verification. A partial audit is explicitly incomplete."""
    try:
        return _scan(profile, input_dir, photos_dir=photos_dir,
                     audit_available=audit_available)[0]
    except (zipfile.BadZipFile, EOFError, RuntimeError, zlib.error) as error:
        raise IntakeError('ZIP incompleto, corrupto o no compatible.') from error


def _output_path(path: Path, sources: tuple[Path, ...] = ()) -> Path:
    try:
        absolute = _gates().clean_absolute(Path(path))
        # The tool may create staging under this repo, never app/source folders.
        if absolute.is_relative_to(ROOT):
            relative = absolute.relative_to(ROOT)
            _require(len(relative.parts) >= 2 and relative.parts[0] == 'staging',
                     'El destino no puede modificar archivos del proyecto.')
        for source in sources:
            source = _gates().clean_absolute(Path(source))
            _require(not absolute.is_relative_to(source), 'El destino no puede estar dentro del origen.')
        return absolute
    except (ValueError, OSError) as error:
        if isinstance(error, IntakeError):
            raise
        raise IntakeError('Destino no permitido.') from error


def _parent_fd(path: Path) -> int:
    """Create missing parents one component at a time, refusing symlinks."""
    fd = os.open(path.anchor, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        for component in path.parts[1:-1]:
            try:
                os.mkdir(component, mode=0o700, dir_fd=fd)
            except FileExistsError:
                pass
            next_fd = os.open(component, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = next_fd
        return fd
    except BaseException:
        os.close(fd)
        raise


def _write(fd: int, name: str, payload: bytes) -> None:
    opened = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                     0o600, dir_fd=fd)
    with os.fdopen(opened, 'wb') as stream:
        stream.write(payload)
        stream.flush()
        os.fsync(stream.fileno())


def _report_bytes(report: dict) -> bytes:
    return (json.dumps(report, ensure_ascii=False, sort_keys=True, indent=2) + '\n').encode('utf-8')


def prepare_staging(profile: Profile, input_dir: Path, output_dir: Path,
                    *, photos_dir: Path | None = None) -> dict:
    """Write only a new destination after full verification; originals stay intact.

    Every copied image is revalidated. An interrupted or failed copy retains an
    INCOMPLETO marker, and never receives the final completion file.
    """
    report = verify_delivery(profile, input_dir, photos_dir=photos_dir)
    sources = (Path(input_dir),) + ((Path(photos_dir),) if photos_dir is not None else ())
    output = _output_path(Path(output_dir), sources)
    parent = _parent_fd(output)
    directory = photo_directory = None
    try:
        os.mkdir(output.name, mode=0o700, dir_fd=parent)
        directory = os.open(output.name, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=parent)
        _write(directory, 'INCOMPLETO', b'No importar: copia de staging pendiente.\n')
        os.mkdir('fotos', mode=0o700, dir_fd=directory)
        photo_directory = os.open('fotos', os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=directory)

        def copy_photo(name: str, payload: bytes) -> None:
            _write(photo_directory, PurePosixPath(name).name, payload)

        second_report, raw = _scan(profile, input_dir, photos_dir=photos_dir,
                                   audit_available=False, consumer=copy_photo)
        _require(second_report == report, 'La fuente cambió durante la preparación.')
        _write(directory, 'recetas_v3.json', raw[profile.recipe_entry])
        _write(directory, 'manifest_fotos_v3.json', raw[profile.photo_entry])
        _write(directory, 'VERIFICACION.json', _report_bytes(report))
        # Flush the complete state privately first. The final name is created
        # atomically and exclusively, never as a potentially half-written file.
        _write(directory, '.ESTADO_PREPARADO', b'STAGING COMPLETO VERIFICADO. No integrado en la app.\nEtiquetas, SKU, precios y trazas comerciales PENDIENTES.\n')
        os.unlink('INCOMPLETO', dir_fd=directory)
        os.link('.ESTADO_PREPARADO', 'ESTADO.txt', src_dir_fd=directory,
                dst_dir_fd=directory, follow_symlinks=False)
        try:
            os.unlink('.ESTADO_PREPARADO', dir_fd=directory)
        except OSError:
            # This is only cleanup of a second name for the committed status.
            # Completion already succeeded; do not misreport the whole copy.
            pass
        return report
    except (OSError, ValueError, zipfile.BadZipFile, EOFError, RuntimeError, zlib.error) as error:
        if directory is not None:
            try:
                _write(directory, 'INCOMPLETO', b'No importar: preparacion interrumpida.\n')
            except OSError:
                # Failure before the final exclusive link cannot create
                # ESTADO.txt, even if a full disk prevents restoring a marker.
                pass
        if isinstance(error, IntakeError):
            raise
        raise IntakeError('No se pudo completar un destino nuevo de staging.') from error
    finally:
        if photo_directory is not None:
            os.close(photo_directory)
        if directory is not None:
            os.close(directory)
        os.close(parent)


def _write_report(path: Path, report: dict, sources: tuple[Path, ...]) -> None:
    output = _output_path(path, sources)
    parent = _parent_fd(output)
    try:
        _write(parent, output.name, _report_bytes(report))
    finally:
        os.close(parent)


def main(profile_name: str | None = None) -> int:
    parser = argparse.ArgumentParser(description='Recepción V3 segura, sin modificar la app.')
    parser.add_argument('--input-dir', required=True, type=Path)
    parser.add_argument('--profile', choices=(profile_name,) if profile_name else
                        ('original', 'github16', 'v3b', 'app10mb'), default=profile_name or 'original')
    parser.add_argument('--photos-dir', type=Path, help='Fotos sueltas; alternativa exclusiva a los ZIP fotográficos.')
    parser.add_argument('--output-dir', type=Path, default=Path('staging/jj-recetas-v3'))
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument('--verify-only', action='store_true')
    modes.add_argument('--audit-available', action='store_true', help='Solo auditar lo recibido; código 2 si faltan fotos.')
    parser.add_argument('--report-file', type=Path, help='Informe JSON nuevo, nunca sobrescrito.')
    args = parser.parse_args()
    try:
        profile = load_profile(args.profile)
        if args.verify_only or args.audit_available:
            report = verify_delivery(profile, args.input_dir, photos_dir=args.photos_dir,
                                     audit_available=args.audit_available)
        else:
            report = prepare_staging(profile, args.input_dir, args.output_dir,
                                     photos_dir=args.photos_dir)
        if args.report_file is not None:
            sources = (args.input_dir,) + ((args.photos_dir,) if args.photos_dir else ())
            _write_report(args.report_file, report, sources)
        print(json.dumps(report, ensure_ascii=False, sort_keys=True))
        return 0 if report['complete'] else 2
    except (IntakeError, OSError, ValueError, TypeError, KeyError, zipfile.BadZipFile):
        print('BLOQUEADO: la entrega o el destino no supera los controles.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
