#!/usr/bin/env python3
"""Build the private B03 catalogue and an allowlisted public metadata index.

No application files, originals, publication decisions or services are changed.
The existing pinned importer performs all ZIP/JSON and recipe validation. A new
private directory outside this repository is required; --check only reads it.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import stat
import sys

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('jj_v83_importer', ROOT / 'scripts/import-recipes-v83.py')
assert spec is not None and spec.loader is not None
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)

PRIVATE_REGISTRY = 'registro-maestro-privado.json'
PUBLIC_INDEX = 'indice-publico.json'
PUBLIC_BATCHES = 'lotes-publicos.json'
PRIVATE_MANIFEST = 'manifiesto-privado.json'
FILENAMES = frozenset((PRIVATE_REGISTRY, PUBLIC_INDEX, PUBLIC_BATCHES, PRIVATE_MANIFEST))
CONTROL_FIELDS = frozenset((
    'id', 'positionCatalog', 'batchNumber', 'recordSha256', 'historicalSourceSha256',
    'activeInCurrentApp', 'tasteStatus', 'issueCodes', 'categoryKnown', 'preparationTimeKnown',
))
PUBLIC_FIELDS = frozenset((
    'id', 'positionCatalog', 'batchNumber', 'recordSha256', 'historicalSourceSha256',
    'activeInCurrentApp', 'categoryKnown', 'preparationTimeKnown',
))
RESERVED_FIELDS = frozenset(('id', 'positionCatalog', 'recordSha256', 'reason'))
TASTE_RECORDED = 'REPORTED_IN_SOURCE'
TASTE_CONFLICT = 'REPORTED_WITH_CONFLICTING_SOURCE_STATUS'
TASTE_PENDING = 'PENDING_IN_SOURCE'
TASTE_UNKNOWN = 'NOT_ESTABLISHED_BY_THIS_AUDIT'


def require(condition: bool) -> None:
    if not condition:
        raise ValueError('Invalid audit input or destination.')


def encoded(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2,
                       allow_nan=False, default=importer.decimal_json) + '\n').encode('utf-8')


def at(record: dict, *keys: str) -> object:
    current: object = record
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def taste_evidence(recipe: dict) -> dict:
    """Recognize evidence, retaining conflicts instead of overriding originals."""
    paths: list[str] = []
    for path in (
        ('user_cooking_test', 'confirmed'), ('user_cooking_test', 'taste_confirmed'),
        ('user_cooking_test', 'performed'), ('v62_review', 'user_taste_test', 'reported'),
        ('closure_record', 'tasting_confirmed_by_user'),
    ):
        if at(recipe, *path) is True:
            paths.append('.'.join(path))
    # This identifies an explicitly dated report, not a fresh culinary test.
    if isinstance(at(recipe, 'user_tasting_v60', 'user_reported_on'), str) and at(recipe, 'user_tasting_v60', 'user_reported_on'):
        paths.append('user_tasting_v60.user_reported_on')
    translated = {language: recipe['translations'][language].get('user_taste_confirmed')
                  for language in importer.SOURCE_LANGUAGES}
    require(all(value is None or type(value) is bool for value in translated.values()))
    paths.extend('translations.' + language + '.user_taste_confirmed'
                 for language, value in translated.items() if value is True)
    negative = (at(recipe, 'user_cooking_test', 'completed') is False
                or at(recipe, 'user_cooking_test', 'confirmed') is False
                or any(value is False for value in translated.values()))
    status = (TASTE_CONFLICT if negative else TASTE_RECORDED) if paths else (TASTE_PENDING if negative else TASTE_UNKNOWN)
    return {'status': status, 'evidencePaths': paths, 'translationFlags': translated,
            'newTasteTestPerformed': False, 'temperatureOrMicrobiologicalCertification': False}


def public_projection(approved: list[dict], reserved: list[dict]) -> tuple[dict, dict]:
    """Derive public artifacts ONLY from the already authorized public source.

    Reserved rows are identical to its existing four-field provenance. No new
    held tasting status, evidence, proposal or classification can enter here.
    """
    expected_positions = tuple(position for position in range(1, 151) if importer.selected_position(position))
    importer.validate_recipes(approved, expected_positions)
    rows = []
    for recipe in approved:
        position = recipe['position_catalog']
        row = {
            'id': recipe['id'], 'positionCatalog': position, 'batchNumber': (position - 1) // 10 + 1,
            'recordSha256': importer.record_digest(recipe), 'historicalSourceSha256': recipe['source_sha256'],
            'activeInCurrentApp': True, 'categoryKnown': recipe['metadata_original'].get('category') is not None,
            'preparationTimeKnown': recipe['translations']['es']['preparation_and_cooking_min'] is not None,
        }
        require(set(row) == PUBLIC_FIELDS)
        rows.append(row)
    require(len(reserved) == 30)
    expected_reserved = [position for position in range(1, 151) if not importer.selected_position(position)]
    for position, record in zip(expected_reserved, reserved):
        require(set(record) == RESERVED_FIELDS and record['positionCatalog'] == position)
        reason = next(reason for low, high, reason in importer.EXCLUDED_RANGES if low <= position <= high)
        require(record['reason'] == reason)
        rows.append({key: record[key] for key in ('id', 'positionCatalog', 'recordSha256', 'reason')})
    rows.sort(key=lambda row: row['positionCatalog'])
    require(len({row['id'] for row in rows}) == 150)
    batches = []
    for batch in range(1, 16):
        active = [row for row in rows[(batch - 1) * 10:batch * 10] if row.get('activeInCurrentApp') is True]
        batches.append({
            'batchNumber': batch, 'firstPosition': (batch - 1) * 10 + 1, 'lastPosition': batch * 10,
            'knownRecipeIdentities': 10, 'activePublicRecipes': len(active), 'existingReservedIdentities': 10 - len(active),
            'publicLocalizedRecords': len(active) * 5,
            'publicStructureAcrossFiveLanguages': 'VALIDATED' if active else 'NOT_IN_PUBLIC_SOURCE',
            'activeUnknownPreparationTimes': sum(not row['preparationTimeKnown'] for row in active),
            'activeCategoryNotProvided': sum(not row['categoryKnown'] for row in active),
        })
    origin = {'authorizedPublicArchiveSha256': importer.EXPECTED_PUBLIC_ZIP_SHA256,
              'originalArchiveSha256PreviouslyRecorded': importer.EXPECTED_ZIP_SHA256}
    index = {'schemaVersion': 1, 'source': origin, 'privacy': 'AUTHORIZED_PUBLIC_SOURCE_ONLY', 'recipes': rows}
    summary = {'schemaVersion': 1, 'source': origin, 'sourceRecipeIdentities': 150, 'activeV83': 120,
               'activeLocalizedRecords': 600, 'legacyUnchanged': 7, 'activeAppTotal': 127, 'heldV83': 30,
               'publicationDecisionsChanged': False, 'newHeldEditorialDataIncluded': False, 'batches': batches}
    return index, summary


def audit_records(recipes: list[dict], integrity: dict, *, public_source: tuple | None = None) -> dict[str, bytes]:
    importer.validate_recipes(recipes)
    require(integrity.get('archiveSha256') == importer.EXPECTED_ZIP_SHA256)
    require(integrity.get('archiveBytes') == 937580)
    require(integrity.get('manifestEntriesVerified') == 13 and integrity.get('archiveFileCount') == 14)
    private_rows: list[dict] = []
    control_rows: list[dict] = []
    for recipe in recipes:
        position = recipe['position_catalog']
        historical = recipe.get('source_sha256')
        require(isinstance(historical, str) and re.fullmatch(r'[a-f0-9]{64}', historical) is not None)
        metadata = recipe.get('metadata_original')
        require(isinstance(metadata, dict))
        category = metadata.get('category')
        require(category is None or isinstance(category, str))
        spanish = recipe['translations']['es']
        taste = taste_evidence(recipe)
        issues = []
        if taste['status'] == TASTE_CONFLICT:
            issues.append('RECONCILE_EXISTING_TASTING_WITH_STALE_STATUS')
        if 31 <= position <= 40:
            issues.append('TASTING_NOT_RECORDED')
        active = importer.selected_position(position)
        if not active:
            issues.append('HELD_UNTIL_PER_ID_PUBLICATION_REVIEW')
        row = {
            'id': recipe['id'], 'positionCatalog': position, 'batchNumber': (position - 1) // 10 + 1,
            'recordSha256': importer.record_digest(recipe), 'historicalSourceSha256': historical,
            'activeInCurrentApp': active, 'tasteStatus': taste['status'], 'issueCodes': issues,
            'categoryKnown': category is not None,
            'preparationTimeKnown': spanish['preparation_and_cooking_min'] is not None,
        }
        require(set(row) == CONTROL_FIELDS)
        control_rows.append(row)
        # Original records retain all five versions, quantities, steps, warnings
        # and heterogeneous editorial controls. No value in them is rewritten.
        private_rows.append({
            **row, 'titleEs': spanish['title'], 'languages': list(importer.SOURCE_LANGUAGES),
            'servings': spanish['servings'],
            'preparationAndCookingMinutes': spanish['preparation_and_cooking_min'],
            'category': {'sourceValue': category, 'mealCategory': None,
                         'sourcePath': 'metadata_original.category'},
            'tasteEvidence': taste,
            'editorialReview': {'structureRevalidated': True, 'sourceControlsPreserved': True,
                               'externalNativeCertificationVerified': False,
                               'sourceControlPaths': [key for key in recipe if
                                   re.search(r'^(qa_v|v\d+_review|editorial_|closure_record|translation_status)', key)]},
            'allergensAndPrecautions': {
                'sourceControlPaths': [key for key in recipe if re.search(r'allergen|food_safety', key)]
                    + ['translations.' + language + '.warnings' for language in importer.SOURCE_LANGUAGES],
                'originalWarningsPreserved': True, 'productLabelsOrTracesCertifiedByThisAudit': False,
            },
            'photo': {'state': 'NO_IMAGE_IN_SUPPLIED_ARCHIVE', 'asset': None},
            'commercial': {'realSkuLabelVerifiedByThisAudit': False,
                           'publicationScope': 'EXISTING_EDITORIAL_SELECTION_ONLY',
                           'allergenFreeClaimVerified': False},
            'originalRecord': recipe,
        })
    require(len({row['id'] for row in control_rows}) == 150)
    batches = []
    for batch in range(1, 16):
        rows = control_rows[(batch - 1) * 10:batch * 10]
        batches.append({
            'batchNumber': batch, 'firstPosition': (batch - 1) * 10 + 1, 'lastPosition': batch * 10,
            'recipeCount': len(rows), 'localizedRecords': len(rows) * 5,
            'activeRecipes': sum(row['activeInCurrentApp'] for row in rows),
            'heldRecipes': sum(not row['activeInCurrentApp'] for row in rows),
            'tastingRecorded': sum(row['tasteStatus'] in (TASTE_RECORDED, TASTE_CONFLICT) for row in rows),
            'tastingConflicts': sum(row['tasteStatus'] == TASTE_CONFLICT for row in rows),
            'unknownPreparationTimes': sum(not row['preparationTimeKnown'] for row in rows),
            'categoryNotProvided': sum(not row['categoryKnown'] for row in rows),
            'structureAcrossFiveLanguages': 'VALIDATED',
            'externalNativeCertificationVerified': False,
            'commercialLabelsVerifiedByThisAudit': False,
        })
    # Select integrity fields deliberately: the old importer includes a fixed
    # historical XLSX sentence that must not become a new external verification.
    origin = {key: integrity[key] for key in (
        'archiveSha256', 'archiveBytes', 'suppliedManifestSha256', 'manifestEntriesVerified',
        'archiveFileCount', 'catalogSha256', 'embeddedWorkbookSha256',
    )}
    origin.update({'embeddedWorkbookVerified': True, 'externalWorkbookReadByThisAudit': False,
                   'historicalOriginalDigestsIndependentlyRecomputed': False})
    summary = {
        'schemaVersion': 1, 'source': origin, 'sourceRecipeIds': 150, 'sourceLocalizedRecords': 750,
        'sourceLanguages': list(importer.SOURCE_LANGUAGES), 'activeV83': 120, 'legacyUnchanged': 7,
        'activeAppTotal': 127, 'heldV83': 30, 'publicationDecisionsChanged': False,
        'knownPreparationTimes': sum(row['preparationTimeKnown'] for row in control_rows),
        'unknownPreparationTimes': sum(not row['preparationTimeKnown'] for row in control_rows),
        'categoriesProvided': sum(row['categoryKnown'] for row in control_rows),
        'categoriesNotProvided': sum(not row['categoryKnown'] for row in control_rows),
        'closureCsvScope': {'firstPosition': 141, 'lastPosition': 150, 'localizedRecords': 50},
        'batches': batches,
    }
    approved, _, reserved = (public_source if public_source is not None
                              else importer.validated_public_archive(importer.PUBLIC_ARCHIVE))
    public_index, public_batches = public_projection(approved, reserved)
    actual = {recipe['id']: importer.record_digest(recipe) for recipe in recipes}
    require(all(actual.get(row['id']) == row['recordSha256'] for row in public_index['recipes']))
    files = {
        PRIVATE_REGISTRY: encoded({'schemaVersion': 1, 'privacy': 'PRIVATE_FULL_SOURCE_DO_NOT_PUBLISH',
                                   'source': origin, 'audit': summary, 'recipes': private_rows}),
        PUBLIC_INDEX: encoded(public_index),
        PUBLIC_BATCHES: encoded(public_batches),
    }
    files[PRIVATE_MANIFEST] = encoded({'schemaVersion': 1, 'files': [
        {'name': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
        for name, data in sorted(files.items())
    ]})
    require(set(files) == FILENAMES)
    return files


def output_path(destination: Path, *, existing: bool) -> Path:
    require('..' not in destination.parts)
    absolute = destination.absolute()
    for parent in (absolute, *absolute.parents):
        require(not parent.is_symlink())
    resolved = absolute.resolve()
    require(resolved != ROOT and ROOT not in resolved.parents)
    require(resolved.parent.is_dir())
    if existing:
        require(resolved.is_dir())
        info = resolved.stat()
        require(stat.S_IMODE(info.st_mode) == 0o700 and info.st_uid == os.getuid())
    else:
        require(not resolved.exists())
    return resolved


def materialize(destination: Path, files: dict[str, bytes], *, check: bool) -> None:
    require(set(files) == FILENAMES)
    target = output_path(destination, existing=check)
    if not check:
        target.mkdir(mode=0o700)
    folder = os.open(target, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        if check:
            require(set(os.listdir(folder)) == FILENAMES)
        for name, expected in sorted(files.items()):
            if check:
                # A replaced FIFO must fail the regular-file check, not block
                # while waiting for a writer before fstat can inspect it.
                fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=folder)
                with os.fdopen(fd, 'rb') as stream:
                    info = os.fstat(stream.fileno())
                    require(stat.S_ISREG(info.st_mode) and stat.S_IMODE(info.st_mode) == 0o600
                            and info.st_uid == os.getuid() and info.st_size == len(expected))
                    require(stream.read(len(expected) + 1) == expected)
            else:
                fd = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=folder)
                with os.fdopen(fd, 'wb') as stream:
                    stream.write(expected)
    finally:
        os.close(folder)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-zip', type=Path, required=True)
    parser.add_argument('--private-output', type=Path, required=True)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args(argv)
    try:
        recipes, integrity = importer.validated_archive(args.source_zip, None)
        files = audit_records(recipes, integrity)
        materialize(args.private_output, files, check=args.check)
    except (ValueError, KeyError, TypeError, OSError, OverflowError):
        # Avoid echoing retained recipe content or caller-supplied private paths.
        print('V83 audit failed: invalid source, metadata or private destination.', file=sys.stderr)
        return 2
    print('V83 audit PASS: 150 IDs / 750 localized records / 15 batches; app 127 unchanged; private source not published.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
