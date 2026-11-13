#!/usr/bin/env python3
"""Validate the V83 public selection and reproduce the bounded app projection.

No extracted file is executed, no spreadsheet formula is evaluated and no network
or installed package is used. --check never writes files. The complete original
remains local and ignored by Git; the public selection contains only 120 records.
"""
from __future__ import annotations

import argparse
from decimal import Decimal
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import stat
import sys
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED, BadZipFile

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / 'referencias/recetas-v83'
ARCHIVE = REFERENCE / 'originales/JJ_V83_CIERRE_150_RECETAS_VERSION_LIGERA.zip'
PUBLIC_ARCHIVE = REFERENCE / 'fuente-publica/JJ_V83_120_RECETAS_FUENTE_PUBLICA.zip'
EXPECTED_PUBLIC_ZIP_SHA256 = '5b310f4111b6b1a7bd21a32560b0283518e9d8bdb4e169da2715c51d69778b62'
PUBLIC_CATALOG_NAME = '120_RECETAS_FUENTE_ORIGINAL.json'
PUBLIC_PROVENANCE_NAME = 'PROVENIENCIA.json'
EXPECTED_ZIP_SHA256 = '151e4fed4021e8e15b2a7b51a74dd3dfa342be8f1294fa33d8745c597ec00034'
EXPECTED_XLSX_SHA256 = 'dfa8e15c6471c862933eb5f6cd81fd1f9e00489f889088cf41f6fa18280c09a1'
MANIFEST_NAME = 'MANIFIESTO_SHA256_VERSION_LIGERA.json'
CATALOG_NAME = 'V83_CIERRE/150_RECETAS_01_150_CATA_ACTUALIZADA.json'
FINAL_BATCH_NAME = 'V83_CIERRE/10_RECETAS_141_150_CATA_APROBADA.json'
WORKBOOK_NAME = 'V83_CIERRE/JJ_BLOQUE2_V83_CIERRE_LOTE15_141_150_5_IDIOMAS.xlsx'
ALLOWED_FILES = frozenset([
    MANIFEST_NAME, CATALOG_NAME, FINAL_BATCH_NAME, WORKBOOK_NAME,
    'V83_CIERRE/CONTROL_50_FICHAS_CIERRE.csv',
    'V83_CIERRE/NOTAS_EDITORIALES_CIERRE.csv',
    'V83_CIERRE/ALERGENOS_PRECAUCIONES_5_IDIOMAS.csv',
    'V83_CIERRE/REVISION_LINGUISTICA_ESTRUCTURAL_5_IDIOMAS.csv',
    'V83_CIERRE/ETIQUETAS_COMERCIALES_PENDIENTES.csv',
    'V83_CIERRE/PRUEBAS_CULINARIAS_APROBADAS.csv',
    'V83_CIERRE/RESUMEN_QA_CIERRE.json',
    'V83_CIERRE/PROTOCOLO_PERMANENTE_LOTES_DE_10.txt',
    'LEEME_CIERRE_V83.txt', 'LEEME_VERSION_LIGERA_V83.txt',
])
SOURCE_LANGUAGES = ('es', 'en', 'de', 'fr', 'bg')
APP_LANGUAGES = SOURCE_LANGUAGES[:4]
EXCLUDED_RANGES = (
    (11, 20, 'Contradicción entre NO_PUBLICAR/prueba no completada superiores y cata aprobada traducida.'),
    (31, 40, 'Cata del usuario pendiente de forma coherente en fuente y traducciones.'),
    (111, 120, 'Cierre/cata aprobados superiores, pero traducciones mantienen PENDING_USER_CONFIRMATION.'),
)
UNITS = {'g': 'g', 'kg': 'kg', 'ml': 'ml', 'l': 'L', 'L': 'L', 'ud': 'ud', 'unidad': 'ud', 'unidades': 'ud'}
COUNT_QUALIFIERS = {
    'diente': 'diente', 'dientes': 'diente', 'hoja': 'hoja', 'hojas': 'hoja',
    'rama': 'rama', 'ramita': 'ramita', 'ramitas': 'ramita', 'tallos': 'tallo',
    'tira': 'tira', 'vaina': 'vaina', 'vainas': 'vaina', 'rebanadas': 'rebanada',
    'unidades de 250 g': 'unidad de 250 g',
}
COPY = {
    'es': {'optional': 'Opcional.', 'editorial': 'Nota editorial de la fuente (es): ',
           'phase': 'Fase indicada en los pasos', 'notTotal': 'No representa un tiempo total.'},
    'en': {'optional': 'Optional.', 'editorial': 'Editorial note from the source (es): ',
           'phase': 'Phase stated in the steps', 'notTotal': 'This is not a total duration.'},
    'de': {'optional': 'Optional.', 'editorial': 'Redaktioneller Hinweis aus der Quelle (es): ',
           'phase': 'In den Schritten angegebene Phase', 'notTotal': 'Dies ist keine Gesamtdauer.'},
    'fr': {'optional': 'Facultatif.', 'editorial': 'Note éditoriale de la source (es) : ',
           'phase': 'Phase indiquée dans les étapes', 'notTotal': 'Il ne s’agit pas d’une durée totale.'},
}
UNSAFE_TEXT = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\u200b\u200e\u200f\u202a-\u202e\u2060-\u206f\ufeff]')


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def unique_pairs(pairs: list[tuple[str, object]]) -> dict:
    result = {}
    for key, value in pairs:
        require(key not in result, 'Duplicate JSON object key: ' + key)
        require(key not in ('__proto__', 'prototype', 'constructor'), 'Unsafe JSON object key.')
        result[key] = value
    return result


