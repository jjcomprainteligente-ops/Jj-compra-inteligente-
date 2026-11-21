"""Meaningful boundaries for the pinned V3 data importer and generated outputs."""
from copy import deepcopy
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'scripts'))
spec = importlib.util.spec_from_file_location('jj_v3_projection_tests', ROOT/'scripts/import-recipes-v3.py')
assert spec and spec.loader
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


class ProjectionBoundaries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        profile = importer.intake.load_profile('app10mb')
        cls.raw, cls.photos = importer.intake._data(profile, importer.SOURCE, importer.intake._Budget())
        cls.recipe_entry = profile.recipe_entry
        cls.source = importer.validated_source()

    def test_complete_projection_and_historical_compatibility_are_reproducible(self):
        active, messages, metadata = importer.projection(self.source)
        self.assertEqual(len(active), 150)
        self.assertEqual(len(metadata), 150)
        self.assertEqual(set(messages), {'es','en','de','fr'})
        importer.require_historical_compatibility(active, messages, metadata)
        self.assertEqual(importer.rendered_files(self.source), importer.rendered_files(self.source))

    def test_changed_historical_quantity_is_rejected_before_generation(self):
        active, messages, metadata = importer.projection(self.source)
        changed = deepcopy(active)
        changed[0]['ingredients'][0]['quantityMilli'] += 1
        with self.assertRaises(ValueError):
            importer.require_historical_compatibility(changed, messages, metadata)

    def test_incomplete_or_non_boolean_publication_approval_is_rejected(self):
        for field, value in [('can_publish_recipe_text', False), ('can_publish_recipe_text', 1),
                             ('can_publish_photo', False), ('can_publish_photo', None),
                             ('can_claim_allergen_safe', True), ('can_publish_real_price', True)]:
            with self.subTest(field=field,value=value):
                raw = dict(self.raw)
                rows = json.loads(raw[self.recipe_entry])
                rows[0][field] = value
                raw[self.recipe_entry] = json.dumps(rows).encode()
                with patch.object(importer.intake, '_data', return_value=(raw,self.photos)):
                    with self.assertRaises(ValueError):
                        importer.validated_source()

    def test_altered_zip_is_rejected_without_constructing_an_archive(self):
        profile = importer.intake.load_profile('app10mb')
        original = (importer.SOURCE/profile.data_package.name).read_bytes()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/profile.data_package.name
            path.write_bytes(original[:-1]+bytes([original[-1]^1]))
            with patch.object(importer.intake.zipfile, 'ZipFile', side_effect=AssertionError('Unexpected untrusted decode')):
                with self.assertRaises(ValueError):
                    importer.validated_source(Path(directory))

    def test_unexpected_output_path_is_rejected_without_overwriting_it(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'other.ts'
            path.write_bytes(b'original')
            with self.assertRaises(ValueError):
                importer.write_generated(path,b'changed')
            self.assertEqual(path.read_bytes(),b'original')

    def test_existing_output_symlink_is_rejected_without_touching_its_target(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'generated.ts'
            target = Path(directory)/'owner.ts'
            target.write_bytes(b'owner-original')
            path.symlink_to(target)
            with patch.object(importer,'DATA_OUTPUT',path):
                with self.assertRaises(ValueError):
                    importer.write_generated(path,b'changed')
            self.assertEqual(target.read_bytes(),b'owner-original')
            self.assertTrue(path.is_symlink())

    def test_existing_non_regular_output_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'generated.ts'
            os.mkfifo(path)
            with patch.object(importer,'DATA_OUTPUT',path):
                with self.assertRaises(ValueError):
                    importer.write_generated(path,b'changed')
            self.assertTrue(path.exists())

    def test_exclusive_temporary_collision_preserves_unowned_file(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'generated.ts'
            temporary = Path(directory)/'.generated.ts.v3-collision'
            temporary.write_bytes(b'unowned')
            with patch.object(importer,'DATA_OUTPUT',path), patch.object(importer.secrets,'token_hex',return_value='collision'):
                with self.assertRaises(FileExistsError):
                    importer.write_generated(path,b'changed')
            self.assertEqual(temporary.read_bytes(),b'unowned')
            self.assertFalse(path.exists())

    def test_failed_atomic_publication_keeps_previous_output_and_removes_owned_temporary(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'generated.ts'
            path.write_bytes(b'previous')
            with patch.object(importer,'DATA_OUTPUT',path), patch.object(importer.os,'replace',side_effect=PermissionError):
                with self.assertRaises(PermissionError):
                    importer.write_generated(path,b'changed')
            self.assertEqual(path.read_bytes(),b'previous')
            self.assertEqual([p.name for p in Path(directory).iterdir()],['generated.ts'])


if __name__ == '__main__':
    unittest.main()
