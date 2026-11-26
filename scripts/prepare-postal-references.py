#!/usr/bin/env python3
"""Validate pinned public GeoNames inputs and prepare approximate Tenerife points.

Only Python's standard library is used. Nothing is downloaded or executed and ZIP
members are read in memory, never extracted. --check is strictly read-only;
--output-dir creates two prepared files in a new directory, never app files.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import date, datetime
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
import stat
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'referencias/geografia/B06_2'
RUNTIME = ROOT / 'src/data/postalReferences.ts'
CHECKED_ON = '2026-11-26'
POSTAL_URL = 'https://download.geonames.org/export/zip/ES.zip'
GAZETTEER_URL = 'https://download.geonames.org/export/dump/ES.zip'
LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/'
MAX_BYTES = 8 * 1024 * 1024
MAX_ROWS = 50000
MUNICIPALITIES = frozenset(('38001', '38004', '38005', '38006', '38010', '38011',
    '38012', '38015', '38017', '38018', '38019', '38020', '38022', '38023', '38025',
    '38026', '38028', '38031', '38032', '38034', '38035', '38038', '38039', '38040',
    '38041', '38042', '38043', '38044', '38046', '38051', '38052'))
ATTRIBUTION = {'name': 'GeoNames', 'url': 'https://www.geonames.org/',
    'license': 'CC-BY-4.0', 'licenseUrl': LICENSE_URL, 'adapted': True}
INPUTS = {
    'postal-ES.zip': (556019, '180d44a0609ce19f624e62e0f56f5f36e9d8a57673d6b47b5cf372c10061c1cc'),
    'postal-readme.txt': (2893, 'fff60148da20f4d182859d926518efa5b0f3949f3c3273a284901325f1f8f008'),
    'gazetteer-reviewed.tsv': (457, 'b23548b16bc99a8fd5d740c764dbc247951142a736aefaec09825e13e7341167'),
    'gazetteer-readme.txt': (8843, 'b1957379b6c1242c700c98ac9a8aa0a09f56c3c0a50ee72175527005f48ef2c5'),
}
CURATED = {
    '2514741': {'postalCode': '38650', 'locality': 'Los Cristianos',
        'municipality': 'Arona', 'municipalityCode': '38006',
        'postalLocality': 'Playa De Los Cristianos', 'postalQuality': '1',
        'latitude': 28.05011, 'longitude': -16.72008, 'modified': '2015-05-06'},
    '6692470': {'postalCode': '38683', 'locality': 'Los Gigantes',
        'municipality': 'Santiago del Teide', 'municipalityCode': '38040',
        'postalLocality': 'Acantilados De Los Gigantes', 'postalQuality': '3',
        'latitude': 28.24361, 'longitude': -16.84153, 'modified': '2024-02-01'},
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def json_bytes(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n').encode('utf-8')


def calendar_day(value: str) -> None:
    require(bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', value)), 'Fecha no canónica.')
    require(date.fromisoformat(value).isoformat() == value, 'Fecha de calendario inválida.')


def plain(value: str, maximum: int, *, empty: bool = False) -> bool:
    return (isinstance(value, str) and (empty or bool(value)) and len(value) <= maximum
            and not any(ord(c) < 32 or 127 <= ord(c) <= 159 or c in '<>' for c in value))


def point(latitude: str | float, longitude: str | float, *, tenerife: bool = False) -> tuple[float, float]:
    require(not isinstance(latitude, bool) and not isinstance(longitude, bool), 'Coordenada booleana.')
    lat, lon = float(latitude), float(longitude)
    require(math.isfinite(lat) and math.isfinite(lon) and -90 <= lat <= 90 and -180 <= lon <= 180,
            'Coordenada no finita o fuera de WGS84.')
    if tenerife:
        require(27.98 <= lat <= 28.65 and -16.95 <= lon <= -16.07, 'Punto fuera del ámbito Tenerife.')
    return lat, lon


def unlinked_path(path: Path) -> None:
    """Reject symlinks in both the target and every existing ancestor."""
    require(path.is_absolute(), 'La ruta debe ser absoluta.')
    for item in (path, *path.parents):
        require(not item.is_symlink(), 'No se admiten enlaces simbólicos.')


def bounded_read(path: Path, maximum: int = MAX_BYTES) -> bytes:
    unlinked_path(path.absolute())
    require(path.is_file() and path.stat().st_size <= maximum, 'Fuente ausente o demasiado grande.')
    with path.open('rb') as handle:
        result = handle.read(maximum + 1)
    require(len(result) <= maximum, 'Fuente demasiado grande.')
    return result


def fixed_input(directory: Path, name: str) -> bytes:
    expected_size, expected_hash = INPUTS[name]
    data = bounded_read(directory / name)
    require(len(data) == expected_size and sha256(data) == expected_hash,
            'La fuente no coincide con el tamaño y SHA-256 fijados: ' + name)
    return data


def postal_zip(data: bytes) -> dict[str, bytes]:
    """Bounded ZIP reader, also exposed for adversarial tests without a hash bypass."""
    require(len(data) <= MAX_BYTES, 'ZIP comprimido demasiado grande.')
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            entries = archive.infolist()
            require(len(entries) == 2 and {i.filename for i in entries} == {'ES.txt', 'readme.txt'},
                    'El ZIP debe tener exactamente ES.txt y readme.txt sin duplicados.')
            require(sum(i.file_size for i in entries) <= MAX_BYTES, 'ZIP expandido demasiado grande.')
            for item in entries:
                mode = item.external_attr >> 16
                require(not item.is_dir() and not item.external_attr & 0x10
                        and stat.S_IFMT(mode) in (0, stat.S_IFREG)
                        and not item.flag_bits & 1 and item.compress_type in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED)
                        and item.file_size >= 0 and item.compress_size >= 0
                        and item.file_size <= MAX_BYTES
                        and item.file_size <= max(1, item.compress_size) * 200,
                        'Miembro ZIP inseguro o compresión excesiva.')
            result = {}
            for item in entries:
                with archive.open(item) as handle:
                    raw = handle.read(item.file_size + 1)
                require(len(raw) == item.file_size, 'Tamaño ZIP incoherente.')
                result[item.filename] = raw  # Reading through EOF verifies ZIP CRC.
            return result
    except (zipfile.BadZipFile, RuntimeError, NotImplementedError, EOFError) as error:
        raise ValueError('ZIP inválido o CRC incorrecto.') from error


def tabular(data: bytes, columns: int, limit: int) -> list[tuple[bytes, list[str]]]:
    require(len(data) <= MAX_BYTES and b'\r' not in data and data.endswith(b'\n'),
            'TSV debe tener saltos LF y fin de línea, dentro del límite.')
    rows = data[:-1].split(b'\n')
    require(0 < len(rows) <= limit, 'Cantidad de filas fuera del límite.')
    result = []
    for raw in rows:
        require(0 < len(raw) <= 10000, 'Fila vacía o excesiva.')
        try:
            fields = raw.decode('utf-8', errors='strict').split('\t')
        except UnicodeDecodeError as error:
            raise ValueError('TSV no es UTF-8 válido.') from error
        require(len(fields) == columns and all(plain(f, 1000, empty=True) for f in fields),
                'Esquema TSV o texto inválido.')
        result.append((raw, fields))
    return result


def postal_rows(data: bytes) -> list[tuple[bytes, list[str]]]:
    rows = tabular(data, 12, MAX_ROWS)
    identities = set()
    for raw, row in rows:
        require(row[0] == 'ES' and bool(re.fullmatch(r'\d{5}', row[1]))
                and plain(row[2], 180) and plain(row[3], 100)
                and bool(re.fullmatch(r'[A-Z]{2}', row[4])) and plain(row[5], 100)
                and bool(re.fullmatch(r'[A-Z0-9]{1,2}', row[6]))
                and plain(row[7], 100, empty=True)
                and (not row[8] or bool(re.fullmatch(r'\d{5}', row[8])))
                and bool(row[7]) == bool(row[8]) and row[11] in ('1', '3', '4'),
                'País, CP, municipio o calidad postal inválidos.')
        point(row[9], row[10])
        identity = sha256(raw)
        require(identity not in identities, 'Fila postal duplicada.')
        identities.add(identity)
    return rows


def in_scope(row: list[str]) -> bool:
    return row[0] == 'ES' and row[4] == 'CN' and row[6] == 'TF' and bool(re.fullmatch(r'38[0-6]\d{2}', row[1]))


def postal_records(rows: list[tuple[bytes, list[str]]]) -> tuple[list[dict], dict]:
    candidates = [(raw, row) for raw, row in rows if in_scope(row)]
    records, withheld = [], []
    for raw, row in candidates:
        lat, lon = point(row[9], row[10])
        require(not row[8] or row[8] in MUNICIPALITIES, 'Municipio desconocido en el ámbito Tenerife.')
        reasons = []
        if row[11] != '4':
            reasons.append('quality-not-4')
        if not row[7] or not row[8]:
            reasons.append('missing-municipality')
        if not (27.98 <= lat <= 28.65 and -16.95 <= lon <= -16.07):
            reasons.append('outside-tenerife-bounds')
        source_id = sha256(raw)
        if reasons:
            withheld.append({'sourceId': source_id, 'postalCode': row[1], 'locality': row[2],
                'quality': int(row[11]), 'reasons': reasons})
            continue
        records.append({'id': f'postal-{row[1]}-{source_id[:16]}', 'postalCode': row[1],
            'locality': row[2], 'municipality': row[7], 'municipalityCode': row[8],
            'country': 'ES', 'island': 'tenerife', 'latitude': lat, 'longitude': lon,
            'method': 'postal-geonameid', 'sourceId': source_id, 'sourceUrl': POSTAL_URL})
    stats = {'sourcePostalRows': len(rows), 'candidatePostalRows': len(candidates),
        'candidatePostalCodes': len({r[1] for _, r in candidates}),
        'candidateQualityCounts': dict(sorted(Counter(r[11] for _, r in candidates).items())),
        'activePostalReferences': len(records), 'activePostalCodes': len({r['postalCode'] for r in records}),
        'withheldPostalRows': len(withheld),
        'withheldByReason': dict(sorted(Counter(reason for r in withheld for reason in r['reasons']).items())),
        'quality4MissingMunicipality': sum(r['quality'] == 4 and 'missing-municipality' in r['reasons'] for r in withheld)}
    return records, {'statistics': stats, 'withheldPostalRows': withheld}


def reviewed_records(data: bytes, postal: list[tuple[bytes, list[str]]]) -> tuple[list[dict], list[dict]]:
    rows = tabular(data, 19, 2)
    require(len(rows) == len(CURATED), 'Faltan puntos del gazetteer revisado.')
    records, associations, seen = [], [], set()
    for raw, row in rows:
        sid = row[0]
        require(sid in CURATED and sid not in seen, 'Identidad gazetteer desconocida o duplicada.')
        seen.add(sid)
        expected = CURATED[sid]
        calendar_day(row[18])
        lat, lon = point(row[4], row[5], tenerife=True)
        require(row[1] == expected['locality'] and row[6:9] == ['P', 'PPL', 'ES']
                and row[10:13] == ['53', 'TF', expected['municipalityCode']]
                and row[13] == '' and row[17] == 'Atlantic/Canary'
                and (lat, lon) == (expected['latitude'], expected['longitude'])
                and row[18] == expected['modified'], 'Punto gazetteer distinto del revisado.')
        linked = [(b, r) for b, r in postal if in_scope(r) and r[1] == expected['postalCode']
                  and r[2] == expected['postalLocality'] and r[7] == expected['municipality']
                  and r[8] == expected['municipalityCode'] and r[11] == expected['postalQuality']]
        require(len(linked) == 1, 'Asociación CP/localidad/municipio no acreditada por la fila postal.')
        records.append({'id': f"place-{sid}-{expected['postalCode']}", 'postalCode': expected['postalCode'],
            'locality': row[1], 'municipality': expected['municipality'],
            'municipalityCode': expected['municipalityCode'], 'country': 'ES', 'island': 'tenerife',
            'latitude': lat, 'longitude': lon, 'method': 'reviewed-gazetteer',
            'sourceId': sid, 'sourceUrl': GAZETTEER_URL})
        associations.append({'sourceId': sid, 'sourceLineSHA256': sha256(raw),
            'sourceModifiedOn': row[18], 'postalCode': expected['postalCode'],
            'gazetteerLocality': row[1], 'postalLocality': expected['postalLocality'],
            'municipality': expected['municipality'], 'municipalityCode': expected['municipalityCode'],
            'postalSourceId': sha256(linked[0][0]), 'withheldPostalQuality': int(expected['postalQuality']),
            'basis': 'Named P/PPL gazetteer point and explicit postal locality/municipality association; no coordinate averaging.'})
    return records, associations


def validate_catalog(catalog: dict) -> None:
    require(isinstance(catalog, dict) and set(catalog) == {'version', 'checkedOn', 'coverage', 'attribution', 'records'}
            and type(catalog['version']) is int and catalog['version'] == 1
            and catalog['checkedOn'] == CHECKED_ON and catalog['coverage'] == 'partial'
            and catalog['attribution'] == ATTRIBUTION
            and catalog['attribution']['adapted'] is True, 'Contrato del catálogo inválido.')
    calendar_day(catalog['checkedOn'])
    records = catalog['records']
    require(isinstance(records, list) and 0 < len(records) <= 1000, 'Catálogo vacío o excesivo.')
    ids, source_ids = set(), set()
    keys = {'id', 'postalCode', 'locality', 'municipality', 'municipalityCode', 'country',
            'island', 'latitude', 'longitude', 'method', 'sourceId', 'sourceUrl'}
    for row in records:
        require(isinstance(row, dict) and set(row) == keys, 'Esquema de referencia inválido.')
        require(isinstance(row['id'], str) and row['id'] not in ids
                and isinstance(row['sourceId'], str) and row['sourceId'] not in source_ids
                and isinstance(row['postalCode'], str) and bool(re.fullmatch(r'38[0-6]\d{2}', row['postalCode']))
                and row['country'] == 'ES' and row['island'] == 'tenerife'
                and isinstance(row['municipalityCode'], str) and row['municipalityCode'] in MUNICIPALITIES
                and type(row['latitude']) in (int, float) and type(row['longitude']) in (int, float)
                and plain(row['locality'], 180)
                and plain(row['municipality'], 120), 'Identidad o ámbito de referencia inválidos.')
        point(row['latitude'], row['longitude'], tenerife=True)
        if row['method'] == 'postal-geonameid':
            require(bool(re.fullmatch(r'[a-f0-9]{64}', row['sourceId'])) and row['sourceUrl'] == POSTAL_URL
                    and row['id'] == f"postal-{row['postalCode']}-{row['sourceId'][:16]}", 'Procedencia postal inválida.')
        else:
            require(row['method'] == 'reviewed-gazetteer' and row['sourceId'] in CURATED
                    and row['sourceUrl'] == GAZETTEER_URL
                    and row['id'] == f"place-{row['sourceId']}-{row['postalCode']}", 'Procedencia gazetteer inválida.')
            expected = CURATED[row['sourceId']]
            require(all(row[k] == expected[k] for k in ('postalCode', 'locality', 'municipality',
                    'municipalityCode', 'latitude', 'longitude')), 'Referencia revisada modificada.')
        ids.add(row['id'])
        source_ids.add(row['sourceId'])


def receipt(url: str, retrieved: str, size: int, digest: str, mime: str, modified: str) -> dict:
    require(datetime.fromisoformat(retrieved).date().isoformat() == CHECKED_ON, 'Recepción inválida.')
    return {'url': url, 'finalURL': url, 'retrievedAt': retrieved, 'status': 200,
            'bytes': size, 'sha256': digest, 'contentType': mime, 'lastModified': modified}


def generated_files(directory: Path = SOURCE) -> dict[str, bytes]:
    calendar_day(CHECKED_ON)
    sources = {name: fixed_input(directory, name) for name in INPUTS}
    members = postal_zip(sources['postal-ES.zip'])
    require(members['readme.txt'] == sources['postal-readme.txt'], 'Readme postal distinto del original ZIP.')
    require('Creative Commons Attribution 4.0' in sources['postal-readme.txt'].decode('utf-8')
            and LICENSE_URL in sources['gazetteer-readme.txt'].decode('utf-8'), 'Licencia fuente ausente.')
    rows = postal_rows(members['ES.txt'])
    postal, selection = postal_records(rows)
    reviewed, associations = reviewed_records(sources['gazetteer-reviewed.tsv'], rows)
    records = sorted(postal + reviewed, key=lambda r: (r['postalCode'], r['locality'], r['id']))
    catalog = {'version': 1, 'checkedOn': CHECKED_ON, 'coverage': 'partial',
               'attribution': ATTRIBUTION, 'records': records}
    validate_catalog(catalog)
    ts = ("// Generated by scripts/prepare-postal-references.py; see referencias/geografia/B06_2/README.md.\n"
          "// Approximate locality points, partial coverage; no postal centroid or address accuracy.\n"
          "import type { PostalReferenceCatalog } from '../domain/postalReferences';\n\n"
          'export const postalReferenceCatalog = ' + json_bytes(catalog).decode('utf-8').rstrip('\n')
          + ' as const satisfies PostalReferenceCatalog;\n').encode('utf-8')
    stats = selection['statistics']
    stats.update({'activeReviewedGazetteerReferences': len(reviewed), 'activeReferences': len(records),
        'activePostalCodesIncludingReviewed': len({r['postalCode'] for r in records}),
        'activeMunicipalities': len({r['municipalityCode'] for r in records}),
        'uniqueReferenceIds': len({r['id'] for r in records}), 'duplicateCoordinatesPreserved':
            len(records) - len({(r['latitude'], r['longitude']) for r in records})})
    manifest = {
        'schemaVersion': 1, 'kind': 'JJ_POSTAL_REFERENCES', 'checkedOn': CHECKED_ON,
        'coverage': 'partial', 'attribution': ATTRIBUTION,
        'publicInputs': [{'file': name, 'bytes': size, 'sha256': digest} for name, (size, digest) in INPUTS.items()],
        'sourceReceipts': {
            'postal': receipt(POSTAL_URL, '2026-11-26T14:22:54.990142+00:00', *INPUTS['postal-ES.zip'],
                              'application/zip', 'Thu, 26 Nov 2026 03:03:47 GMT'),
            'postalReadme': receipt('https://download.geonames.org/export/zip/readme.txt',
                '2026-11-26T14:22:57.190694+00:00', *INPUTS['postal-readme.txt'],
                'text/plain; charset=UTF-8', 'Thu, 26 Nov 2026 03:03:31 GMT'),
            'gazetteerArchive': receipt(GAZETTEER_URL, '2026-11-26T14:31:32.673075+00:00', 3337891,
                'c139cfdbc434bc98086ab2a34d123d759c0b686fe7be38aeb6c69ae7174591d2',
                'application/zip', 'Thu, 26 Nov 2026 02:52:35 GMT'),
            'gazetteerReadme': receipt('https://download.geonames.org/export/dump/readme.txt',
                '2026-11-26T14:31:35.037465+00:00', *INPUTS['gazetteer-readme.txt'],
                'text/plain; charset=utf-8', 'Thu, 26 Nov 2026 02:48:36 GMT'),
            'license': receipt(LICENSE_URL, '2026-11-26T14:22:58.090911+00:00', 32767,
                '5b0b7a3b78c8696d653d519da73f1ac1eed684a434c3e81f4ac6279f750abb50',
                'text/html', 'Wed, 25 Nov 2026 17:44:07 GMT'),
        },
        'postalMember': {'file': 'ES.txt', 'rows': len(rows), 'bytes': len(members['ES.txt']),
                         'sha256': sha256(members['ES.txt']), 'columns': 12},
        'selectionPolicy': {'country': 'ES', 'postalAdmin1': 'CN', 'postalAdmin2': 'TF',
            'postalCodePattern': '38[0-6][0-9][0-9]', 'municipalityCodes': sorted(MUNICIPALITIES),
            'bounds': {'latitude': [27.98, 28.65], 'longitude': [-16.95, -16.07]},
            'postalQualityRequired': 4, 'knownNonemptyMunicipalityRequired': True,
            'reviewedGazetteerClass': 'P/PPL', 'gazetteerAdmin1': '53', 'gazetteerAdmin2': 'TF',
            'inferCoordinates': False, 'averageCoordinates': False, 'deduplicateCoordinates': False},
        'statistics': stats, 'reviewedAssociations': associations,
        'withheldPostalRows': selection['withheldPostalRows'],
        'rightsAndScope': {'license': 'CC-BY-4.0', 'licenseUrl': LICENSE_URL,
            'credit': 'GeoNames — https://www.geonames.org/',
            'changes': ['Filtered Spanish postal rows to a partial Tenerife set with quality 4 and known municipality.',
                'Selected two raw gazetteer P/PPL rows and explicitly associated each to a postal locality and municipality.',
                'Created stable IDs and TypeScript data; preserved names and source coordinates without averaging.'],
            'limitations': ['Approximate locality points, not postal centroids or exact homes.',
                'Source quality 4 means geonameid, not physically checked coordinate accuracy.',
                'checkedOn records source/licence review; sourceModifiedOn remains 2015/2024 for the two gazetteer points.',
                'Partial coverage; unavailable or ambiguous rows are withheld. No storefront, stock or price verification.'],
            'fullGazetteerArchivePublished': False, 'licenseHTMLPublished': False},
        'safetyLimits': {'maxCompressedBytes': MAX_BYTES, 'maxUncompressedBytes': MAX_BYTES,
            'exactZipMembers': ['readme.txt', 'ES.txt'], 'maxCompressionRatio': 200,
            'maxPostalRows': MAX_ROWS, 'maxReviewedRows': 2, 'maxRuntimeRecords': 1000,
            'maxTSVLineBytes': 10000, 'extractFiles': False, 'executeDownloadedCode': False},
        'generated': {'runtimeFile': 'src/data/postalReferences.ts', 'bytes': len(ts), 'sha256': sha256(ts)},
    }
    return {'postalReferences.ts': ts, 'source-manifest.json': json_bytes(manifest)}


def check(files: dict[str, bytes]) -> None:
    require(bounded_read(RUNTIME) == files['postalReferences.ts'], 'El catálogo no coincide con la reproducción canónica.')
    require(bounded_read(SOURCE / 'source-manifest.json') == files['source-manifest.json'],
            'El manifiesto o sus estadísticas no coinciden con las fuentes fijadas.')


def write_new(destination: Path, files: dict[str, bytes]) -> None:
    destination = destination.absolute()
    unlinked_path(destination)
    destination = destination.resolve()
    require(not destination.exists() and destination.parent.is_dir(),
            'El destino debe ser nuevo y su padre debe existir; no se sobrescribe ningún archivo.')
    # Prepared artifacts must not be written directly over the application or references.
    require(destination != ROOT and ROOT not in destination.parents, 'El destino debe quedar fuera del repositorio.')
    require(set(files) == {'postalReferences.ts', 'source-manifest.json'}
            and all(isinstance(raw, bytes) and len(raw) <= MAX_BYTES for raw in files.values()),
            'Solo se admiten los dos derivados preparados.')
    destination.mkdir(mode=0o700)
    for name, raw in files.items():
        descriptor = os.open(destination / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, 'wb') as handle:
            handle.write(raw)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--output-dir', type=Path)
    args = parser.parse_args()
    try:
        files = generated_files()
        if args.check:
            check(files)
        else:
            write_new(args.output_dir, files)
        manifest = json.loads(files['source-manifest.json'])
        print(json.dumps({'status': 'OK', 'mode': 'check' if args.check else 'prepared',
                          'statistics': manifest['statistics']}, ensure_ascii=False, sort_keys=True))
        return 0
    except (ValueError, OSError, KeyError, TypeError, OverflowError) as error:
        print('ERROR: ' + str(error), file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
