"""Offline V3 intake security regressions. Every image is a temporary fixture."""
import contextlib
import dataclasses
import hashlib
import io
import json
import os
from pathlib import Path
import stat
import struct
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import warnings
import zipfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
import recetas_v3_intake as intake


def image_bytes(kind='JPEG', size=(1536, 1024), color=(24, 80, 45)):
    output = io.BytesIO()
    with Image.new('RGB', size, color) as image:
        image.save(output, format=kind)
    return output.getvalue()


def archive_bytes(entries, compression=zipfile.ZIP_DEFLATED):
    output = io.BytesIO()
    with warnings.catch_warnings():
        warnings.simplefilter('ignore', UserWarning)
        with zipfile.ZipFile(output, 'w', compression=compression) as archive:
            for name, payload in entries:
                archive.writestr(name, payload)
    return output.getvalue()


def json_bytes(value):
    return json.dumps(value, ensure_ascii=False, allow_nan=False).encode('utf-8')


def snapshot(folder):
    return {str(path.relative_to(folder)): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in folder.rglob('*') if path.is_file() and not path.is_symlink()}


def forged_expanded_size(payload, size):
    """Alter declared expansion only; the tested gate must reject before opening."""
    result = bytearray(payload)
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        cursor = archive.start_dir
        infos = archive.infolist()
    for info in infos:
        struct.pack_into('<I', result, info.header_offset + 22, size)
        struct.pack_into('<I', result, cursor + 24, size)
        name, extra, comment = struct.unpack_from('<HHH', result, cursor + 28)
        cursor += 46 + name + extra + comment
    return bytes(result)


class DeliveryFixture:
    def __init__(self, folder):
        self.root = folder
        self.incoming = folder / 'incoming'
        self.loose = folder / 'loose'
        self.incoming.mkdir()
        self.loose.mkdir()
        self.ids = ['JJ-R001', 'JJ-E04-054']
        self.extensions = {self.ids[0]: '.jpg', self.ids[1]: '.png'}
        self.images = {
            self.ids[0]: image_bytes(),
            self.ids[1]: image_bytes('PNG', color=(160, 70, 15)),
        }
        self.recipes = []
        self.photos = []
        self.recipe_entry = 'datos/recipes.json'
        self.photo_entry = 'datos/photos.json'
        self.refresh_records()
        self.profile = None
        self.build()

    def refresh_records(self):
        self.recipes = []
        self.photos = []
        for position, rid in enumerate(self.ids, 1):
            data = self.images[rid]
            photo_path = 'fotos/' + rid + self.extensions[rid]
            sha = hashlib.sha256(data).hexdigest()
            self.photos.append({
                'recipe_id': rid, 'photo_archive_path': photo_path,
                'sha256': sha, 'bytes': len(data), 'width_px': 1536, 'height_px': 1024,
            })
            self.recipes.append({
                'recipe_id': rid, 'position': position, 'title_es': 'Receta sintética',
                'localized': {language: {
                    'recipe_id': rid, 'language': language, 'title': 'Temporary fixture',
                    'ingredients': [{'line': 1, 'name': 'Tomate', 'quantity': 100, 'unit': 'g'}],
                    'steps': ['Preparar los ingredientes de prueba.'],
                } for language in ['es', 'en', 'de', 'fr', 'bg']},
                'photo': {'photo_path': photo_path, 'sha256': sha},
                'can_publish_recipe_text': True, 'can_publish_photo': True,
                'can_claim_allergen_safe': False, 'can_publish_real_price': False,
            })

    def package(self, name, payload, image_count=None):
        (self.incoming / name).write_bytes(payload)
        return intake.Package(name, len(payload), hashlib.sha256(payload).hexdigest(), image_count)

    def build(self, *, data_entries=None, photo_entries=None, raw_recipes=None):
        self.raw_recipes = json_bytes(self.recipes) if raw_recipes is None else raw_recipes
        self.raw_photos = json_bytes(self.photos)
        if data_entries is None:
            data_entries = [(self.recipe_entry, self.raw_recipes), (self.photo_entry, self.raw_photos)]
        if photo_entries is None:
            photo_entries = [('fotos/' + rid + self.extensions[rid], self.images[rid]) for rid in self.ids]
        data_package = self.package('data.zip', archive_bytes(data_entries))
        photo_package = self.package('photos.zip', archive_bytes(photo_entries), len(self.ids))
        self.profile = intake.Profile('original', data_package, (photo_package,),
                                      self.recipe_entry, self.photo_entry, len(self.ids))
        for path in self.loose.iterdir():
            if path.is_file() or path.is_symlink():
                path.unlink()
        for rid in self.ids:
            (self.loose / (rid + self.extensions[rid])).write_bytes(self.images[rid])
        return self.profile

    def replace_data_archive(self, payload):
        self.profile = dataclasses.replace(self.profile, data_package=self.package('data.zip', payload))

    def replace_photo_archive(self, payload):
        package = self.package('photos.zip', payload, len(self.ids))
        self.profile = dataclasses.replace(self.profile, photo_packages=(package,))

    def verify(self, **kwargs):
        return intake.verify_delivery(self.profile, self.incoming, **kwargs)


