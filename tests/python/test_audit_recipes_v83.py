"""Public synthetic fixtures: the private 150-recipe ZIP is never needed in CI."""
import contextlib
import copy
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location('b03_audit', ROOT / 'scripts/audit-recipes-v83.py')
audit = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit)


def fixture():
    recipes = []
    for position in range(1, 151):
        recipe_id = f'JJ-TEST-{position:03}'
        confirmed = not (31 <= position <= 40 or 111 <= position <= 120)
        translations = {}
        for language in audit.importer.SOURCE_LANGUAGES:
            translations[language] = {
                'recipe_id': recipe_id, 'language': language, 'servings': 2,
                'title': f'PRIVATE_TITLE_SENTINEL_{position}_{language}',
                'preparation_and_cooking_min': 30 if position <= 60 else None,
                'ingredients': [{'line': 1, 'name': 'PRIVATE_INGREDIENT_SENTINEL',
                                 'quantity': 10, 'unit': 'g', 'source_name_es': 'ingredient anchor',
                                 'source_unit_es': 'g'}],
                'steps': ['PRIVATE_STEP_SENTINEL'], 'warnings': ['PRIVATE_WARNING_SENTINEL'],
                'user_taste_confirmed': confirmed,
            }
        recipe = {
            'id': recipe_id, 'position_catalog': position,
            'source_sha256': hashlib.sha256(recipe_id.encode()).hexdigest(),
            'metadata_original': {'category': 'principal'} if position <= 50 else {},
            'translations': translations,
            'user_cooking_test': {'confirmed': not 31 <= position <= 40},
            'unexpected_private_editorial_text': 'PRIVATE_UNEXPECTED_SENTINEL',
        }
        if 11 <= position <= 20:
            recipe['user_cooking_test'] = {'completed': False}
            recipe['v62_review'] = {'user_taste_test': {'reported': True, 'result': 'satisfactorio'}}
        recipes.append(recipe)
    integrity = {
        'archiveSha256': audit.importer.EXPECTED_ZIP_SHA256, 'archiveBytes': 937580,
        'manifestEntriesVerified': 13, 'archiveFileCount': 14,
        'suppliedManifestSha256': '1' * 64, 'catalogSha256': '2' * 64,
        'embeddedWorkbookSha256': audit.importer.EXPECTED_XLSX_SHA256,
        'externalWorkbookIdentity': 'PRIVATE_OLD_HISTORICAL_SENTENCE',
    }
    return recipes, integrity


def public_fixture(records):
    approved = [record for record in records if audit.importer.selected_position(record['position_catalog'])]
    reserved = []
    for record in records:
        position = record['position_catalog']
        if audit.importer.selected_position(position):
            continue
        reason = next(reason for low, high, reason in audit.importer.EXCLUDED_RANGES if low <= position <= high)
        reserved.append({'id': record['id'], 'positionCatalog': position,
                         'recordSha256': audit.importer.record_digest(record), 'reason': reason})
    return approved, {}, reserved


def render_fixture(records, integrity):
    return audit.audit_records(records, integrity, public_source=public_fixture(records))


class CatalogueBoundaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.recipes, cls.integrity = fixture()
        cls.files = render_fixture(cls.recipes, cls.integrity)

    def test_public_index_has_exact_allowlist_and_no_recipe_content(self):
        raw = self.files[audit.PUBLIC_INDEX]
        for sentinel in [b'PRIVATE_TITLE', b'PRIVATE_INGREDIENT', b'PRIVATE_STEP',
                         b'PRIVATE_WARNING', b'PRIVATE_UNEXPECTED', b'PRIVATE_OLD']:
            self.assertNotIn(sentinel, raw)
        rows = json.loads(raw)['recipes']
        self.assertEqual(len(rows), 150)
        self.assertEqual(len({row['id'] for row in rows}), 150)
        for row in rows:
            allowed = {'id', 'positionCatalog', 'batchNumber', 'recordSha256', 'historicalSourceSha256',
                       'activeInCurrentApp', 'categoryKnown', 'preparationTimeKnown'} if row.get('activeInCurrentApp') else {
                           'id', 'positionCatalog', 'recordSha256', 'reason'}
            self.assertEqual(set(row), allowed)
        self.assertEqual(sum(row.get('activeInCurrentApp') is True for row in rows), 120)
        self.assertEqual(sum(row.get('activeInCurrentApp') is not True for row in rows), 30)

    def test_private_originals_and_five_languages_are_preserved(self):
        rows = json.loads(self.files[audit.PRIVATE_REGISTRY])['recipes']
        for original, row in zip(self.recipes, rows):
            self.assertEqual(row['originalRecord'], original)
            self.assertEqual(row['recordSha256'], audit.importer.record_digest(original))
            self.assertEqual(set(row['originalRecord']['translations']), set(audit.importer.SOURCE_LANGUAGES))
        self.assertEqual(sum(len(row['originalRecord']['translations']) for row in rows), 750)

    def test_null_times_and_unstated_categories_remain_unknown(self):
        rows = json.loads(self.files[audit.PRIVATE_REGISTRY])['recipes']
        self.assertEqual(sum(row['preparationAndCookingMinutes'] is None for row in rows), 90)
        self.assertEqual(sum(row['category']['sourceValue'] is None for row in rows), 100)
        self.assertTrue(all(row['category']['mealCategory'] is None for row in rows))

    def test_tasting_conflicts_do_not_erase_recorded_taste_or_release_recipes(self):
        rows = json.loads(self.files[audit.PRIVATE_REGISTRY])['recipes']
        for position in [11, 20, 111, 120]:
            self.assertEqual(rows[position - 1]['tasteStatus'], audit.TASTE_CONFLICT)
            self.assertFalse(rows[position - 1]['activeInCurrentApp'])
        for position in [31, 40]:
            self.assertEqual(rows[position - 1]['tasteStatus'], audit.TASTE_PENDING)
            self.assertFalse(rows[position - 1]['activeInCurrentApp'])

    def test_structure_is_not_promoted_to_native_or_commercial_certification(self):
        summary = json.loads(self.files[audit.PRIVATE_REGISTRY])['audit']
        self.assertFalse(summary['publicationDecisionsChanged'])
        self.assertFalse(summary['source']['externalWorkbookReadByThisAudit'])
        self.assertFalse(summary['source']['historicalOriginalDigestsIndependentlyRecomputed'])
        self.assertEqual(summary['closureCsvScope']['localizedRecords'], 50)
        self.assertEqual(len(summary['batches']), 15)
        for batch in summary['batches']:
            self.assertEqual(batch['localizedRecords'], 50)
            self.assertFalse(batch['externalNativeCertificationVerified'])
            self.assertFalse(batch['commercialLabelsVerifiedByThisAudit'])
        self.assertNotIn(b'PRIVATE_OLD_HISTORICAL_SENTENCE', self.files[audit.PUBLIC_BATCHES])

    def test_render_is_deterministic_without_mutating_the_source(self):
        before = copy.deepcopy(self.recipes)
        self.assertEqual(self.files, render_fixture(self.recipes, self.integrity))
        self.assertEqual(self.recipes, before)

    def test_duplicate_or_missing_id_language_or_quantity_mismatch_is_rejected(self):
        for mutation in ['duplicate', 'language', 'quantity', 'historicalDigest']:
            with self.subTest(mutation=mutation):
                records = copy.deepcopy(self.recipes)
                if mutation == 'duplicate':
                    records[1]['id'] = records[0]['id']
                elif mutation == 'language':
                    del records[0]['translations']['fr']
                elif mutation == 'quantity':
                    records[0]['translations']['de']['ingredients'][0]['quantity'] = 11
                else:
                    records[0]['source_sha256'] = 'private arbitrary value'
                with self.assertRaises(ValueError):
                    render_fixture(records, self.integrity)

    def test_reserved_public_rows_are_exact_existing_provenance_without_new_editorial_states(self):
        approved, _, reserved = public_fixture(self.recipes)
        index, batches = audit.public_projection(approved, reserved)
        actual = [row for row in index['recipes'] if not row.get('activeInCurrentApp')]
        self.assertEqual(actual, reserved)
        self.assertFalse(batches['newHeldEditorialDataIncluded'])
        raw = json.dumps(index) + json.dumps(batches)
        for field in ['tasteStatus', 'tasteEvidence', 'evidencePaths', 'proposedPrecedence', 'tastingRecorded']:
            self.assertNotIn(field, raw)
        self.assertEqual(sum(row['publicLocalizedRecords'] for row in batches['batches']), 600)

    def test_checked_in_public_artifacts_reproduce_without_the_private_archive(self):
        with patch.object(audit.importer, 'validated_archive', side_effect=AssertionError('Private input forbidden')):
            approved, _, reserved = audit.importer.validated_public_archive(audit.importer.PUBLIC_ARCHIVE)
            index, batches = audit.public_projection(approved, reserved)
        folder = ROOT / 'referencias/recetas-v83/catalogo-maestro'
        self.assertEqual((folder / 'INDICE_PUBLICO_150.json').read_bytes(), audit.encoded(index))
        self.assertEqual((folder / 'CONTROL_LOTES_15.json').read_bytes(), audit.encoded(batches))

    def test_private_manifest_hashes_and_sizes_match_actual_generated_files(self):
        manifest = json.loads(self.files[audit.PRIVATE_MANIFEST])
        self.assertEqual(len(manifest['files']), 3)
        for row in manifest['files']:
            payload = self.files[row['name']]
            self.assertEqual(row['bytes'], len(payload))
            self.assertEqual(row['sha256'], hashlib.sha256(payload).hexdigest())


class PrivateOutputTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        recipes, integrity = fixture()
        cls.files = render_fixture(recipes, integrity)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='jj-b03-test-')
        self.addCleanup(self.temp.cleanup)
        self.parent = Path(self.temp.name)
        self.target = self.parent / 'private-new'

    def test_creation_permissions_and_check_without_writes_or_mtime_changes(self):
        audit.materialize(self.target, self.files, check=False)
        self.assertEqual(stat.S_IMODE(self.target.stat().st_mode), 0o700)
        before = {p.name: (p.read_bytes(), p.stat().st_mtime_ns) for p in self.target.iterdir()}
        self.assertTrue(all(stat.S_IMODE(p.stat().st_mode) == 0o600 for p in self.target.iterdir()))
        audit.materialize(self.target, self.files, check=True)
        self.assertEqual(before, {p.name: (p.read_bytes(), p.stat().st_mtime_ns) for p in self.target.iterdir()})

    def test_existing_destination_is_never_overwritten(self):
        self.target.mkdir(mode=0o700)
        marker = self.target / 'owner-content'
        marker.write_text('keep these bytes')
        with self.assertRaises(ValueError):
            audit.materialize(self.target, self.files, check=False)
        self.assertEqual(marker.read_text(), 'keep these bytes')
        self.assertEqual(list(self.target.iterdir()), [marker])

    def test_changed_file_fails_check_without_repair_or_overwrite(self):
        audit.materialize(self.target, self.files, check=False)
        file = self.target / audit.PUBLIC_INDEX
        file.write_bytes(b'changed')
        before = {p.name: (p.read_bytes(), p.stat().st_mtime_ns) for p in self.target.iterdir()}
        with self.assertRaises(ValueError):
            audit.materialize(self.target, self.files, check=True)
        self.assertEqual(before, {p.name: (p.read_bytes(), p.stat().st_mtime_ns) for p in self.target.iterdir()})

    def test_symlink_destination_and_ancestor_are_rejected(self):
        real = self.parent / 'real'
        real.mkdir(mode=0o700)
        link = self.parent / 'link'
        link.symlink_to(real, target_is_directory=True)
        for target in [link, link / 'child']:
            with self.subTest(target=target):
                with self.assertRaises(ValueError):
                    audit.materialize(target, self.files, check=False)
        self.assertEqual(list(real.iterdir()), [])

    def test_symlink_file_is_never_read_or_written(self):
        audit.materialize(self.target, self.files, check=False)
        outside = self.parent / 'outside'
        outside.write_text('preserve')
        file = self.target / audit.PUBLIC_INDEX
        file.unlink()
        file.symlink_to(outside)
        with self.assertRaises(OSError):
            audit.materialize(self.target, self.files, check=True)
        self.assertEqual(outside.read_text(), 'preserve')

    def test_fifo_is_rejected_without_waiting_for_a_writer(self):
        audit.materialize(self.target, self.files, check=False)
        file = self.target / audit.PUBLIC_INDEX
        file.unlink()
        os.mkfifo(file, mode=0o600)
        code = '''import importlib.util, pathlib, sys
s = importlib.util.spec_from_file_location('fifo_audit', sys.argv[1])
a = importlib.util.module_from_spec(s)
s.loader.exec_module(a)
try:
    a.materialize(pathlib.Path(sys.argv[2]), {name: b'fixture' for name in a.FILENAMES}, check=True)
except ValueError:
    raise SystemExit(0)
raise SystemExit(3)
'''
        result = subprocess.run([sys.executable, '-c', code, str(ROOT / 'scripts/audit-recipes-v83.py'),
                                 str(self.target)], capture_output=True, timeout=3)
        self.assertEqual(result.returncode, 0)
        self.assertTrue(stat.S_ISFIFO(file.stat().st_mode))

    def test_repository_destination_or_parent_traversal_is_rejected(self):
        for target in [ROOT / 'private-audit-output', self.parent / '..' / 'not-allowed']:
            with self.subTest(target=target):
                with self.assertRaises(ValueError):
                    audit.materialize(target, self.files, check=False)

    def test_relaxed_permissions_and_unexpected_files_fail_read_only_check(self):
        audit.materialize(self.target, self.files, check=False)
        file = self.target / audit.PUBLIC_INDEX
        file.chmod(0o644)
        with self.assertRaises(ValueError):
            audit.materialize(self.target, self.files, check=True)
        file.chmod(0o600)
        (self.target / 'unexpected').write_text('preserve')
        with self.assertRaises(ValueError):
            audit.materialize(self.target, self.files, check=True)
        self.assertEqual((self.target / 'unexpected').read_text(), 'preserve')

    def test_wrong_archive_reveals_no_private_path_and_creates_no_output(self):
        source = self.parent / 'PRIVATE_PATH_SENTINEL.zip'
        source.write_bytes(b'not the pinned supplied archive')
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            result = audit.main(['--source-zip', str(source), '--private-output', str(self.target)])
        self.assertEqual(result, 2)
        self.assertNotIn('PRIVATE_PATH_SENTINEL', stderr.getvalue())
        self.assertFalse(self.target.exists())


if __name__ == '__main__':
    unittest.main()
