#!/usr/bin/env python3
"""Prepare a reproducible, pending editorial review; never classify or activate recipes.

Only the existing pinned app10mb source and trusted repository validators are used.
--check and --validate-response are read-only. --write creates one new review
directory exclusively; an existing directory or linked path is never replaced.
"""
from __future__ import annotations

import argparse
from copy import deepcopy
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REVIEW_PARENT = ROOT / 'referencias/revision-culinaria'
REVIEW_NAME = 'B05_3'
ORIGINAL_ENTRY = 'datos/V83_150_RECETAS_ORIGINAL_COMPLETO_INALTERADO.json'
ORIGINAL_SHA256 = 'b07e87e9fa2c9267e82c214ae3f684e216dfd276965ae4b4e3fce41ab4afd83a'
MAX_RESPONSE_BYTES = 2 * 1024 * 1024
CATEGORIES = ('breakfast', 'main', 'dessert', 'other')
PREFERENCES = ('any', 'vegetarian', 'vegan')
BATCH_NAMES = tuple(f'lotes/lote_{i + 1:02d}_{i * 10 + 1:03d}_{i * 10 + 10:03d}.json' for i in range(15))

spec = importlib.util.spec_from_file_location('jj_culinary_v3_source', ROOT / 'scripts/import-recipes-v3.py')
assert spec is not None and spec.loader is not None
source_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(source_module)
intake = source_module.intake


def require(condition: bool) -> None:
    if not condition:
        raise ValueError('La fuente, revisión o destino no cumple el contrato editorial.')


def json_bytes(value: object, *, pretty: bool = True) -> bytes:
    """Retain the source's exact parsed numbers, including explicit unknown values."""
    data = json.dumps(value, ensure_ascii=False, sort_keys=not pretty,
                      indent=2 if pretty else None,
                      separators=None if pretty else (',', ':'),
                      default=source_module.previous.decimal_json, allow_nan=False).encode('utf-8')
    require(intake._json(data) == value)
    return data + (b'\n' if pretty else b'')


def digest(value: object) -> str:
    return hashlib.sha256(json_bytes(value, pretty=False)).hexdigest()


def validated_sources() -> tuple[list[dict], dict[str, dict], dict[str, dict]]:
    recipes = source_module.validated_source()
    profile = intake.load_profile('app10mb')
    require(profile.data_package.sha256 == source_module.EXPECTED_DATA_SHA256
            and profile.data_package.size == source_module.EXPECTED_DATA_BYTES)
    raw, _ = intake._data(profile, source_module.SOURCE, intake._Budget())
    enriched = intake._json(raw[profile.recipe_entry])
    with intake._zip(intake._payload(source_module.SOURCE, profile.data_package),
                     intake._Budget(), data=True) as archive:
        original_raw = intake._member(archive, archive.getinfo(ORIGINAL_ENTRY), keep=True)
    require(hashlib.sha256(original_raw).hexdigest() == ORIGINAL_SHA256)
    original = intake._json(original_raw)
    require(isinstance(original, list) and len(original) == len(recipes) == 150)
    originals: dict[str, dict] = {}
    for row in original:
        require(isinstance(row, dict) and isinstance(row.get('id'), str)
                and row['id'] not in originals and isinstance(row.get('metadata_original'), dict))
        originals[row['id']] = row
    enriched_by_id = {row['recipe_id']: row for row in enriched}
    require(set(originals) == set(enriched_by_id) == {row['id'] for row in recipes})
    for row in recipes:
        previous = originals[row['id']]
        require(previous['position_catalog'] == row['position_catalog']
                and previous['source_sha256'] == row['source_sha256']
                and previous['translations']['es'] == row['translations']['es'])
    return recipes, originals, enriched_by_id


def pending_decision() -> dict:
    return {'status': 'pending', 'value': None, 'reviewer': None, 'basis': None}