def bounded_json(data: bytes) -> object:
    require(len(data) <= 8 * 1024 * 1024, 'JSON exceeds the input cap.')
    value = json.loads(data.decode('utf-8', errors='strict'), object_pairs_hook=unique_pairs,
                       parse_float=Decimal,
                       parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Non-finite JSON number.')))

    def check(node: object, depth: int = 0) -> None:
        require(depth <= 32, 'JSON nesting exceeds cap.')
        if isinstance(node, str):
            require(len(node) <= 100_000 and not UNSAFE_TEXT.search(node), 'Unsafe or excessive JSON text.')
        elif isinstance(node, dict):
            require(len(node) <= 2000, 'Excessive object.')
            for key, item in node.items():
                check(key, depth + 1)
                check(item, depth + 1)
        elif isinstance(node, list):
            require(len(node) <= 20_000, 'Excessive array.')
            for item in node:
                check(item, depth + 1)
        elif isinstance(node, Decimal):
            require(node.is_finite(), 'Non-finite number.')
        else:
            require(node is None or isinstance(node, (bool, int)), 'Unexpected JSON value.')
    check(value)
    return value


def validated_archive(filename: Path, external_xlsx: Path | None) -> tuple[list[dict], dict]:
    require(filename.is_file() and not filename.is_symlink(), 'A regular V83 archive is required.')
    require(filename.stat().st_size <= 2 * 1024 * 1024, 'Archive exceeds the compressed input cap.')
    payload = filename.read_bytes()
    require(digest(payload) == EXPECTED_ZIP_SHA256, 'The archive differs from the supplied approved V83 bytes.')
    with ZipFile(io.BytesIO(payload)) as archive:
        infos = archive.infolist()
        names = [info.filename for info in infos]
        require(len(names) == len(set(names)) == len(ALLOWED_FILES) and set(names) == ALLOWED_FILES,
                'Unexpected, missing or duplicate ZIP entries.')
        require(sum(info.file_size for info in infos) <= 12 * 1024 * 1024, 'Archive expanded size exceeds cap.')
        content = {}
        for info in infos:
            path = PurePosixPath(info.filename)
            require(not path.is_absolute() and not any(part in ('.', '..') for part in path.parts)
                    and '\\' not in info.filename and '\x00' not in info.filename, 'Unsafe ZIP path.')
            require(not info.is_dir() and not stat.S_ISLNK(info.external_attr >> 16), 'Non-regular ZIP entry.')
            require(stat.S_IFMT(info.external_attr >> 16) in (0, stat.S_IFREG), 'Unsupported ZIP file type.')
            require(not (info.flag_bits & 1), 'Encrypted ZIP entries are not accepted.')
            require(info.file_size <= 8 * 1024 * 1024 and info.file_size <= max(info.compress_size, 1) * 200,
                    'ZIP entry size or compression ratio exceeds cap.')
            data = archive.read(info)
            require(len(data) == info.file_size, 'ZIP size mismatch.')
            content[info.filename] = data
    manifest = bounded_json(content[MANIFEST_NAME])
    require(isinstance(manifest, dict) and manifest.get('algoritmo') == 'SHA-256', 'Invalid supplied manifest.')
    entries = manifest.get('entries')
    require(isinstance(entries, list) and len(entries) == 13, 'Expected thirteen manifest entries.')
    covered = set()
    for entry in entries:
        require(isinstance(entry, dict), 'Invalid manifest record.')
        name = entry.get('archivo')
        require(isinstance(name, str) and name in ALLOWED_FILES and name != MANIFEST_NAME and name not in covered,
                'Invalid or repeated manifest filename.')
        require(entry.get('bytes') == len(content[name]) and entry.get('sha256') == digest(content[name]),
                'Supplied manifest digest/size mismatch: ' + name)
        covered.add(name)
    require(covered == ALLOWED_FILES - {MANIFEST_NAME}, 'Incomplete supplied manifest.')
    require(digest(content[WORKBOOK_NAME]) == EXPECTED_XLSX_SHA256, 'Embedded workbook differs.')
    if external_xlsx is not None:
        require(external_xlsx.is_file() and not external_xlsx.is_symlink(), 'A regular XLSX is required.')
        require(external_xlsx.stat().st_size == len(content[WORKBOOK_NAME]), 'External workbook size differs.')
        require(external_xlsx.read_bytes() == content[WORKBOOK_NAME], 'External and embedded workbooks differ.')
    recipes = bounded_json(content[CATALOG_NAME])
    final_batch = bounded_json(content[FINAL_BATCH_NAME])
    require(isinstance(recipes, list) and len(recipes) == 150 and final_batch == recipes[-10:],
            'Expected 150 records with the exact final ten-record batch.')
    validate_recipes(recipes)
    return recipes, {
        'archiveSha256': digest(payload), 'archiveBytes': len(payload),
        'suppliedManifestSha256': digest(content[MANIFEST_NAME]),
        'manifestEntriesVerified': len(covered), 'archiveFileCount': len(names),
        'catalogSha256': digest(content[CATALOG_NAME]),
        'embeddedWorkbookSha256': digest(content[WORKBOOK_NAME]),
        'externalWorkbookIdentity': 'Byte-identical to the separately supplied workbook; SHA-256 pinned in importer.',
    }


def text(value: object, maximum: int = 5000) -> str:
    require(isinstance(value, str) and 0 < len(value.strip()) <= maximum, 'Invalid required text.')
    return value


def integer(value: object, minimum: int, maximum: int) -> bool:
    return type(value) is int and minimum <= value <= maximum


def measured_milli(value: object) -> int:
    require(type(value) is int or isinstance(value, Decimal), 'Expected an exact decimal quantity.')
    quantity = Decimal(value) * 1000
    require(quantity.is_finite() and quantity == quantity.to_integral_value() and 0 < quantity <= 1_000_000_000,
            'Quantity is not a positive representable thousandth.')
    return int(quantity)


def validate_recipes(recipes: list[dict], expected_positions: tuple[int, ...] = tuple(range(1, 151))) -> None:
    require(len(recipes) == len(expected_positions), 'Unexpected recipe count.')
    ids = set()
    for position, recipe in zip(expected_positions, recipes):
        require(isinstance(recipe, dict) and recipe.get('position_catalog') == position, 'Non-contiguous source positions.')
        recipe_id = recipe.get('id')
        require(isinstance(recipe_id, str) and re.fullmatch(r'JJ-[A-Z0-9-]+', recipe_id) is not None
                and recipe_id not in ids and len(recipe_id) <= 120, 'Invalid or duplicate recipe ID.')
        ids.add(recipe_id)
        translations = recipe.get('translations')
        require(isinstance(translations, dict) and set(translations) == set(SOURCE_LANGUAGES), 'Expected five source languages.')
        canonical = translations['es']
        require(isinstance(canonical, dict), 'Invalid Spanish recipe.')
        for language in SOURCE_LANGUAGES:
            view = translations[language]
            require(isinstance(view, dict) and view.get('recipe_id') == recipe_id and view.get('language') == language,
                    'Translation identity mismatch.')
            text(view.get('title'), 300)
            require(integer(view.get('servings'), 1, 12) and view['servings'] == canonical.get('servings'), 'Invalid servings.')
            minutes = view.get('preparation_and_cooking_min')
            require((minutes is None or integer(minutes, 1, 1440)) and minutes == canonical.get('preparation_and_cooking_min'),
                    'Invalid or translated preparation duration.')
            require(isinstance(view.get('steps'), list) and 1 <= len(view['steps']) <= 100
                    and len(view['steps']) == len(canonical.get('steps', [])), 'Invalid steps.')
            for step in view['steps']:
                text(step)
            require(isinstance(view.get('warnings'), list) and 1 <= len(view['warnings']) <= 30, 'Missing warnings.')
            for warning in view['warnings']:
                text(warning)
            ingredients = view.get('ingredients')
            require(isinstance(ingredients, list) and 1 <= len(ingredients) <= 2000
                    and len(ingredients) == len(canonical.get('ingredients', [])), 'Invalid ingredients.')
            for index, ingredient in enumerate(ingredients):
                source = canonical['ingredients'][index]
                require(isinstance(ingredient, dict) and ingredient.get('line') == index + 1
                        and ingredient.get('line') == source.get('line'), 'Ingredient line mismatch.')
                text(ingredient.get('name'), 300)
                require(ingredient.get('source_name_es') == source.get('source_name_es')
                        and ingredient.get('source_unit_es') == source.get('source_unit_es')
                        and ingredient.get('quantity') == source.get('quantity'), 'Ingredient anchor/quantity mismatch.')
                if ingredient.get('quantity') is None:
                    require(ingredient.get('unit') is None and ingredient.get('shopping_list_eligible') is False,
                            'Unmeasured ingredient cannot be transferred automatically.')
                    text(ingredient.get('quantity_text'), 500)
                else:
                    milli = measured_milli(ingredient['quantity'])
                    source_unit = source.get('unit')
                    require(source_unit in UNITS or source_unit in COUNT_QUALIFIERS, 'Unsupported source measure.')
                    if UNITS.get(source_unit) == 'ud' or source_unit in COUNT_QUALIFIERS:
                        require(milli % 1000 == 0, 'Fractional source counting unit.')
                    text(ingredient.get('unit'), 100)
                require('optional' not in ingredient or type(ingredient['optional']) is bool, 'Invalid optional flag.')


def selected_position(position: int) -> bool:
    return not any(low <= position <= high for low, high, _ in EXCLUDED_RANGES)


def decimal_json(value: object) -> int | float:
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    raise TypeError('Unexpected non-JSON value.')


def record_digest(value: dict) -> str:
    canonical = json.dumps(value, ensure_ascii=False, sort_keys=True,
                           separators=(',', ':'), default=decimal_json).encode('utf-8')
    return digest(canonical)


def public_selection_bytes(recipes: list[dict], integrity: dict) -> bytes:
    """Extract complete allowed records, with no blocked prose or spreadsheets."""
    selected, selected_metadata, reserved = [], [], []
    for recipe in recipes:
        position = recipe['position_catalog']
        metadata = {'id': recipe['id'], 'positionCatalog': position, 'recordSha256': record_digest(recipe)}
        reason = next((reason for low, high, reason in EXCLUDED_RANGES if low <= position <= high), None)
        if reason:
            reserved.append({**metadata, 'reason': reason})
        else:
            selected.append(recipe)
            selected_metadata.append(metadata)
    require(len(selected) == 120 and len(reserved) == 30, 'Invalid public selection size.')
    provenance = {
        'schemaVersion': 1, 'sourceVersion': 'V83_CIERRE_LIGERO',
        'selectionKind': 'EDITORIAL_REVIEW_WITH_WARNINGS_NOT_COMMERCIAL_CERTIFICATION',
        'originalIntegrity': integrity, 'originalSourceRecipes': 150,
        'originalSourceLocalizedRecords': 750, 'sourceLanguages': list(SOURCE_LANGUAGES),
        'selectedRecipes': selected_metadata, 'reservedRecipes': reserved,
        'originalArchivePublication': 'Local only, ignored by Git; complete original is not inside this public selection.',
        'recordSha256Canonicalization': 'UTF-8 JSON, recursively sorted keys, compact separators, finite number normalization; no trailing newline.',
    }
    content = (json.dumps(selected, ensure_ascii=False, indent=2, default=decimal_json) + '\n').encode('utf-8')
    # Numeric serialization is accepted only when every original decimal and
    # every other source value survives exactly as a parsed JSON value.
    require(bounded_json(content) == selected, 'Public selection changed source values.')
    metadata = (json.dumps(provenance, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    output = io.BytesIO()
    with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in ((PUBLIC_CATALOG_NAME, content), (PUBLIC_PROVENANCE_NAME, metadata)):
            info = ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data, compress_type=ZIP_DEFLATED, compresslevel=9)
    payload = output.getvalue()
    require(digest(payload) == EXPECTED_PUBLIC_ZIP_SHA256, 'Deterministic public selection differs from its pinned hash.')
    return payload


def validated_public_archive(filename: Path) -> tuple[list[dict], dict, list[dict]]:
    require(filename.is_file() and not filename.is_symlink(), 'A regular public V83 archive is required.')
    require(filename.stat().st_size <= 2 * 1024 * 1024, 'Public archive exceeds the compressed cap.')
    payload = filename.read_bytes()
    require(digest(payload) == EXPECTED_PUBLIC_ZIP_SHA256, 'Public selection differs from the pinned bytes.')
    allowed = {PUBLIC_CATALOG_NAME, PUBLIC_PROVENANCE_NAME}
    with ZipFile(io.BytesIO(payload)) as archive:
        infos = archive.infolist()
        names = [info.filename for info in infos]
        require(len(names) == len(set(names)) == 2 and set(names) == allowed, 'Unexpected public ZIP entries.')
        require(sum(info.file_size for info in infos) <= 12 * 1024 * 1024, 'Public expanded size exceeds cap.')
        content = {}
        for info in infos:
            path = PurePosixPath(info.filename)
            require(not path.is_absolute() and not any(part in ('.', '..') for part in path.parts)
                    and '\\' not in info.filename and '\x00' not in info.filename, 'Unsafe public ZIP path.')
            require(not info.is_dir() and stat.S_IFMT(info.external_attr >> 16) in (0, stat.S_IFREG),
                    'Public ZIP entries must be regular files.')
            require(not (info.flag_bits & 1), 'Encrypted public ZIP entries are not accepted.')
            require(info.file_size <= 8 * 1024 * 1024 and info.file_size <= max(info.compress_size, 1) * 200,
                    'Public ZIP entry size or compression ratio exceeds cap.')
            data = archive.read(info)
            require(len(data) == info.file_size, 'Public ZIP entry size mismatch.')
            content[info.filename] = data
    recipes = bounded_json(content[PUBLIC_CATALOG_NAME])
    provenance = bounded_json(content[PUBLIC_PROVENANCE_NAME])
    positions = tuple(position for position in range(1, 151) if selected_position(position))
    require(isinstance(recipes, list), 'Public recipes must be an array.')
    validate_recipes(recipes, positions)
    require(isinstance(provenance, dict) and provenance.get('schemaVersion') == 1
            and provenance.get('sourceVersion') == 'V83_CIERRE_LIGERO'
            and provenance.get('selectionKind') == 'EDITORIAL_REVIEW_WITH_WARNINGS_NOT_COMMERCIAL_CERTIFICATION'
            and provenance.get('originalSourceRecipes') == 150
            and provenance.get('originalSourceLocalizedRecords') == 750
            and provenance.get('sourceLanguages') == list(SOURCE_LANGUAGES), 'Invalid public provenance.')
    integrity = provenance.get('originalIntegrity')
    require(isinstance(integrity, dict) and integrity.get('archiveSha256') == EXPECTED_ZIP_SHA256
            and integrity.get('embeddedWorkbookSha256') == EXPECTED_XLSX_SHA256
            and integrity.get('manifestEntriesVerified') == 13 and integrity.get('archiveFileCount') == 14,
            'Unexpected original-source audit provenance.')
    expected_selected = [{'id': recipe['id'], 'positionCatalog': recipe['position_catalog'],
                          'recordSha256': record_digest(recipe)} for recipe in recipes]
    require(provenance.get('selectedRecipes') == expected_selected, 'Public record digest/position mismatch.')
    reserved = provenance.get('reservedRecipes')
    reserved_positions = [position for position in range(1, 151) if not selected_position(position)]
    require(isinstance(reserved, list) and len(reserved) == 30, 'Invalid reserve metadata.')
    known_ids = {recipe['id'] for recipe in recipes}
    for position, metadata in zip(reserved_positions, reserved):
        reason = next(reason for low, high, reason in EXCLUDED_RANGES if low <= position <= high)
        require(isinstance(metadata, dict) and set(metadata) == {'id', 'positionCatalog', 'recordSha256', 'reason'}
                and metadata.get('positionCatalog') == position and metadata.get('reason') == reason
                and isinstance(metadata.get('id'), str) and re.fullmatch(r'JJ-[A-Z0-9-]+', metadata['id']) is not None
                and metadata['id'] not in known_ids and isinstance(metadata.get('recordSha256'), str)
                and re.fullmatch(r'[a-f0-9]{64}', metadata['recordSha256']) is not None, 'Unsafe reserve metadata.')
        known_ids.add(metadata['id'])
    return recipes, integrity, reserved


def editorial_notes(view: dict, language: str) -> list[str]:
    notes = []
    # Newer supplied prose supersedes the older editorial prose, not the steps.
    if view.get('editorial_notes_v58'):
        notes.extend(text(value) for value in view['editorial_notes_v58'])
    elif view.get('editorial_notes_v57'):
        notes.extend(text(value) for value in view['editorial_notes_v57'])
    # These rationales were copied in Spanish into every source language. They
    # remain explicit Spanish fallback, rather than invented culinary translations.
    for key in ('editorial_addenda_v83', 'editorial_addenda_v82', 'editorial_addenda_v81',
                'editorial_addenda_v80', 'editorial_addenda_v79', 'editorial_addenda_v78'):
        if view.get(key):
            for entry in view[key]:
                if isinstance(entry, dict) and entry.get('rationale'):
                    notes.append(COPY[language]['editorial'] + text(entry['rationale']))
            break
    # Localized precaution prose is retained without promoting administrative QA
    # statuses to certification. Full original warnings are always shown separately.
    for key in ('food_safety_precaution', 'food_safety_v60', 'precaution_summary_localized',
                'commercial_label_note_localized', 'commercial_label_note_v60'):
        if isinstance(view.get(key), str):
            notes.append(text(view[key]))
    for field in ('confirmed_time_phases_from_steps', 'explicit_time_stages_from_steps', 'explicit_waiting_stages_from_steps'):
        for phase in view.get(field, []):
            require(isinstance(phase, dict), 'Invalid declared time phase.')
            low = phase.get('minutes', phase.get('duration_min', phase.get('min_minutes', phase.get('duration_min_min'))))
            high = phase.get('max_minutes', phase.get('duration_min_max', low))
            if low is None:
                continue
            require(integer(low, 1, 100_000) and integer(high, low, 100_000), 'Invalid declared time range.')
            duration = ('≥ ' if phase.get('at_least') is True else '') + str(low)
            if high != low:
                duration += '–' + str(high)
            # kind_es/source_text are Spanish in all source languages. Do not
            # misrepresent them as translations; the actual localized steps stay intact.
            label = phase.get('label') or COPY[language]['phase']
            notes.append(text(label) + ': ' + duration + ' min. ' + COPY[language]['notTotal'])
    # Keep the same source-field sequence in every language. Text-based deduplication
    # would shift indexes when translations use punctuation or wording variants.
    return notes


def projection(recipes: list[dict], reserve_metadata: list[dict] | None = None) -> tuple[list[dict], dict, dict, list[dict]]:
    active, metadata = [], {}
    messages = {language: {} for language in APP_LANGUAGES}
    blocked = list(reserve_metadata or [])
    for recipe in recipes:
        position, recipe_id = recipe['position_catalog'], recipe['id']
        reason = next((reason for low, high, reason in EXCLUDED_RANGES if low <= position <= high), None)
        if reason:
            blocked.append({'id': recipe_id, 'positionCatalog': position, 'reason': reason})
            continue
        source = recipe['translations']['es']
        measured = [(index, row) for index, row in enumerate(source['ingredients']) if row['quantity'] is not None]
        unmeasured = [(index, row) for index, row in enumerate(source['ingredients']) if row['quantity'] is None]
        source_notes = editorial_notes(source, 'es')
        item = {'id': recipe_id, 'title': source['title'], 'minutes': source['preparation_and_cooking_min'],
                'baseServings': source['servings'], 'ingredients': [], 'steps': source['steps'],
                'allergenNote': '\n\n'.join(source['warnings'])}
        for index, ingredient in measured:
            unit = ingredient['unit']
            name = ingredient['name'] + (' (' + COUNT_QUALIFIERS[unit] + ')' if unit in COUNT_QUALIFIERS else '')
            require(len(name) <= 120, 'Canonical name exceeds the shopping contract.')
            converted = {'name': name, 'quantityMilli': measured_milli(ingredient['quantity']),
                         'unit': UNITS.get(unit, 'ud'), 'category': 'Otros'}
            if ingredient.get('optional') is True:
                converted['note'] = COPY['es']['optional']
            item['ingredients'].append(converted)
        if unmeasured:
            item['unmeasuredIngredients'] = [{'name': row['name'], 'note': row['quantity_text']} for _, row in unmeasured]
        if source_notes:
            item['editorialNotes'] = source_notes
        active.append(item)
        metadata[recipe_id] = {
            'positionCatalog': position, 'sourceSha256': recipe['source_sha256'],
            'sourceIngredientLines': [row['line'] for _, row in measured],
            'sourceUnits': [row['unit'] for _, row in measured],
            'unmeasuredIngredientLines': [row['line'] for _, row in unmeasured],
        }
        for language in APP_LANGUAGES:
            view, target = recipe['translations'][language], messages[language]
            prefix = 'recipesV83.' + recipe_id
            target[prefix + '.title'] = view['title']
            target[prefix + '.allergen'] = '\n\n'.join(view['warnings'])
            for index, step in enumerate(view['steps']):
                target[prefix + '.step.' + str(index)] = step
            for output_index, (source_index, row) in enumerate(measured):
                localized = view['ingredients'][source_index]
                qualifier = COUNT_QUALIFIERS.get(row['unit'], '') if language == 'es' else localized['unit']
                name = localized['name'] + (' (' + qualifier + ')' if row['unit'] in COUNT_QUALIFIERS else '')
                target[prefix + '.ingredient.' + str(output_index)] = name
                if row.get('optional') is True:
                    target[prefix + '.ingredientNote.' + str(output_index)] = COPY[language]['optional']
            for output_index, (source_index, _) in enumerate(unmeasured):
                localized = view['ingredients'][source_index]
                target[prefix + '.unmeasured.' + str(output_index)] = localized['name']
                target[prefix + '.unmeasuredNote.' + str(output_index)] = localized['quantity_text']
            localized_notes = editorial_notes(view, language)
            require(len(localized_notes) == len(source_notes), 'Editorial note count differs by language.')
            for index, note in enumerate(localized_notes):
                target[prefix + '.editorial.' + str(index)] = note
    require(len(active) == 120 and len(blocked) == 30, 'Publication reserve count changed.')
    for language in APP_LANGUAGES:
        require(set(messages[language]) == set(messages['es']), 'Translation keys differ.')
    return active, messages, metadata, blocked


def json_text(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'


def rendered_files(recipes: list[dict], integrity: dict, reserve_metadata: list[dict] | None = None) -> dict[Path, bytes]:
    active, messages, metadata, blocked = projection(recipes, reserve_metadata)
    header = '// Generated by scripts/import-recipes-v83.py; edit the importer, then regenerate.\n'
    data = header + "import type { Recipe } from '../domain/menus';\n\n"
    data += '/** 120 projected records; thirty source-state discrepancies stay outside the client. */\n'
    data += 'export const V83_RECIPES: readonly Recipe[] = ' + json_text(active).rstrip() + ';\n\n'
    data += 'export const V83_RECIPE_METADATA: Readonly<Record<string, {\n'
    data += '  positionCatalog: number; sourceSha256: string; sourceIngredientLines: readonly number[];\n'
    data += '  sourceUnits: readonly string[]; unmeasuredIngredientLines: readonly number[];\n'
    data += '}>> = ' + json_text(metadata).rstrip() + ';\n'
    catalog = header + "import type { MessageCatalog } from '../types';\n\n"
    catalog += 'export const v83RecipeMessages: MessageCatalog = ' + json_text(messages).rstrip() + ';\n'
    files = {
        ROOT / 'src/data/recipesV83.ts': data.encode('utf-8'),
        ROOT / 'src/i18n/catalogs/recipesV83.ts': catalog.encode('utf-8'),
    }
    summary = {
        'schemaVersion': 1, 'sourceVersion': 'V83_CIERRE_LIGERO', 'integrity': integrity,
        'sourceArchive': str(PUBLIC_ARCHIVE.relative_to(ROOT)), 'sourceRecipes': 150,
        'sourceLanguages': list(SOURCE_LANGUAGES), 'sourceLocalizedRecords': 750,
        'publicSourceRecipes': 120, 'publicSourceLocalizedRecords': 600,
        'publicSourceIntegrity': {'sha256': EXPECTED_PUBLIC_ZIP_SHA256, 'bytes': 639105, 'archiveFileCount': 2},
        'privateOriginalArchive': str(ARCHIVE.relative_to(ROOT)), 'privateOriginalIgnoredByGit': True,
        'originalSourceAuditScope': 'The supplied 150-record archive and 13 manifest entries were verified during private ingestion. Public reproduction verifies only the selected 120 original records and their provenance; it does not re-run the unavailable full-source audit.',
        'runtimeLanguages': list(APP_LANGUAGES), 'runtimeRecipes': len(active),
        'runtimeUnknownPreparationTimes': sum(recipe['minutes'] is None for recipe in active),
        'runtimeMeasuredIngredientLines': sum(len(recipe['ingredients']) for recipe in active),
        'runtimeUnmeasuredIngredientLines': sum(len(recipe.get('unmeasuredIngredients', [])) for recipe in active),
        'runtimeSteps': sum(len(recipe['steps']) for recipe in active),
        'messageKeysPerLanguage': len(messages['es']), 'excludedRecipes': blocked,
        'excludedContentInRuntime': False, 'excludedContentInPublicSource': False,
        'legacyRecipesRemovedOrRewritten': False,
        'dietaryCertificationInferred': False, 'commercialPricesOrLabelsVerified': False,
        'editorialProjection': {
            'precedence': 'Latest supplied editorial_notes_v58 prose, else v57; latest explicit rationale addenda only.',
            'spanishRationaleFallback': 'v78 rationale remains Spanish in every source language; UI labels that fallback explicitly in each language.',
            'sourceStepsAndWarnings': 'Preserved exactly in every active language; all warnings joined with two line feeds.',
            'timeStages': 'Declared stage ranges shown independently; never added to a fabricated total; localized steps remain the culinary source.',
            'historicalMetadata': 'Preserved in exact source ZIP, not promoted to current app certification.',
        },
        'unitProjection': {
            'directAliases': UNITS, 'countQualifiersSpanish': COUNT_QUALIFIERS,
            'category': 'Otros until an explicit ingredient-category review; no dietary inference.',
            'unmeasured': 'Displayed with the supplied quantity_text; absent from measured shopping transfer.',
            'optional': 'Both measured optional ingredients retain an explicit localized note and remain reviewable.',
            'perRecipeLabels': 'Spanish canonical names equal Spanish message values; other recipe labels use their own translated line and source measure.',
        },
        'generatedFiles': {str(path.relative_to(ROOT)): {'bytes': len(value), 'sha256': digest(value)}
                           for path, value in files.items()},
        'regenerate': 'python3 scripts/import-recipes-v83.py',
        'check': 'python3 scripts/import-recipes-v83.py --check',
    }
    files[REFERENCE / 'MANIFIESTO_IMPORTACION.json'] = json_text(summary).encode('utf-8')
    readme = '''# Fuente de recetas V83 y proyección de la aplicación

El repositorio de JJ Compra Inteligente es público. El ZIP original recibido contiene 150 recetas y sus cinco versiones (es/en/de/fr/bg), incluidos 30 registros retenidos por estados pendientes o contradictorios. Ese original se conserva byte a byte en `originales/`, una carpeta ignorada por Git. No se sube a GitHub ni se publica como recurso de la preview. El XLSX separado coincide con el embebido; permanece dentro de ese original local, sin duplicación pública.

## Fuente pública reproducible

`fuente-publica/JJ_V83_120_RECETAS_FUENTE_PUBLICA.zip` contiene únicamente dos archivos de datos: `120_RECETAS_FUENTE_ORIGINAL.json` y `PROVENIENCIA.json`. Las 120 fichas seleccionadas conservan íntegros los valores de sus registros originales y los cinco idiomas, comprobados contra la fuente con decimales exactos. La selección no modifica instrucciones, ingredientes, advertencias o estados históricos dentro de esos registros. No contiene los pasos, títulos ni ingredientes de las 30 fichas retenidas. De esas fichas la procedencia solo conserva ID, posición, motivo y hash del registro.

El SHA-256 del ZIP público está fijado en el importador. El ZIP usa dos nombres permitidos, fecha fija y compresión determinista. Su comprobación valida tamaños, expansión, rutas, tipos de archivo, cifrado, UTF-8, claves JSON repetidas o inseguras, números finitos, 120 IDs/posiciones elegibles, sus cinco idiomas y los anclajes/cantidades/pasos. Los hashes de registro usan JSON UTF-8 con claves ordenadas recursivamente, separadores compactos y números finitos normalizados, sin salto de línea final. No se ejecuta código suministrado, se evalúan fórmulas, se extraen rutas arbitrarias ni se usa la red.

La procedencia registra el resultado de la ingesta privada de 150 fichas: 14 entradas, 13 hashes del manifiesto suministrado y el XLSX idéntico. La reproducción pública no vuelve a afirmar esa verificación completa: comprueba la selección pública y sus hashes. No contiene los ZIP históricos grandes mencionados en documentos heredados; no se han recibido ni reconstruido.

## Reserva editorial

Las posiciones 11–20 y 111–120 presentan contradicciones entre estados actuales; 31–40 mantiene cata pendiente. Sus 30 contenidos completos quedan fuera de GitHub, del catálogo de cliente y de sus traducciones compiladas hasta que el propietario aclare esos estados. El original local y sus estados no se borran. Las 120 fichas seleccionadas son contenido editorial con advertencias; esta selección no autoriza publicación comercial, no certifica seguridad sanitaria y no presume nuevas catas. El búlgaro de las 120 seleccionadas está conservado en la fuente pública; no se activa una interfaz parcialmente traducida. Las 30 traducciones búlgaras retenidas siguen en el original local.

## Proyección sin inventar cantidades ni certificaciones

Se mantienen IDs, raciones, pasos y todas las advertencias. Los tiempos desconocidos siguen siendo null. Las fases de espera declaradas se muestran separadamente y no se suman para inventar una duración total. Los gramos y mililitros se representan exactamente en milésimas; las unidades fuente especiales conservan visible diente/hoja/rama/vaina/tallo/tira/rebanada o tamaño de250g dentro del nombre contable. No se convierten dientes a cabezas de ajo ni se inventa su peso. El manifiesto detalla los alias y conserva por receta las líneas y unidades originales.

Las tres sales al gusto se muestran sin cantidad numérica y nunca pasan a la lista automática. Los dos ingredientes medidos opcionales conservan esa condición en una nota traducida. Los acompañamientos opcionales sin medida siguen en los pasos/notas originales, sin generar productos. Las categorías de compra quedan en Otros, pendientes de clasificación explícita; no se deducen preferencias vegetarianas/veganas ni alérgenos por apariencia o título. No hay precios ni productos comerciales certificados.

Se prioriza la prosa editorial posterior expresamente suministrada (v58 frente a v57), sin reescribir los pasos. La nota posterior del romero se conserva como adenda editorial, mientras el historial original sigue intacto en el registro fuente. Las rationale v78 se repiten en español incluso dentro de las otras traducciones de fuente: se muestran como respaldo español expresamente rotulado, sin inventar instrucciones traducidas. Los controles administrativos o históricos de QA no se presentan como garantía sanitaria. Las condiciones de productos, etiquetas, trazas y cata de cada ficha siguen siendo advertencias.

## Reproducir desde un clon público

```sh
python3 scripts/import-recipes-v83.py --check
python3 scripts/import-recipes-v83.py
```

Ambos comandos usan por defecto la fuente pública de 120 fichas. No necesitan el original privado de 150. `--check` compara los cuatro artefactos generados byte a byte sin escribir. Se puede indicar otro destino local de la selección con `--public-source RUTA`; solo se aceptan sus bytes fijados.

Para repetir la auditoría completa cuando se dispone del adjunto original, se admite `--source-zip RUTA` y, opcionalmente, `--source-xlsx RUTA`. Ese modo verifica el ZIP completo y sus 13 hashes, comprueba que produce exactamente la selección pública fijada y después reproduce los mismos artefactos. Un original archivado diferente nunca se sobrescribe. El modo `--check` tampoco archiva ni escribe archivos. La carpeta `originales/` debe permanecer excluida de todos los commits y paquetes de despliegue.
'''
    files[REFERENCE / 'README.md'] = readme.encode('utf-8')
    return files


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-zip', type=Path,
                        help='Audit the complete original privately and reproduce its public selection.')
    parser.add_argument('--source-xlsx', type=Path)
    parser.add_argument('--public-source', type=Path, default=PUBLIC_ARCHIVE,
                        help='Pinned public 120-record selection; used by default, including in CI.')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    require(args.source_zip is not None or args.source_xlsx is None,
            '--source-xlsx requires the complete --source-zip audit.')
    private_bytes = None
    if args.source_zip is not None:
        original, audited_integrity = validated_archive(args.source_zip, args.source_xlsx)
        selected_bytes = public_selection_bytes(original, audited_integrity)
        require(args.public_source == PUBLIC_ARCHIVE,
                'Private ingestion must compare the canonical public archive.')
        if args.check:
            require(PUBLIC_ARCHIVE.is_file() and not PUBLIC_ARCHIVE.is_symlink()
                    and PUBLIC_ARCHIVE.read_bytes() == selected_bytes, 'Public selection differs from the complete source.')
        else:
            if PUBLIC_ARCHIVE.exists():
                require(PUBLIC_ARCHIVE.is_file() and not PUBLIC_ARCHIVE.is_symlink()
                        and PUBLIC_ARCHIVE.read_bytes() == selected_bytes,
                        'Refusing to replace a different public source archive.')
            else:
                PUBLIC_ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
                with PUBLIC_ARCHIVE.open('xb') as destination:
                    destination.write(selected_bytes)
            private_bytes = args.source_zip.read_bytes()
    recipes, integrity, reserve_metadata = validated_public_archive(args.public_source)
    files = rendered_files(recipes, integrity, reserve_metadata)
    if args.check:
        for path, value in files.items():
            require(path.is_file() and not path.is_symlink() and path.read_bytes() == value,
                    'Generated file differs: ' + str(path.relative_to(ROOT)))
        scope = 'complete private source and public selection' if args.source_zip is not None else 'public selection only'
        print('V83 check PASS (' + scope + '): 120 source recipes / 5 languages; 120 runtime recipes / 4 languages; 30 reserved metadata only.')
        return 0
    if private_bytes is not None:
        if ARCHIVE.exists():
            require(ARCHIVE.is_file() and not ARCHIVE.is_symlink()
                    and digest(ARCHIVE.read_bytes()) == EXPECTED_ZIP_SHA256, 'Refusing to replace an archived original.')
        else:
            ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
            with ARCHIVE.open('xb') as destination:
                destination.write(private_bytes)
    for path, value in files.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        require(not path.is_symlink(), 'Refusing to overwrite a symlink.')
        path.write_bytes(value)
    print('V83 generated from public selection: 120 runtime records and four complete language catalogs; blocked contents remain outside Git.')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (ValueError, OSError, UnicodeError, BadZipFile, KeyError, TypeError) as error:
        print('V83 import failed: ' + str(error), file=sys.stderr)
        raise SystemExit(1)
