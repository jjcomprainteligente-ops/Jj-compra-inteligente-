#!/usr/bin/env python3
"""Reproduce the approved 150-recipe V3 projection without changing its sources.

The pinned app10mb data ZIP is read with the existing bounded intake. The V83
culinary projection rules are retained, including exact quantities and unknown
times. Existing V83 data and translation modules remain historical references.
No image, source ZIP, saved document, approval or commercial claim is created.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
from pathlib import Path
import secrets
import stat
import sys
import zipfile

import recetas_v3_intake as intake

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'referencias/recetas/V3/APP_LIGERO_10MB'
DATA_OUTPUT = ROOT / 'src/data/recipesV3.ts'
MESSAGES_OUTPUT = ROOT / 'src/i18n/catalogs/recipesV3.ts'
EXPECTED_DATA_SHA256 = 'e5654006ec2c6716b1cac8cdabbdca2f08422d31ba0982e9b3a888c02e874270'
EXPECTED_DATA_BYTES = 1_994_471

spec = importlib.util.spec_from_file_location('jj_v3_culinary_projection', ROOT / 'scripts/import-recipes-v83.py')
assert spec is not None and spec.loader is not None
previous = importlib.util.module_from_spec(spec)
spec.loader.exec_module(previous)


def require(condition: bool) -> None:
    if not condition:
        raise ValueError('V3 source, projection or destination does not match the approved contract.')


def validated_source(directory: Path = SOURCE) -> list[dict]:
    profile = intake.load_profile('app10mb')
    require(profile.data_package.sha256 == EXPECTED_DATA_SHA256
            and profile.data_package.size == EXPECTED_DATA_BYTES)
    # These repository-internal intake primitives share the existing path,
    # descriptor, pinned hash, ZIP/CRC, expansion, JSON and identity gates.
    # No Pillow import or image read is needed to reproduce culinary data.
    raw, _ = intake._data(profile, Path(directory), intake._Budget())
    rows = intake._json(raw[profile.recipe_entry])
    require(isinstance(rows, list) and len(rows) == 150)
    recipes = []
    for row in rows:
        require(row.get('can_publish_recipe_text') is True
                and row.get('can_publish_photo') is True
                and row.get('can_claim_allergen_safe') is False
                and row.get('can_publish_real_price') is False)
        recipes.append({'id': row['recipe_id'], 'position_catalog': row['position'],
                        'source_sha256': row['source_v83_sha256'],
                        'translations': row['localized']})
    previous.validate_recipes(recipes)
    require(all(intake.SHA_PATTERN.fullmatch(recipe['source_sha256']) for recipe in recipes))
    return recipes


def projection(recipes: list[dict]) -> tuple[list[dict], dict, dict]:
    """Project all approved IDs using the same culinary rules as historical V83."""
    previous.validate_recipes(recipes)
    active, metadata = [], {}
    messages = {language: {} for language in previous.APP_LANGUAGES}
    for recipe in recipes:
        position, recipe_id = recipe['position_catalog'], recipe['id']
        source = recipe['translations']['es']
        measured = [(index, row) for index, row in enumerate(source['ingredients']) if row['quantity'] is not None]
        unmeasured = [(index, row) for index, row in enumerate(source['ingredients']) if row['quantity'] is None]
        source_notes = previous.editorial_notes(source, 'es')
        item = {'id': recipe_id, 'title': source['title'], 'minutes': source['preparation_and_cooking_min'],
                'baseServings': source['servings'], 'ingredients': [], 'steps': source['steps'],
                'allergenNote': '\n\n'.join(source['warnings'])}
        for _, ingredient in measured:
            unit = ingredient['unit']
            name = ingredient['name'] + (' (' + previous.COUNT_QUALIFIERS[unit] + ')'
                                        if unit in previous.COUNT_QUALIFIERS else '')
            require(len(name) <= 120)
            converted = {'name': name, 'quantityMilli': previous.measured_milli(ingredient['quantity']),
                         'unit': previous.UNITS.get(unit, 'ud'), 'category': 'Otros'}
            if ingredient.get('optional') is True:
                converted['note'] = previous.COPY['es']['optional']
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
        for language in previous.APP_LANGUAGES:
            view, target = recipe['translations'][language], messages[language]
            # Retain existing keys so saved ingredient labels and callers keep
            # the original fallback and contextual translation contracts.
            prefix = 'recipesV83.' + recipe_id
            target[prefix + '.title'] = view['title']
            target[prefix + '.allergen'] = '\n\n'.join(view['warnings'])
            for index, step in enumerate(view['steps']):
                target[prefix + '.step.' + str(index)] = step
            for output_index, (source_index, row) in enumerate(measured):
                localized = view['ingredients'][source_index]
                qualifier = previous.COUNT_QUALIFIERS.get(row['unit'], '') if language == 'es' else localized['unit']
                name = localized['name'] + (' (' + qualifier + ')' if row['unit'] in previous.COUNT_QUALIFIERS else '')
                target[prefix + '.ingredient.' + str(output_index)] = name
                if row.get('optional') is True:
                    target[prefix + '.ingredientNote.' + str(output_index)] = previous.COPY[language]['optional']
            for output_index, (source_index, _) in enumerate(unmeasured):
                localized = view['ingredients'][source_index]
                target[prefix + '.unmeasured.' + str(output_index)] = localized['name']
                target[prefix + '.unmeasuredNote.' + str(output_index)] = localized['quantity_text']
            localized_notes = previous.editorial_notes(view, language)
            require(len(localized_notes) == len(source_notes))
            for index, note in enumerate(localized_notes):
                target[prefix + '.editorial.' + str(index)] = note
    require(len(active) == len(metadata) == 150)
    for language in previous.APP_LANGUAGES:
        require(set(messages[language]) == set(messages['es']))
    return active, messages, metadata


def require_historical_compatibility(active: list[dict], messages: dict, metadata: dict) -> dict:
    source, _, reserve = previous.validated_public_archive(previous.PUBLIC_ARCHIVE)
    old_active, old_messages, old_metadata, _ = previous.projection(source, reserve)
    current = {recipe['id']: recipe for recipe in active}
    require(all(current.get(recipe['id']) == recipe for recipe in old_active))
    require(all(metadata.get(key) == value for key, value in old_metadata.items()))
    require(all(all(messages[language].get(key) == value for key, value in old_messages[language].items())
                for language in previous.APP_LANGUAGES))
    return old_messages


def rendered_files(recipes: list[dict]) -> dict[Path, bytes]:
    active, messages, metadata = projection(recipes)
    historical_messages = require_historical_compatibility(active, messages, metadata)
    # The presentation helper uses the first supplied Spanish label as its
    # contextual global translation. Preserve that historical priority for saved
    # list labels while adding the new keys after all historical keys.
    messages = {language: {**historical_messages[language],
                           **{key: value for key, value in messages[language].items()
                              if key not in historical_messages[language]}}
                for language in previous.APP_LANGUAGES}
    header = '// Generated by scripts/import-recipes-v3.py; edit the importer, then regenerate.\n'
    data = header + "import type { Recipe } from '../domain/menus';\n\n"
    data += '/** 150 approved source records; legacy recipes are retained separately. */\n'
    data += 'export const V3_RECIPES: readonly Recipe[] = ' + previous.json_text(active).rstrip() + ';\n\n'
    data += 'export const V3_RECIPE_METADATA: Readonly<Record<string, {\n'
    data += '  positionCatalog: number; sourceSha256: string; sourceIngredientLines: readonly number[];\n'
    data += '  sourceUnits: readonly string[]; unmeasuredIngredientLines: readonly number[];\n'
    data += '}>> = ' + previous.json_text(metadata).rstrip() + ';\n'
    catalog = header + "import type { MessageCatalog } from '../types';\n\n"
    catalog += '/** Four active UI languages. All five original languages remain in the pinned source ZIP. */\n'
    catalog += 'export const v3RecipeMessages: MessageCatalog = ' + previous.json_text(messages).rstrip() + ';\n'
    return {DATA_OUTPUT: data.encode(), MESSAGES_OUTPUT: catalog.encode()}


def write_generated(path: Path, value: bytes) -> None:
    require(path in (DATA_OUTPUT, MESSAGES_OUTPUT))
    parent = intake._gates().open_directory(path.parent)
    temporary = '.' + path.name + '.v3-' + secrets.token_hex(8)
    created = False
    try:
        try:
            existing = os.stat(path.name, dir_fd=parent, follow_symlinks=False)
        except FileNotFoundError:
            existing = None
        require(existing is None or stat.S_ISREG(existing.st_mode))
        fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                     0o644, dir_fd=parent)
        created = True
        with os.fdopen(fd, 'wb') as stream:
            stream.write(value)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path.name, src_dir_fd=parent, dst_dir_fd=parent)
    finally:
        if created:
            try:
                os.unlink(temporary, dir_fd=parent)
            except FileNotFoundError:
                pass
        os.close(parent)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, default=SOURCE)
    parser.add_argument('--check', action='store_true', help='Compare generated files without writing.')
    args = parser.parse_args()
    files = rendered_files(validated_source(args.source_dir))
    if args.check:
        require(all(intake._read(path, 8 * 1024 * 1024) == value for path, value in files.items()))
        print('V3 check PASS: 150 source recipes / five source languages; 150 runtime recipes / four UI languages; historical 120 preserved.')
    else:
        for path, value in files.items():
            write_generated(path, value)
        print('V3 generated: 150 source records; legacy recipes, IDs, exact quantities and historical 120 projection preserved.')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, ValueError, TypeError, KeyError, UnicodeError, zipfile.BadZipFile):
        print('V3 import failed: source or generated projection rejected.', file=sys.stderr)
        raise SystemExit(1)