def review_documents(recipes: list[dict], originals: dict[str, dict], enriched: dict[str, dict]) -> dict[str, dict]:
    require(len(recipes) == len(originals) == len(enriched) == 150)
    profile = intake.load_profile('app10mb')
    contract = {
        'categoryValues': list(CATEGORIES),
        'dietaryValues': list(PREFERENCES),
        'decisionStatuses': ['pending', 'reviewed'],
        'independentDecisions': True,
        'reviewDoesNotCertifyAllergensTracesProductsPricesOrNativeLanguage': True,
        'responseValidationActivatesApplication': False,
    }
    provenance = {
        'profile': 'app10mb',
        'dataZipRepositoryPath': 'referencias/recetas/V3/APP_LIGERO_10MB/' + profile.data_package.name,
        'dataZipBytes': source_module.EXPECTED_DATA_BYTES,
        'dataZipSHA256': source_module.EXPECTED_DATA_SHA256,
        'recipeEntry': profile.recipe_entry,
        'originalEntry': ORIGINAL_ENTRY,
        'originalEntrySHA256': ORIGINAL_SHA256,
        'contextLanguage': 'es',
        'sourceLanguagesPreservedInZip': ['es', 'en', 'de', 'fr', 'bg'],
        'contextHashCanonicalization': 'UTF-8 JSON; recursively sorted keys; compact separators; finite exact numeric round-trip; no newline.',
    }
    records, detailed, seen = [], [], set()
    for position, row in enumerate(recipes, 1):
        rid = row.get('id')
        require(isinstance(rid, str) and bool(intake.ID_PATTERN.fullmatch(rid))
                and rid not in seen and type(row.get('position_catalog')) is int and row['position_catalog'] == position
                and isinstance(row.get('source_sha256'), str)
                and bool(intake.SHA_PATTERN.fullmatch(row['source_sha256']))
                and rid in originals and rid in enriched)
        seen.add(rid)
        historical, supplied = originals[rid], enriched[rid]
        require(historical['position_catalog'] == position and supplied['position'] == position
                and historical['source_sha256'] == supplied['source_v83_sha256'] == row['source_sha256']
                and historical['translations']['es'] == supplied['localized']['es'] == row['translations']['es'])
        context = {
            # Full source content retains measured/unmeasured/optional ingredients,
            # accompaniments, notes, steps, warnings and explicitly unknown times.
            'localizedEs': deepcopy(row['translations']['es']),
            'historicalMetadata': deepcopy(historical['metadata_original']),
            'editorialQuality': deepcopy(supplied['editorial_quality']),
            'allergenContext': deepcopy(supplied['allergens']),
            'commercialContext': deepcopy(supplied['commercial']),
        }
        record = {
            'recipeId': rid, 'position': position, 'sourceV83SHA256': row['source_sha256'],
            'contextSHA256': digest(context),
            'category': pending_decision(), 'dietary': pending_decision(),
        }
        records.append(record)
        detailed.append({**deepcopy(record), 'context': context})
    common = {'schemaVersion': 1, 'kind': 'JJ_CULINARY_REVIEW', 'source': provenance, 'contract': contract}
    documents = {'plantilla_150.json': {**common, 'recipes': records}}
    for index in range(15):
        first, last = index * 10 + 1, index * 10 + 10
        name = f'lotes/lote_{index + 1:02d}_{first:03d}_{last:03d}.json'
        documents[name] = {
            **deepcopy(common), 'batch': {'number': index + 1, 'firstPosition': first, 'lastPosition': last},
            'recipes': detailed[index * 10:index * 10 + 10],
        }
    return documents


