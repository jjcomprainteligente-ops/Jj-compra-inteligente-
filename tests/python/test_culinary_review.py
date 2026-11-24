"""Editorial review is reproducible, integrity-bound and never a classification bypass."""
from copy import deepcopy
import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'scripts'))
spec = importlib.util.spec_from_file_location('jj_culinary_review_tests', ROOT/'scripts/prepare-culinary-review.py')
assert spec and spec.loader
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
FIRST_BATCH = 'lotes/lote_01_001_010.json'


class EditorialBoundaries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sources = review.validated_sources()
        cls.documents = review.review_documents(*cls.sources)
        cls.files = review.generated_files(cls.documents)

    def batch(self):
        return deepcopy(self.documents[FIRST_BATCH])

    def reviewed(self, value):
        return {'status': 'reviewed', 'value': value, 'reviewer': 'Responsable editorial de prueba',
                'basis': 'Prueba estructural únicamente; no representa una decisión real ni activa recetas.'}

    def test_all_ids_and_context_survive_without_inferred_decisions(self):
        recipes, originals, _ = self.sources
        records = self.documents['plantilla_150.json']['recipes']
        batches = [d for d in self.documents.values() if 'batch' in d]
        details = [r for d in batches for r in d['recipes']]
        self.assertEqual(len(self.files), 17)
        self.assertEqual(len(batches), 15)
        self.assertTrue(all(len(d['recipes']) == 10 for d in batches))
        self.assertEqual([r['recipeId'] for r in records], [r['id'] for r in recipes])
        self.assertEqual(len({r['recipeId'] for r in details}), 150)
        for record, detailed, original in zip(records, details, recipes):
            self.assertEqual(detailed['context']['localizedEs'], original['translations']['es'])
            self.assertEqual(detailed['context']['historicalMetadata'], originals[record['recipeId']]['metadata_original'])
            self.assertEqual(record['contextSHA256'], review.digest(detailed['context']))
            self.assertEqual(record['category'], review.pending_decision())
            self.assertEqual(record['dietary'], review.pending_decision())
        self.assertEqual(sum('category' in r['context']['historicalMetadata'] for r in details), 50)
        self.assertEqual(self.files, review.generated_files(review.review_documents(*self.sources)))

    def test_culinary_optionals_and_unmeasured_notes_are_not_omitted(self):
        details = {r['recipeId']: r['context']['localizedEs'] for d in self.documents.values()
                   if 'batch' in d for r in d['recipes']}
        self.assertTrue(details['JJ-E03-001']['optional_serving_accompaniments'])
        self.assertTrue(details['JJ-E03-004']['mentioned_unmeasured_ingredients'])
        self.assertTrue(any(i.get('optional') is True for i in details['JJ-E11-BRK-001']['ingredients']))
        self.assertTrue(details['JJ-E03-001']['warnings'])

    def test_pending_response_validates_without_activating_or_claiming_review(self):
        for response in [self.batch(), self.documents['plantilla_150.json']]:
            result = review.validate_response(response, self.documents)
            self.assertEqual(result['reviewedCategories'], 0)
            self.assertEqual(result['reviewedDietaryPreferences'], 0)
            self.assertFalse(result['applicationActivated'])
            self.assertFalse(result['editorialJudgmentCertified'])

    def test_category_and_dietary_review_are_independent(self):
        response = self.batch()
        response['recipes'][0]['category'] = self.reviewed('other')
        result = review.validate_response(response, self.documents)
        self.assertEqual((result['reviewedCategories'], result['reviewedDietaryPreferences']), (1, 0))
        response['recipes'][0]['category'] = review.pending_decision()
        response['recipes'][0]['dietary'] = self.reviewed('any')
        result = review.validate_response(response, self.documents)
        self.assertEqual((result['reviewedCategories'], result['reviewedDietaryPreferences']), (0, 1))

    def test_unknown_duplicate_or_reordered_identity_is_rejected(self):
        for mutate in [lambda rows: rows[0].update(recipeId='JJ-UNKNOWN'),
                       lambda rows: rows.__setitem__(0, deepcopy(rows[1])),
                       lambda rows: rows.reverse(),
                       lambda rows: rows.pop()]:
            response = self.batch()
            mutate(response['recipes'])
            with self.assertRaises(ValueError):
                review.validate_response(response, self.documents)

    def test_changed_source_hash_context_hash_or_position_is_rejected(self):
        for field, value in [('sourceV83SHA256', '0'*64), ('contextSHA256', 'f'*64),
                             ('position', 2), ('position', True)]:
            with self.subTest(field=field, value=value):
                response = self.batch()
                response['recipes'][0][field] = value
                with self.assertRaises(ValueError):
                    review.validate_response(response, self.documents)

    def test_changed_ingredients_steps_or_optional_context_are_rejected(self):
        for mutate in [lambda context: context['localizedEs']['ingredients'][0].update(quantity=999),
                       lambda context: context['localizedEs']['steps'].__setitem__(0, 'Otro paso'),
                       lambda context: context['localizedEs'].pop('optional_serving_accompaniments'),
                       lambda context: context['historicalMetadata'].update(category='dessert')]:
            response = self.batch()
            mutate(response['recipes'][0]['context'])
            with self.assertRaises(ValueError):
                review.validate_response(response, self.documents)

    def test_changed_contract_batch_or_schema_cannot_relax_gates(self):
        for mutate in [lambda r: r.update(schemaVersion=True),
                       lambda r: r['contract']['dietaryValues'].append('allergen-free'),
                       lambda r: r['batch'].update(number=True),
                       lambda r: r['source'].update(dataZipSHA256='0'*64),
                       lambda r: r.update(extra='ignored')]:
            response = self.batch()
            mutate(response)
            with self.assertRaises(ValueError):
                review.validate_response(response, self.documents)

    def test_reviewed_decision_requires_permitted_value_reviewer_and_basis(self):
        for key, value in [('value', None), ('value', 'allergen-free'), ('value', []),
                           ('reviewer', None), ('reviewer', ''), ('reviewer', 'x'*161),
                           ('basis', None), ('basis', '   '), ('basis', 'x'*4001), ('basis', 'bad\x00text')]:
            with self.subTest(key=key):
                response = self.batch()
                decision = self.reviewed('vegan')
                decision[key] = value
                response['recipes'][0]['dietary'] = decision
                with self.assertRaises(ValueError):
                    review.validate_response(response, self.documents)

    def test_pending_decision_cannot_smuggle_a_classification_or_extra_fields(self):
        for key, value in [('value', 'vegan'), ('reviewer', 'Someone'), ('basis', 'provisional'),
                           ('unknown', None), ('status', 'approved')]:
            response = self.batch()
            response['recipes'][0]['dietary'][key] = value
            with self.assertRaises(ValueError):
                review.validate_response(response, self.documents)

    def test_malformed_source_identity_hash_or_order_is_rejected(self):
        for key, value in [('id', 'JJ-UNKNOWN'), ('source_sha256', 'bad'),
                           ('position_catalog', True), ('position_catalog', 2)]:
            changed = deepcopy(self.sources[0])
            changed[0][key] = value
            with self.assertRaises(ValueError):
                review.review_documents(changed, self.sources[1], self.sources[2])

    def test_changed_original_context_is_not_silently_published(self):
        originals = deepcopy(self.sources[1])
        first = self.sources[0][0]['id']
        originals[first]['translations']['es']['steps'][0] = 'Alterado'
        with self.assertRaises(ValueError):
            review.review_documents(self.sources[0], originals, self.sources[2])

    def test_source_zip_hash_mismatch_is_rejected_before_decode(self):
        with patch.object(review.source_module, 'EXPECTED_DATA_SHA256', '0'*64):
            with self.assertRaises(ValueError):
                review.validated_sources()

    def test_response_decoder_rejects_duplicates_nan_nul_and_invalid_utf8(self):
        for payload in [b'{"a":1,"a":2}', b'{"a":NaN}', b'{"a":"\x00"}', b'{"a":"\xff"}']:
            with self.subTest(payload=payload):
                with self.assertRaises((ValueError, UnicodeError)):
                    review.intake._json(payload)

    def test_exclusive_creation_check_is_read_only_and_preserves_existing_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            parent = Path(directory)/'revision-culinaria'
            with patch.object(review, 'REVIEW_PARENT', parent):
                review.write_new_output(self.files)
                before = {str(p.relative_to(parent)): (p.read_bytes(), p.stat().st_mtime_ns)
                          for p in parent.rglob('*') if p.is_file()}
                review.check_output(self.files)
                with self.assertRaises(FileExistsError):
                    review.write_new_output(self.files)
                after = {str(p.relative_to(parent)): (p.read_bytes(), p.stat().st_mtime_ns)
                         for p in parent.rglob('*') if p.is_file()}
                self.assertEqual(before, after)

    def test_existing_empty_directory_is_not_replaced(self):
        with tempfile.TemporaryDirectory() as directory:
            parent = Path(directory)/'revision-culinaria'
            (parent/'B05_3').mkdir(parents=True)
            with patch.object(review, 'REVIEW_PARENT', parent):
                with self.assertRaises(FileExistsError):
                    review.write_new_output(self.files)
            self.assertEqual(list((parent/'B05_3').iterdir()), [])

    def test_linked_parent_is_rejected_without_writing_target(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)/'owner'
            target.mkdir()
            parent = Path(directory)/'revision-culinaria'
            parent.symlink_to(target, target_is_directory=True)
            with patch.object(review, 'REVIEW_PARENT', parent):
                with self.assertRaises(OSError):
                    review.write_new_output(self.files)
            self.assertEqual(list(target.iterdir()), [])

    def test_unknown_output_path_is_rejected_before_creating_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            parent = Path(directory)/'revision-culinaria'
            files = {**self.files, '../owner.json': b'{}'}
            with patch.object(review, 'REVIEW_PARENT', parent):
                with self.assertRaises(ValueError):
                    review.write_new_output(files)
            self.assertFalse(parent.exists())

    def test_tampered_missing_or_extra_generated_files_fail_check(self):
        with tempfile.TemporaryDirectory() as directory:
            parent = Path(directory)/'revision-culinaria'
            with patch.object(review, 'REVIEW_PARENT', parent):
                review.write_new_output(self.files)
                template = parent/'B05_3/plantilla_150.json'
                original = template.read_bytes()
                template.write_bytes(b'{}')
                with self.assertRaises(ValueError):
                    review.check_output(self.files)
                template.write_bytes(original)
                extra = parent/'B05_3/lotes/extra.json'
                extra.write_bytes(b'{}')
                with self.assertRaises(ValueError):
                    review.check_output(self.files)
                extra.unlink()
                template.unlink()
                with self.assertRaises(ValueError):
                    review.check_output(self.files)

    def test_linked_or_oversized_response_file_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)/'response.json'
            target.write_bytes(b'{}')
            linked = Path(directory)/'linked.json'
            linked.symlink_to(target)
            with self.assertRaises(ValueError):
                review.intake._read(linked, review.MAX_RESPONSE_BYTES)
            target.write_bytes(b'x'*(review.MAX_RESPONSE_BYTES+1))
            with self.assertRaises(ValueError):
                review.intake._read(target, review.MAX_RESPONSE_BYTES)


if __name__ == '__main__':
    unittest.main()