class V3IntakeTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix='jj-v3-security-test-')
        self.addCleanup(temporary.cleanup)
        self.folder = Path(temporary.name)
        self.fixture = DeliveryFixture(self.folder)

    def rejected(self, function):
        with self.assertRaises(intake.IntakeError):
            function()

    def test_all_four_production_profiles_keep_150_and_distinct_package_contracts(self):
        profiles = [intake.load_profile(name) for name in ['original', 'github16', 'v3b', 'app10mb']]
        self.assertEqual([profile.expected_count for profile in profiles], [150] * 4)
        self.assertEqual([len(profile.photo_packages) for profile in profiles], [5, 16, 10, 10])
        self.assertEqual(len({profile.data_package.sha256 for profile in profiles}), 3)
        self.assertNotEqual(profiles[0].data_package.sha256, profiles[2].data_package.sha256)
        self.assertNotEqual(profiles[2].data_package.sha256, profiles[3].data_package.sha256)
        self.assertNotEqual(profiles[0].recipe_entry, profiles[2].recipe_entry)

    def test_valid_horizontal_jpeg_and_png_are_verified_without_writes(self):
        before = snapshot(self.folder)
        result = self.fixture.verify()
        self.assertTrue(result['complete'])
        self.assertEqual(result['recipes'], 2)
        self.assertEqual(result['localized_records'], 10)
        self.assertEqual(result['received_photos'], 2)
        self.assertEqual(result['missing_photo_ids'], [])
        self.assertEqual(set(result['verified_photo_ids']), set(self.fixture.ids))
        self.assertEqual(snapshot(self.folder), before)

    def test_loose_mode_uses_the_pinned_data_and_does_not_need_archive_parts(self):
        (self.fixture.incoming / 'photos.zip').unlink()
        result = self.fixture.verify(photos_dir=self.fixture.loose)
        self.assertTrue(result['complete'])
        self.assertEqual(result['received_photos'], 2)

    def test_partial_loose_audit_counts_missing_without_claiming_complete(self):
        (self.fixture.loose / (self.fixture.ids[1] + '.png')).unlink()
        before = snapshot(self.folder)
        result = self.fixture.verify(photos_dir=self.fixture.loose, audit_available=True)
        self.assertFalse(result['complete'])
        self.assertEqual(result['received_photos'], 1)
        self.assertEqual(result['missing_photo_ids'], [self.fixture.ids[1]])
        self.assertEqual(snapshot(self.folder), before)
        self.rejected(lambda: self.fixture.verify(photos_dir=self.fixture.loose))
        output = self.folder / 'must-not-exist'
        self.rejected(lambda: intake.prepare_staging(self.fixture.profile, self.fixture.incoming,
                                                    output, photos_dir=self.fixture.loose))
        self.assertFalse(output.exists())

    def test_partial_archive_audit_never_fabricates_missing_photos(self):
        (self.fixture.incoming / 'photos.zip').unlink()
        result = self.fixture.verify(audit_available=True)
        self.assertFalse(result['complete'])
        self.assertEqual(result['received_photos'], 0)
        self.assertEqual(set(result['missing_photo_ids']), set(self.fixture.ids))
        self.rejected(self.fixture.verify)

    def test_pinned_data_size_and_hash_reject_tampering_before_zip_read(self):
        for kind in ['size', 'sha256']:
            with self.subTest(kind=kind):
                self.fixture.build()
                package = self.fixture.profile.data_package
                altered = dataclasses.replace(package, **{kind: package.size + 1 if kind == 'size' else '0' * 64})
                self.fixture.profile = dataclasses.replace(self.fixture.profile, data_package=altered)
                with patch.object(zipfile.ZipFile, 'open', side_effect=AssertionError('Untrusted ZIP opened')):
                    self.rejected(self.fixture.verify)

    def test_different_delivery_data_is_not_accepted_as_another_profile(self):
        original = self.fixture.profile
        self.fixture.recipes[0]['localized']['es']['title'] = 'Changed source package'
        self.fixture.build()
        self.fixture.profile = original
        self.rejected(lambda: self.fixture.verify(photos_dir=self.fixture.loose))

    def test_corrupt_zip_container_is_a_controlled_error(self):
        self.fixture.replace_data_archive(b'not a ZIP')
        self.rejected(self.fixture.verify)

    def test_false_eocd_entry_counts_are_rejected_before_zipfile_construction(self):
        original = (self.fixture.incoming / 'data.zip').read_bytes()
        for declared in [1, 3, 0xffff]:
            with self.subTest(declared=declared):
                payload = bytearray(original)
                eocd = payload.rfind(b'PK\x05\x06')
                self.assertGreaterEqual(eocd, 0)
                struct.pack_into('<H', payload, eocd + 8, declared)
                struct.pack_into('<H', payload, eocd + 10, declared)
                self.fixture.replace_data_archive(bytes(payload))
                with patch.object(zipfile, 'ZipFile', side_effect=AssertionError('Unbounded ZIP constructor')):
                    self.rejected(self.fixture.verify)

    def test_directory_entry_count_cap_precedes_zipfile_construction(self):
        with patch.object(intake, 'MAX_ENTRIES', 1), \
                patch.object(zipfile, 'ZipFile', side_effect=AssertionError('Too many ZIP objects allocated')):
            self.rejected(self.fixture.verify)

    def test_overlong_central_directory_name_is_rejected_before_construction(self):
        self.fixture.build(data_entries=[(self.fixture.recipe_entry, self.fixture.raw_recipes),
                                         (self.fixture.photo_entry, self.fixture.raw_photos),
                                         ('x' * 501 + '.txt', b'x')])
        with patch.object(zipfile, 'ZipFile', side_effect=AssertionError('Overlong ZIP name allocated')):
            self.rejected(self.fixture.verify)

    def test_self_extracting_prefix_is_not_accepted_as_a_data_archive(self):
        original = (self.fixture.incoming / 'data.zip').read_bytes()
        self.fixture.replace_data_archive(b'not-an-allowed-archive-prefix' + original)
        with patch.object(zipfile, 'ZipFile', side_effect=AssertionError('Prefixed ZIP allocated')):
            self.rejected(self.fixture.verify)

    def test_duplicate_zip_entry_is_rejected(self):
        self.fixture.build(data_entries=[(self.fixture.recipe_entry, self.fixture.raw_recipes),
                                         (self.fixture.recipe_entry, self.fixture.raw_recipes),
                                         (self.fixture.photo_entry, self.fixture.raw_photos)])
        self.rejected(self.fixture.verify)

    def test_raw_nul_zip_name_is_rejected_before_truncation_can_hide_it(self):
        # ZipInfo truncates a name supplied to its constructor at NUL. Patch the
        # raw local and central names instead, keeping lengths/offsets intact.
        original_name = b'ignored.txt.payload'
        raw_name = b'ignored.txt\x00payload'
        self.fixture.build(data_entries=[(self.fixture.recipe_entry, self.fixture.raw_recipes),
                                         (self.fixture.photo_entry, self.fixture.raw_photos),
                                         (original_name.decode(), b'noncatalogue fixture')])
        payload = (self.fixture.incoming / 'data.zip').read_bytes()
        self.assertEqual(len(original_name), len(raw_name))
        self.assertEqual(payload.count(original_name), 2)
        payload = payload.replace(original_name, raw_name)
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            entry = next(info for info in archive.infolist() if '\x00' in info.orig_filename)
            self.assertEqual(entry.orig_filename, raw_name.decode())
            self.assertEqual(entry.filename, 'ignored.txt')
        self.fixture.replace_data_archive(payload)
        with patch.object(zipfile.ZipFile, 'open', side_effect=AssertionError('NUL member must not be read')):
            self.rejected(self.fixture.verify)

    def test_dangerous_archive_paths_are_rejected_even_for_unread_extra_entries(self):
        for name in ['../escape.txt', '/absolute.txt', 'folder/../../escape.txt',
                     'folder\\escape.txt', 'C:/escape.txt']:
            with self.subTest(name=name):
                self.fixture.build(data_entries=[(self.fixture.recipe_entry, self.fixture.raw_recipes),
                                                 (self.fixture.photo_entry, self.fixture.raw_photos), (name, b'x')])
                self.rejected(self.fixture.verify)
        self.assertFalse((self.folder / 'escape.txt').exists())

    def test_archive_symlinks_are_rejected(self):
        info = zipfile.ZipInfo('pointer.txt')
        info.create_system = 3
        info.external_attr = (stat.S_IFLNK | 0o777) << 16
        self.fixture.build(data_entries=[(self.fixture.recipe_entry, self.fixture.raw_recipes),
                                         (self.fixture.photo_entry, self.fixture.raw_photos), (info, b'../outside')])
        self.rejected(self.fixture.verify)

    def test_encrypted_flag_is_rejected_before_reading_members(self):
        payload = bytearray((self.fixture.incoming / 'data.zip').read_bytes())
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            central = archive.start_dir
        struct.pack_into('<H', payload, 6, struct.unpack_from('<H', payload, 6)[0] | 1)
        struct.pack_into('<H', payload, central + 8, struct.unpack_from('<H', payload, central + 8)[0] | 1)
        self.fixture.replace_data_archive(bytes(payload))
        with patch.object(zipfile.ZipFile, 'open', side_effect=AssertionError('Encrypted member opened')):
            self.rejected(self.fixture.verify)

    def test_member_expansion_is_bounded_before_decompression(self):
        self.fixture.replace_data_archive(forged_expanded_size(
            (self.fixture.incoming / 'data.zip').read_bytes(), 33 * 1024 * 1024))
        with patch.object(zipfile.ZipFile, 'open', side_effect=AssertionError('Oversize member opened')):
            self.rejected(self.fixture.verify)

    def test_total_data_expansion_is_bounded_before_decompression(self):
        entries = [(self.fixture.recipe_entry, self.fixture.raw_recipes),
                   (self.fixture.photo_entry, self.fixture.raw_photos)]
        entries.extend((f'extra-{index}.bin', b'x' * 2048) for index in range(34))
        payload = archive_bytes(entries, compression=zipfile.ZIP_STORED)
        self.fixture.replace_data_archive(forged_expanded_size(payload, 2 * 1024 * 1024))
        with patch.object(zipfile.ZipFile, 'open', side_effect=AssertionError('Expanded archive opened')):
            self.rejected(self.fixture.verify)

    def test_aggregate_expansion_and_entry_limits_apply_across_archives(self):
        with zipfile.ZipFile(self.fixture.incoming / 'data.zip') as archive:
            data_expanded = sum(info.file_size for info in archive.infolist())
        image_expanded = sum(len(image) for image in self.fixture.images.values())
        real_open = zipfile.ZipFile.open

        def no_photo_open(archive, member, *args, **kwargs):
            name = member.filename if isinstance(member, zipfile.ZipInfo) else member
            if name.startswith('fotos/'):
                raise AssertionError('A rejected photo archive must not be decompressed')
            return real_open(archive, member, *args, **kwargs)

        with patch.object(intake, 'MAX_TOTAL_EXPANDED', data_expanded + image_expanded - 1), \
                patch.object(zipfile.ZipFile, 'open', no_photo_open):
            self.rejected(self.fixture.verify)
        # Each archive has two entries; the combined four still exceed this cap.
        with patch.object(intake, 'MAX_ENTRIES', 3), patch.object(zipfile.ZipFile, 'open', no_photo_open):
            self.rejected(self.fixture.verify)

    def test_compression_ratio_cap_precedes_member_reads(self):
        with patch.object(intake, 'MAX_RATIO', 1), \
                patch.object(zipfile.ZipFile, 'open', side_effect=AssertionError('Ratio cap too late')):
            self.rejected(self.fixture.verify)

    def test_json_payload_cap_is_enforced(self):
        with patch.object(intake, 'MAX_JSON_BYTES', len(self.fixture.raw_recipes) - 1):
            self.rejected(self.fixture.verify)

    def test_duplicate_json_keys_are_rejected(self):
        raw = self.fixture.raw_recipes.replace(b'"recipe_id": "JJ-R001"',
                                               b'"recipe_id": "JJ-R001", "recipe_id": "JJ-R001"', 1)
        self.fixture.build(raw_recipes=raw)
        self.rejected(self.fixture.verify)

    def test_nonfinite_json_is_rejected(self):
        raw = self.fixture.raw_recipes.replace(b'"position": 1', b'"position": NaN', 1)
        self.fixture.build(raw_recipes=raw)
        self.rejected(self.fixture.verify)

    def test_unsafe_json_object_keys_are_rejected(self):
        self.fixture.recipes[0]['__proto__'] = {'polluted': True}
        self.fixture.build()
        self.rejected(self.fixture.verify)

    def test_unsafe_recipe_ids_cannot_escape_staging(self):
        for rid in ['../outside', '/absolute', 'JJ-../outside', 'JJ-X\\outside', 'JJ-X/../../outside']:
            with self.subTest(rid=rid):
                self.fixture.refresh_records()
                self.fixture.recipes[0]['recipe_id'] = rid
                for row in self.fixture.recipes[0]['localized'].values():
                    row['recipe_id'] = rid
                self.fixture.build()
                self.rejected(self.fixture.verify)

    def test_duplicate_recipe_ids_and_unknown_photo_ids_are_rejected(self):
        self.fixture.recipes[1]['recipe_id'] = self.fixture.ids[0]
        self.fixture.build()
        self.rejected(self.fixture.verify)
        self.fixture.refresh_records()
        self.fixture.photos[1]['recipe_id'] = 'JJ-UNKNOWN'
        self.fixture.build()
        self.rejected(self.fixture.verify)

    def test_localized_ids_languages_and_nonempty_culinary_content_are_required(self):
        mutations = [lambda row: row['localized'].pop('bg'),
                     lambda row: row['localized']['de'].update(recipe_id='JJ-UNKNOWN'),
                     lambda row: row['localized']['fr'].update(language='es'),
                     lambda row: row['localized']['en'].update(ingredients=[]),
                     lambda row: row['localized']['es'].update(steps=[])]
        for mutate in mutations:
            with self.subTest(mutation=mutate.__code__.co_firstlineno):
                self.fixture.refresh_records()
                mutate(self.fixture.recipes[0])
                self.fixture.build()
                self.rejected(self.fixture.verify)

    def test_each_ingredient_requires_a_valid_source_structure(self):
        baseline = {'line': 1, 'name': 'Tomate', 'quantity': 100, 'unit': 'g'}
        invalid = [None, 123, 'Tomate', {},
                   {**baseline, 'line': True}, {**baseline, 'line': 0},
                   {**baseline, 'name': ''}, {**baseline, 'name': '  '},
                   {**baseline, 'quantity': []}, {**baseline, 'quantity': {}},
                   {**baseline, 'quantity': True}, {**baseline, 'quantity': -1},
                   {**baseline, 'quantity': None},
                   {**baseline, 'unit': []}, {**baseline, 'unit': 2},
                   {**baseline, 'unit': '  '}, {**baseline, 'unit': None}]
        for ingredient in invalid:
            with self.subTest(ingredient=ingredient):
                self.fixture.refresh_records()
                self.fixture.recipes[0]['localized']['es']['ingredients'] = [ingredient]
                self.fixture.build()
                self.rejected(self.fixture.verify)

    def test_each_step_is_nonempty_text_not_just_a_truthy_list(self):
        for step in [None, 123, {}, [], '', '  \n  ']:
            with self.subTest(step=step):
                self.fixture.refresh_records()
                self.fixture.recipes[0]['localized']['es']['steps'] = [step]
                self.fixture.build()
                self.rejected(self.fixture.verify)

    def test_unmeasured_ingredient_stays_null_without_inventing_quantity_or_unit(self):
        ingredient = self.fixture.recipes[0]['localized']['es']['ingredients'][0]
        ingredient.update(name='Sal al gusto', quantity=None, unit=None)
        self.fixture.build()
        output = self.folder / 'unmeasured-staging'
        intake.prepare_staging(self.fixture.profile, self.fixture.incoming, output)
        saved = json.loads((output / 'recetas_v3.json').read_text())
        self.assertIsNone(saved[0]['localized']['es']['ingredients'][0]['quantity'])
        self.assertIsNone(saved[0]['localized']['es']['ingredients'][0]['unit'])

    def test_fractional_source_quantity_is_preserved_without_coercion(self):
        self.fixture.recipes[0]['localized']['es']['ingredients'][0]['quantity'] = 1.25
        self.fixture.build()
        output = self.folder / 'fractional-staging'
        intake.prepare_staging(self.fixture.profile, self.fixture.incoming, output)
        saved = json.loads((output / 'recetas_v3.json').read_text())
        self.assertEqual(saved[0]['localized']['es']['ingredients'][0]['quantity'], 1.25)

    def test_source_must_not_claim_allergen_safety_or_verified_prices(self):
        for key in ['can_claim_allergen_safe', 'can_publish_real_price']:
            with self.subTest(key=key):
                self.fixture.refresh_records()
                self.fixture.recipes[0][key] = True
                self.fixture.build()
                self.rejected(self.fixture.verify)

    def test_recipe_photo_reference_must_match_the_manifest(self):
        for key, value in [('photo_path', 'fotos/JJ-UNKNOWN.jpg'), ('sha256', '0' * 64)]:
            with self.subTest(key=key):
                self.fixture.refresh_records()
                self.fixture.recipes[0]['photo'][key] = value
                self.fixture.build()
                self.rejected(self.fixture.verify)

    def test_photo_manifest_paths_and_hashes_must_be_unique(self):
        self.fixture.photos[1]['photo_archive_path'] = self.fixture.photos[0]['photo_archive_path']
        self.fixture.build()
        self.rejected(self.fixture.verify)
        self.fixture.extensions[self.fixture.ids[1]] = '.jpg'
        self.fixture.images[self.fixture.ids[1]] = self.fixture.images[self.fixture.ids[0]]
        self.fixture.refresh_records()
        self.fixture.build()
        self.rejected(self.fixture.verify)

    def test_photo_bytes_must_match_the_declared_hash(self):
        photo_entries = [('fotos/' + rid + self.fixture.extensions[rid],
                          data + b'x' if index == 0 else data)
                         for index, (rid, data) in enumerate(self.fixture.images.items())]
        self.fixture.build(photo_entries=photo_entries)
        self.rejected(self.fixture.verify)

    def test_actual_image_dimensions_must_match_the_manifest(self):
        self.fixture.photos[0]['height_px'] = 1025
        self.fixture.build()
        self.rejected(self.fixture.verify)

    def test_declared_dimensions_reject_overlarge_or_undersized_images(self):
        for width, height in [(1535, 1024), (1536, 1023), (12000, 12000)]:
            with self.subTest(width=width, height=height):
                self.fixture.refresh_records()
                self.fixture.photos[0].update(width_px=width, height_px=height)
                self.fixture.build()
                self.rejected(self.fixture.verify)

    def test_corrupt_and_truncated_png_are_rejected_after_matching_hash(self):
        original = self.fixture.images[self.fixture.ids[1]]
        damaged = bytearray(original)
        damaged[-1] ^= 1
        for payload in [bytes(damaged), original[:-10]]:
            with self.subTest(bytes=len(payload)):
                self.fixture.images[self.fixture.ids[1]] = payload
                self.fixture.refresh_records()
                self.fixture.build()
                self.rejected(self.fixture.verify)

    def test_truncated_jpeg_is_rejected_after_matching_hash(self):
        rid = self.fixture.ids[0]
        self.fixture.images[rid] = self.fixture.images[rid][:-2]
        self.fixture.refresh_records()
        self.fixture.build()
        self.rejected(self.fixture.verify)

    def test_mime_must_match_the_filename_extension(self):
        self.fixture.images[self.fixture.ids[1]] = image_bytes('JPEG', color=(100, 50, 10))
        self.fixture.refresh_records()
        self.fixture.build()
        self.rejected(self.fixture.verify)

    def test_unknown_loose_image_is_not_silently_counted_or_ignored(self):
        (self.fixture.loose / 'JJ-UNKNOWN.png').write_bytes(image_bytes('PNG'))
        self.rejected(lambda: self.fixture.verify(photos_dir=self.fixture.loose))

    def test_input_archive_and_parent_symlinks_are_rejected(self):
        source = self.fixture.incoming / 'data.zip'
        saved = self.folder / 'saved-data.zip'
        source.rename(saved)
        source.symlink_to(saved)
        self.rejected(self.fixture.verify)
        source.unlink()
        source.write_bytes(saved.read_bytes())
        linked = self.folder / 'linked-input'
        linked.symlink_to(self.fixture.incoming, target_is_directory=True)
        self.rejected(lambda: intake.verify_delivery(self.fixture.profile, linked))

    def test_loose_photo_and_parent_symlinks_are_rejected(self):
        source = self.fixture.loose / (self.fixture.ids[0] + '.jpg')
        saved = self.folder / 'saved-image.jpg'
        source.rename(saved)
        source.symlink_to(saved)
        self.rejected(lambda: self.fixture.verify(photos_dir=self.fixture.loose))
        source.unlink()
        source.write_bytes(saved.read_bytes())
        linked = self.folder / 'linked-photos'
        linked.symlink_to(self.fixture.loose, target_is_directory=True)
        self.rejected(lambda: self.fixture.verify(photos_dir=linked))

    @unittest.skipUnless(hasattr(os, 'mkfifo'), 'POSIX FIFO contract')
    def test_fifo_input_is_rejected_without_blocking(self):
        source = self.fixture.incoming / 'data.zip'
        source.unlink()
        os.mkfifo(source)
        profile = dataclasses.asdict(self.fixture.profile)
        code = '''import json,sys
from pathlib import Path
sys.path.insert(0, sys.argv[1])
from recetas_v3_intake import Package, Profile, verify_delivery, IntakeError
d=json.loads(sys.argv[2]);d['data_package']=Package(**d['data_package']);d['photo_packages']=tuple(Package(**p) for p in d['photo_packages']);profile=Profile(**d)
try: verify_delivery(profile, Path(sys.argv[3]))
except IntakeError: raise SystemExit(0)
raise SystemExit(1)
'''
        result = subprocess.run([sys.executable, '-B', '-c', code, str(ROOT / 'scripts'),
                                 json.dumps(profile), str(self.fixture.incoming)],
                                capture_output=True, timeout=3)
        self.assertEqual(result.returncode, 0, result.stderr.decode())

    def test_staging_only_writes_verified_bytes_and_preserves_sources(self):
        before = snapshot(self.fixture.incoming)
        output = self.folder / 'new-staging'
        result = intake.prepare_staging(self.fixture.profile, self.fixture.incoming, output)
        self.assertTrue(result['complete'])
        self.assertEqual(snapshot(self.fixture.incoming), before)
        for row in self.fixture.photos:
            self.assertEqual((output / row['photo_archive_path']).read_bytes(),
                             self.fixture.images[row['recipe_id']])
        self.assertEqual(json.loads((output / 'recetas_v3.json').read_text()), self.fixture.recipes)
        self.assertEqual(json.loads((output / 'manifest_fotos_v3.json').read_text()), self.fixture.photos)

    def test_existing_staging_is_never_replaced(self):
        output = self.folder / 'saved-staging'
        output.mkdir()
        (output / 'owner-data.txt').write_bytes(b'Preserve these exact bytes')
        before = snapshot(output)
        self.rejected(lambda: intake.prepare_staging(self.fixture.profile, self.fixture.incoming, output))
        self.assertEqual(snapshot(output), before)

    def test_staging_cannot_follow_a_parent_symlink(self):
        outside = self.folder / 'outside'
        outside.mkdir()
        link = self.folder / 'link'
        link.symlink_to(outside, target_is_directory=True)
        self.rejected(lambda: intake.prepare_staging(self.fixture.profile, self.fixture.incoming, link / 'new'))
        self.assertEqual(list(outside.iterdir()), [])

    def test_staging_cannot_write_into_a_source_folder_or_app_tree(self):
        before = snapshot(self.fixture.incoming)
        self.rejected(lambda: intake.prepare_staging(self.fixture.profile, self.fixture.incoming,
                                                    self.fixture.incoming / 'new-staging'))
        with patch.object(intake, '_parent_fd', side_effect=AssertionError('App destination opened')):
            self.rejected(lambda: intake.prepare_staging(self.fixture.profile, self.fixture.incoming,
                                                        ROOT / 'src' / 'v3-not-an-output'))
        self.assertEqual(snapshot(self.fixture.incoming), before)

    def test_write_failure_retains_incomplete_marker_without_success_state(self):
        output = self.folder / 'interrupted-staging'
        original_write = intake._write
        before = snapshot(self.fixture.incoming)

        def fail_image(fd, name, payload):
            if name.endswith('.jpg'):
                raise OSError('Synthetic disk failure')
            return original_write(fd, name, payload)

        with patch.object(intake, '_write', side_effect=fail_image):
            self.rejected(lambda: intake.prepare_staging(self.fixture.profile, self.fixture.incoming, output))
        self.assertTrue((output / 'INCOMPLETO').is_file())
        self.assertFalse((output / 'ESTADO.txt').exists())
        self.assertFalse((output / 'VERIFICACION.json').exists())
        self.assertEqual(snapshot(self.fixture.incoming), before)

    def test_failed_marker_removal_never_writes_success_state(self):
        output = self.folder / 'marker-removal-failure'
        original_unlink = os.unlink

        def fail_marker(name, *args, **kwargs):
            if name == 'INCOMPLETO':
                raise OSError('Synthetic checkpoint failure')
            return original_unlink(name, *args, **kwargs)

        with patch.object(intake.os, 'unlink', side_effect=fail_marker):
            self.rejected(lambda: intake.prepare_staging(self.fixture.profile, self.fixture.incoming, output))
        self.assertTrue((output / 'INCOMPLETO').is_file())
        self.assertFalse((output / 'ESTADO.txt').exists())

    def test_failed_final_status_preparation_keeps_incomplete_marker(self):
        output = self.folder / 'final-status-failure'
        original_write = intake._write

        def fail_status(fd, name, payload):
            if name == '.ESTADO_PREPARADO':
                raise OSError('Synthetic final status failure')
            return original_write(fd, name, payload)

        with patch.object(intake, '_write', side_effect=fail_status):
            self.rejected(lambda: intake.prepare_staging(self.fixture.profile, self.fixture.incoming, output))
        self.assertTrue((output / 'INCOMPLETO').is_file())
        self.assertFalse((output / 'ESTADO.txt').exists())

    def test_failed_atomic_final_publication_does_not_claim_complete(self):
        output = self.folder / 'final-publication-failure'
        with patch.object(intake.os, 'link', side_effect=OSError('Synthetic link failure')):
            self.rejected(lambda: intake.prepare_staging(self.fixture.profile, self.fixture.incoming, output))
        self.assertTrue((output / 'INCOMPLETO').is_file())
        self.assertFalse((output / 'ESTADO.txt').exists())

    def test_a_source_change_between_verification_and_copy_fails_closed(self):
        output = self.folder / 'changed-source-staging'
        original_verify = intake.verify_delivery

        def verify_then_change(*args, **kwargs):
            report = original_verify(*args, **kwargs)
            source = self.fixture.incoming / 'photos.zip'
            source.write_bytes(source.read_bytes() + b'concurrent change')
            return report

        with patch.object(intake, 'verify_delivery', side_effect=verify_then_change):
            self.rejected(lambda: intake.prepare_staging(self.fixture.profile, self.fixture.incoming, output))
        self.assertTrue((output / 'INCOMPLETO').is_file())
        self.assertFalse((output / 'ESTADO.txt').exists())

    def call_cli(self, *arguments, profile_name=None):
        stdout, stderr = io.StringIO(), io.StringIO()
        with patch.object(sys, 'argv', ['verificar_recetas_v3.py', '--input-dir',
                                       str(self.fixture.incoming), *map(str, arguments)]), \
                patch.object(intake, 'load_profile', return_value=self.fixture.profile), \
                contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            code = intake.main(profile_name)
        return code, stdout.getvalue(), stderr.getvalue()

    def test_cli_partial_audit_exits_two_and_writes_only_an_explicit_new_report(self):
        (self.fixture.loose / (self.fixture.ids[1] + '.png')).unlink()
        report_file = self.folder / 'partial-receipt.json'
        before = snapshot(self.fixture.incoming)
        code, stdout, stderr = self.call_cli('--audit-available', '--photos-dir', self.fixture.loose,
                                            '--report-file', report_file)
        self.assertEqual(code, 2)
        self.assertEqual(stderr, '')
        self.assertFalse(json.loads(stdout)['complete'])
        self.assertFalse(json.loads(report_file.read_text())['complete'])
        self.assertEqual(snapshot(self.fixture.incoming), before)

    def test_cli_full_verification_of_missing_photos_is_blocked(self):
        (self.fixture.loose / (self.fixture.ids[1] + '.png')).unlink()
        code, stdout, stderr = self.call_cli('--verify-only', '--photos-dir', self.fixture.loose)
        self.assertEqual(code, 1)
        self.assertEqual(stdout, '')
        self.assertIn('BLOQUEADO', stderr)

    def test_cli_report_never_overwrites_existing_bytes_or_sources(self):
        receipt = self.folder / 'owner-receipt.json'
        receipt.write_bytes(b'Previously saved owner bytes')
        before = snapshot(self.folder)
        code, _, _ = self.call_cli('--verify-only', '--report-file', receipt)
        self.assertEqual(code, 1)
        self.assertEqual(snapshot(self.folder), before)
        code, _, _ = self.call_cli('--verify-only', '--report-file', self.fixture.incoming / 'data.zip')
        self.assertEqual(code, 1)
        self.assertEqual(snapshot(self.folder), before)

    def test_cli_verify_only_ignores_output_that_would_be_forbidden_to_write(self):
        before = snapshot(self.folder)
        code, stdout, stderr = self.call_cli('--verify-only', '--output-dir', self.fixture.incoming)
        self.assertEqual(code, 0)
        self.assertTrue(json.loads(stdout)['complete'])
        self.assertEqual(stderr, '')
        self.assertEqual(snapshot(self.folder), before)

    def test_profile_specific_cli_cannot_silently_choose_another_profile(self):
        with patch.object(sys, 'argv', ['wrapper.py', '--input-dir', str(self.fixture.incoming),
                                       '--profile', 'app10mb', '--verify-only']), \
                patch.object(intake, 'load_profile') as loader, contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                intake.main('original')
        self.assertEqual(caught.exception.code, 2)
        loader.assert_not_called()


if __name__ == '__main__':
    unittest.main()