def readme() -> bytes:
    return '''# B05.3 | Revisión culinaria pendiente por ID

Esta entrega prepara el trabajo editorial de ChatGPT/producto. Codex genera y
comprueba el paquete; **no clasifica las 150 recetas**. No cambia la aplicación,
las recetas, cantidades, fotos, avisos ni documentos guardados.

## Archivos

- `plantilla_150.json`: 150 IDs y sus dos decisiones independientes, todas
  `pending`, con `value`, `reviewer` y `basis` a `null`. No duplica el contexto.
- `lotes/`: 15 lotes de diez, en orden del catálogo. Cada registro conserva el
  contexto español completo recibido: ingredientes medidos/sin medida/optativos,
  acompañamientos, notas, tiempos desconocidos, pasos, advertencias y contexto
  comercial/alérgenos. Los cinco idiomas permanecen en el ZIP original fijado.
- Cada registro fija `sourceV83SHA256` y `contextSHA256`; la fuente y su ZIP están
  identificados en `source`. No modificar esos campos ni el contexto al revisar.

Las primeras 50 fichas históricas llevan `category: principal`, incluso recetas
descritas como postre en sus propios pasos; las otras 100 no tienen categoría.
Ese dato se conserva en `historicalMetadata`, **sin convertirlo en aprobación**.
No inferir una categoría del código BRK/DES ni una dieta del nombre o alérgenos.
Los permisos de publicación ya recibidos no certifican nuevas clasificaciones.

## Cómo revisar con ChatGPT/producto

Copiar el lote elegido fuera de esta carpeta generada y revisar las diez recetas.
Editar exclusivamente `category` y `dietary`; son decisiones independientes.

Categorías: `breakfast` (desayuno), `main` (plato principal/comida/cena), `dessert`
(postre), `other` (otros usos culinarios). No se deduce calendario ni número de
comidas. Preferencia: `vegan`, `vegetarian` o `any` (revisión realizada, sin ofrecer
las otras dos clasificaciones). Un caso ambiguo permanece `pending` y `null`.

Una decisión revisada usa `status: reviewed`, un valor de su lista, `reviewer`
con el responsable y `basis` con el fundamento y referencias por receta. Leer
ingredientes opcionales, menciones sin medida, acompañamientos, pasos y notas.
No omitir queso/cuajo, caldos, salsas, gelatina u otros ingredientes dependientes
de composición para forzar una etiqueta. No deducir ausencia de alérgenos/trazas.

Una decisión pendiente conserva exactamente los cuatro campos originales.
Puede revisarse categoría sin resolver dieta, o dieta sin resolver categoría.
No cambiar IDs, posiciones, ingredientes, cantidades, tiempos, fuente o huellas.
No añadir afirmaciones de precio, etiquetas comerciales o certificación sanitaria.

## Comprobación y conservación

Desde la raíz del repositorio, con Python estándar:

```sh
python scripts/prepare-culinary-review.py --check
python scripts/prepare-culinary-review.py --validate-response /tmp/jj-revision-lote-01.json
```

`--validate-response` acepta una copia completa de un lote o la plantilla de150.
Comprueba esquema, IDs, integridad del contexto y decisiones; **no certifica el
juicio editorial ni activa datos en la app**. La respuesta debe volver a revisarse
antes de una integración de Codex. No incluir datos personales en los fundamentos.

`--check` es de solo lectura y exige reproducción exacta de los 17 archivos, sin
extras. `--write` solo crea `referencias/revision-culinaria/B05_3/` si aún no existe;
no sobrescribe una entrega ni una respuesta anterior. La escritura es exclusiva
por archivo, no un lote atómico: un fallo deja una preparación incompleta propia,
sale con error y `--check` la rechaza. No borra originales ni archivos existentes.
No regenerar sobre una carpeta existente; conservar cada versión y su trazabilidad.
'''.encode('utf-8')


def generated_files(documents: dict[str, dict]) -> dict[str, bytes]:
    require(set(documents) == {'plantilla_150.json', *BATCH_NAMES})
    return {'README.md': readme(), **{name: json_bytes(document) for name, document in documents.items()}}


def check_output(files: dict[str, bytes]) -> None:
    root = REVIEW_PARENT / REVIEW_NAME
    expected = {'README.md', 'plantilla_150.json', 'lotes'}
    fd = intake._gates().open_directory(root)
    try:
        with os.scandir(fd) as entries:
            actual = {entry.name for entry in entries}
        require(actual == expected)
        lotes = os.open('lotes', os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
        try:
            with os.scandir(lotes) as entries:
                actual_lots = {entry.name for entry in entries}
            require(actual_lots == {PurePosixPath(name).name for name in files if name.startswith('lotes/')})
        finally:
            os.close(lotes)
    finally:
        os.close(fd)
    for name, content in files.items():
        require(intake._read(root / name, MAX_RESPONSE_BYTES) == content)


def write_new_output(files: dict[str, bytes]) -> None:
    require(REVIEW_PARENT.name == 'revision-culinaria')
    expected = {'README.md', 'plantilla_150.json', *BATCH_NAMES}
    require(set(files) == expected)
    for name, content in files.items():
        require(isinstance(content, bytes) and len(content) <= MAX_RESPONSE_BYTES)
        parts = PurePosixPath(name).parts
        require(name in expected and len(parts) in (1, 2))
    parent = intake._gates().open_directory(REVIEW_PARENT.parent)
    try:
        try:
            os.mkdir(REVIEW_PARENT.name, 0o755, dir_fd=parent)
        except FileExistsError:
            pass
        review_parent = os.open(REVIEW_PARENT.name, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=parent)
        try:
            # Existence is always a rejection, including an empty directory.
            os.mkdir(REVIEW_NAME, 0o755, dir_fd=review_parent)
            root = os.open(REVIEW_NAME, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=review_parent)
            try:
                os.mkdir('lotes', 0o755, dir_fd=root)
                lotes = os.open('lotes', os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=root)
                try:
                    for name, content in files.items():
                        parts = PurePosixPath(name).parts
                        fd = os.open(parts[-1], os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                                     0o644, dir_fd=lotes if len(parts) == 2 else root)
                        with os.fdopen(fd, 'wb') as stream:
                            stream.write(content)
                            stream.flush()
                            os.fsync(stream.fileno())
                finally:
                    os.close(lotes)
            finally:
                os.close(root)
        finally:
            os.close(review_parent)
    finally:
        os.close(parent)


def validate_decision(value: object, permitted: tuple[str, ...]) -> None:
    require(isinstance(value, dict) and set(value) == {'status', 'value', 'reviewer', 'basis'})
    if value['status'] == 'pending':
        require(value == pending_decision())
        return
    require(value['status'] == 'reviewed' and isinstance(value['value'], str) and value['value'] in permitted)
    for key, maximum in [('reviewer', 160), ('basis', 4000)]:
        require(isinstance(value[key], str) and 0 < len(value[key].strip()) <= maximum
                and value[key] == value[key].strip()
                and not source_module.previous.UNSAFE_TEXT.search(value[key]))


def validate_response(response: object, documents: dict[str, dict]) -> dict:
    require(isinstance(response, dict))
    if 'batch' in response:
        batch = response['batch']
        require(isinstance(batch, dict) and type(batch.get('number')) is int and 1 <= batch['number'] <= 15)
        number = batch['number']
        expected = documents[f'lotes/lote_{number:02d}_{number * 10 - 9:03d}_{number * 10:03d}.json']
    else:
        expected = documents['plantilla_150.json']
    require(set(response) == set(expected) and type(response.get('schemaVersion')) is int
            and isinstance(response.get('recipes'), list) and len(response['recipes']) == len(expected['recipes']))
    require(json_bytes({k: v for k, v in response.items() if k != 'recipes'}, pretty=False)
            == json_bytes({k: v for k, v in expected.items() if k != 'recipes'}, pretty=False))
    counts = {'recipes': len(response['recipes']), 'reviewedCategories': 0, 'reviewedDietaryPreferences': 0,
              'applicationActivated': False, 'editorialJudgmentCertified': False}
    for actual, original in zip(response['recipes'], expected['recipes']):
        require(isinstance(actual, dict) and set(actual) == set(original))
        require(json_bytes({k: v for k, v in actual.items() if k not in ('category', 'dietary')}, pretty=False)
                == json_bytes({k: v for k, v in original.items() if k not in ('category', 'dietary')}, pretty=False))
        validate_decision(actual['category'], CATEGORIES)
        validate_decision(actual['dietary'], PREFERENCES)
        counts['reviewedCategories'] += actual['category']['status'] == 'reviewed'
        counts['reviewedDietaryPreferences'] += actual['dietary']['status'] == 'reviewed'
    return counts


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    actions = parser.add_mutually_exclusive_group(required=True)
    actions.add_argument('--check', action='store_true')
    actions.add_argument('--write', action='store_true')
    actions.add_argument('--validate-response', type=Path)
    args = parser.parse_args()
    documents = review_documents(*validated_sources())
    if args.validate_response is not None:
        result = validate_response(intake._json(intake._read(args.validate_response, MAX_RESPONSE_BYTES)), documents)
        print(json.dumps({'status': 'RESPONSE_STRUCTURE_VERIFIED_NOT_ACTIVATED', **result}, ensure_ascii=False))
        return 0
    files = generated_files(documents)
    if args.check:
        check_output(files)
    else:
        write_new_output(files)
        check_output(files)
    print(json.dumps({'status': 'PENDING_REVIEW_REPRODUCED' if args.check else 'PENDING_REVIEW_PREPARED',
                      'recipes': 150, 'batches': 15, 'files': len(files),
                      'reviewedCategories': 0, 'reviewedDietaryPreferences': 0,
                      'applicationActivated': False}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, ValueError, TypeError, KeyError, UnicodeError, RecursionError, zipfile.BadZipFile):
        print('Revisión culinaria rechazada: fuente, esquema, integridad o destino no válidos.', file=sys.stderr)
        raise SystemExit(1)
