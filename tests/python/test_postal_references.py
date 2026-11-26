"""Pinned postal input, curated associations and bounded no-extraction preparation."""
from copy import deepcopy
import importlib.util
import io
import json
from pathlib import Path
import stat
import struct
import tempfile
import unittest
from unittest.mock import patch
import warnings
import zipfile

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location('jj_postal_builder', ROOT / 'scripts/prepare-postal-references.py')
assert SPEC and SPEC.loader
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)


class PostalReferences(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files = builder.generated_files()
        cls.manifest = json.loads(cls.files['source-manifest.json'])
        text = cls.files['postalReferences.ts'].decode('utf-8')
        cls.catalog = json.loads(text.split('export const postalReferenceCatalog = ', 1)[1]
                                 .split(' as const satisfies PostalReferenceCatalog;', 1)[0])
        cls.inputs = {name: builder.fixed_input(builder.SOURCE, name) for name in builder.INPUTS}
        cls.members = builder.postal_zip(cls.inputs['postal-ES.zip'])
        cls.rows = builder.postal_rows(cls.members['ES.txt'])
        cls.candidate = next(row for _, row in cls.rows if builder.in_scope(row) and row[8] and row[11] == '4')

    def zip_bytes(self, entries=None, compression=zipfile.ZIP_STORED):
        entries = entries or [('readme.txt', b'source'), ('ES.txt', b'postal')]
        target = io.BytesIO()
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', UserWarning)
            with zipfile.ZipFile(target, 'w', compression=compression) as archive:
                for name, content in entries:
                    archive.writestr(name, content)
        return target.getvalue()

    def postal_line(self, changes):
        row = self.candidate.copy()
        for index, value in changes.items():
            row[index] = value
        return ('\t'.join(row) + '\n').encode('utf-8')

    def reviewed_line(self, index, value):
        rows = self.inputs['gazetteer-reviewed.tsv'].decode('utf-8').splitlines()
        first = rows[0].split('\t')
        first[index] = value
        rows[0] = '\t'.join(first)
        return ('\n'.join(rows) + '\n').encode('utf-8')

    def test_real_counts_and_pinned_provenance(self):
        stats = self.manifest['statistics']
        self.assertEqual(stats['sourcePostalRows'], 37867)
        self.assertEqual(stats['candidatePostalRows'], 466)
        self.assertEqual(stats['candidatePostalCodes'], 162)
        self.assertEqual(stats['candidateQualityCounts'], {'1': 77, '3': 175, '4': 214})
        self.assertEqual(stats['activePostalReferences'], 207)
        self.assertEqual(stats['activeReviewedGazetteerReferences'], 2)
        self.assertEqual(stats['activeReferences'], 209)
        self.assertEqual(stats['activePostalCodesIncludingReviewed'], 129)
        self.assertEqual(stats['activeMunicipalities'], 29)
        self.assertEqual(self.manifest['generated']['sha256'], builder.sha256(self.files['postalReferences.ts']))
        self.assertEqual(self.manifest['attribution'], builder.ATTRIBUTION)
        builder.validate_catalog(self.catalog)

    def test_no_coordinate_inference_or_merging(self):
        references = [r for r in self.catalog['records'] if r['method'] == 'postal-geonameid']
        raw_by_hash = {builder.sha256(raw): row for raw, row in self.rows}
        for record in references:
            row = raw_by_hash[record['sourceId']]
            self.assertEqual(record['locality'], row[2])
            self.assertEqual(record['municipality'], row[7])
            self.assertEqual((record['latitude'], record['longitude']), (float(row[9]), float(row[10])))
            self.assertEqual(row[11], '4')
            self.assertIn(row[8], builder.MUNICIPALITIES)
        self.assertEqual(self.manifest['statistics']['duplicateCoordinatesPreserved'], 43)
        self.assertEqual(len({r['id'] for r in self.catalog['records']}), 209)

    def test_missing_municipalities_and_wrong_airport_are_withheld(self):
        withheld = self.manifest['withheldPostalRows']
        missing_quality4 = [r for r in withheld if r['quality'] == 4 and 'missing-municipality' in r['reasons']]
        self.assertEqual(len(missing_quality4), 7)
        airport = next(r for r in missing_quality4 if 'Aeropuerto Reina Sofia' in r['locality'])
        self.assertFalse(any(r['sourceId'] == airport['sourceId'] for r in self.catalog['records']))
        self.assertEqual(len([r for r in withheld if 'outside-tenerife-bounds' in r['reasons']]), 4)
        self.assertEqual(len(withheld), 259)

    def test_reviewed_points_use_gazetteer_not_wrong_postal_coordinates(self):
        selected = {r['sourceId']: r for r in self.catalog['records'] if r['method'] == 'reviewed-gazetteer'}
        self.assertEqual(set(selected), {'2514741', '6692470'})
        for sid, record in selected.items():
            expected = builder.CURATED[sid]
            self.assertEqual((record['latitude'], record['longitude']),
                             (expected['latitude'], expected['longitude']))
            association = next(a for a in self.manifest['reviewedAssociations'] if a['sourceId'] == sid)
            self.assertEqual(association['sourceModifiedOn'], expected['modified'])
            self.assertIn(association['withheldPostalQuality'], (1, 3))
            self.assertFalse(any(r['sourceId'] == association['postalSourceId'] for r in self.catalog['records']))

    def test_reproducible_canonical_bytes(self):
        self.assertEqual(builder.generated_files(), self.files)
        self.assertEqual(builder.generated_files(), self.files)

    def test_pinned_source_mutation_and_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            target = Path(temporary)
            for name, data in self.inputs.items():
                (target / name).write_bytes(data)
            self.assertEqual(builder.generated_files(target), self.files)
            (target / 'gazetteer-reviewed.tsv').write_bytes(self.inputs['gazetteer-reviewed.tsv'] + b'\n')
            with self.assertRaises(ValueError):
                builder.generated_files(target)
            (target / 'gazetteer-reviewed.tsv').unlink()
            (target / 'gazetteer-reviewed.tsv').symlink_to(builder.SOURCE / 'gazetteer-reviewed.tsv')
            with self.assertRaises(ValueError):
                builder.generated_files(target)

    def test_zip_exact_member_set_rejects_extra_duplicate_traversal_absolute_and_directory(self):
        for entries in [
            [('readme.txt', b'r'), ('ES.txt', b'p'), ('evil.py', b'ignored')],
            [('ES.txt', b'p'), ('ES.txt', b'q')],
            [('readme.txt', b'r'), ('../ES.txt', b'p')],
            [('readme.txt', b'r'), ('/ES.txt', b'p')],
            [('readme.txt', b'r'), ('folder/ES.txt', b'p')],
            [('readme.txt', b'r'), ('ES.txt/', b'p')],
        ]:
            with self.subTest(entries=entries), self.assertRaises(ValueError):
                builder.postal_zip(self.zip_bytes(entries))

    def test_zip_symlink_and_special_mode_rejected(self):
        for kind in (stat.S_IFLNK, stat.S_IFIFO, stat.S_IFCHR):
            target = io.BytesIO()
            with zipfile.ZipFile(target, 'w') as archive:
                archive.writestr('readme.txt', b'r')
                info = zipfile.ZipInfo('ES.txt')
                info.create_system = 3
                info.external_attr = (kind | 0o644) << 16
                archive.writestr(info, b'target')
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                builder.postal_zip(target.getvalue())

    def test_zip_encrypted_flag_rejected_before_read(self):
        raw = bytearray(self.zip_bytes())
        local = raw.find(b'PK\x03\x04')
        central = raw.find(b'PK\x01\x02')
        struct.pack_into('<H', raw, local + 6, 1)
        struct.pack_into('<H', raw, central + 8, 1)
        with self.assertRaises(ValueError):
            builder.postal_zip(bytes(raw))

    def test_zip_dos_directory_attribute_rejected_without_trailing_slash(self):
        target = io.BytesIO()
        with zipfile.ZipFile(target, 'w') as archive:
            archive.writestr('readme.txt', b'r')
            info = zipfile.ZipInfo('ES.txt')
            info.create_system = 0
            info.external_attr = 0x10
            archive.writestr(info, b'p')
        with self.assertRaises(ValueError):
            builder.postal_zip(target.getvalue())

    def test_zip_crc_corruption_rejected(self):
        raw = bytearray(self.zip_bytes())
        offset = 30 + len('readme.txt')
        raw[offset] ^= 1
        with self.assertRaises(ValueError):
            builder.postal_zip(bytes(raw))

    def test_zip_unsupported_method_and_compression_bomb_rejected(self):
        with self.assertRaises(ValueError):
            builder.postal_zip(self.zip_bytes(compression=zipfile.ZIP_BZIP2))
        with self.assertRaises(ValueError):
            builder.postal_zip(self.zip_bytes([('readme.txt', b'r'), ('ES.txt', b'x' * 100000)], zipfile.ZIP_DEFLATED))

    def test_zip_compressed_expanded_and_member_count_limits(self):
        with patch.object(builder, 'MAX_BYTES', 8), self.assertRaises(ValueError):
            builder.postal_zip(self.zip_bytes())
        raw = bytearray(self.zip_bytes())
        central = raw.find(b'PK\x01\x02')
        struct.pack_into('<I', raw, central + 24, builder.MAX_BYTES + 1)
        with self.assertRaises(ValueError):
            builder.postal_zip(bytes(raw))
        with self.assertRaises(ValueError):
            builder.postal_zip(self.zip_bytes([('ES.txt', b'p')]))

    def test_tsv_utf8_shape_dense_rows_and_line_limits(self):
        for raw in [b'\xff\n', b'\n', b'a\tb\n', self.postal_line({}) + b'\n',
                    self.postal_line({}).replace(b'\n', b'\r\n'), self.postal_line({})[:-1],
                    self.postal_line({2: 'x' * 10001})]:
            with self.subTest(raw=raw[:40]), self.assertRaises(ValueError):
                builder.postal_rows(raw)
        with patch.object(builder, 'MAX_ROWS', 1), self.assertRaises(ValueError):
            builder.postal_rows(self.members['ES.txt'])

    def test_postal_country_admin_quality_name_and_finite_numbers(self):
        for changes in [{0: 'FR'}, {1: '1234'}, {2: '<script>'}, {4: 'C N'}, {6: 'too-long'},
                        {7: ''}, {8: '38X06'}, {9: 'NaN'}, {10: 'Infinity'}, {9: '91'}, {11: '6'}]:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                builder.postal_rows(self.postal_line(changes))

    def test_unknown_tenerife_municipality_is_rejected(self):
        rows = builder.postal_rows(self.postal_line({8: '38999'}))
        with self.assertRaises(ValueError):
            builder.postal_records(rows)

    def test_duplicate_postal_raw_identity_rejected(self):
        with self.assertRaises(ValueError):
            builder.postal_rows(self.postal_line({}) * 2)

    def test_revised_point_identity_country_admin_class_and_mapping_are_fixed(self):
        for index, value in [(0, '9999999'), (1, 'Other'), (4, '28.1465'), (5, '-16.6752'),
                             (6, 'S'), (7, 'PPLA'), (8, 'FR'), (10, 'CN'), (11, 'GC'),
                             (12, '38040'), (17, 'Europe/Madrid'), (18, '2026-02-30')]:
            with self.subTest(index=index, value=value), self.assertRaises(ValueError):
                builder.reviewed_records(self.reviewed_line(index, value), self.rows)

    def test_reviewed_duplicate_missing_and_unassociated_points_rejected(self):
        first = self.inputs['gazetteer-reviewed.tsv'].splitlines()[0] + b'\n'
        for raw in (first, first * 2):
            with self.assertRaises(ValueError):
                builder.reviewed_records(raw, self.rows)
        without_association = [(b, r) for b, r in self.rows if r[2] != 'Playa De Los Cristianos']
        with self.assertRaises(ValueError):
            builder.reviewed_records(self.inputs['gazetteer-reviewed.tsv'], without_association)

    def test_catalog_schema_country_bounds_date_attribution_and_identity_rejected(self):
        changes = [('id', 'unknown'), ('postalCode', '38700'), ('country', 'FR'),
                   ('island', 'la-gomera'), ('municipalityCode', '38999'), ('latitude', 0),
                   ('latitude', '28.1'), ('longitude', float('nan')), ('latitude', True),
                   ('sourceId', 'unknown'), ('sourceUrl', 'https://example.com'), ('method', 'inferred')]
        for key, value in changes:
            candidate = deepcopy(self.catalog)
            candidate['records'][0][key] = value
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                builder.validate_catalog(candidate)
        for mutate in [lambda c: c.update(checkedOn='2026-02-30'), lambda c: c.update(version=True),
                       lambda c: c.update(extra='unknown'), lambda c: c['attribution'].update(adapted=1),
                       lambda c: c['records'][0].update(extra='unknown'),
                       lambda c: c['records'].append(deepcopy(c['records'][0]))]:
            candidate = deepcopy(self.catalog)
            mutate(candidate)
            with self.assertRaises(ValueError):
                builder.validate_catalog(candidate)

    def test_catalog_curated_coordinate_mismatch_rejected(self):
        candidate = deepcopy(self.catalog)
        reviewed = next(r for r in candidate['records'] if r['method'] == 'reviewed-gazetteer')
        reviewed['latitude'] = 28.1465
        with self.assertRaises(ValueError):
            builder.validate_catalog(candidate)

    def test_check_compares_catalog_and_derived_manifest_without_writes(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            runtime, manifest = root / 'postalReferences.ts', root / 'source-manifest.json'
            runtime.write_bytes(self.files['postalReferences.ts'])
            manifest.write_bytes(self.files['source-manifest.json'])
            before = {p.name: (p.stat().st_mtime_ns, p.read_bytes()) for p in root.iterdir()}
            original_open = Path.open

            def readonly_open(path, mode='r', *args, **kwargs):
                self.assertFalse(any(c in mode for c in 'wax+'))
                return original_open(path, mode, *args, **kwargs)

            with patch.object(builder, 'RUNTIME', runtime), patch.object(builder, 'SOURCE', root):
                with patch.object(Path, 'open', readonly_open):
                    builder.check(self.files)
                self.assertEqual(before, {p.name: (p.stat().st_mtime_ns, p.read_bytes()) for p in root.iterdir()})
                altered = deepcopy(self.manifest)
                altered['statistics']['activeReferences'] = 999
                manifest.write_bytes(builder.json_bytes(altered))
                with self.assertRaises(ValueError):
                    builder.check(self.files)
                manifest.write_bytes(self.files['source-manifest.json'])
                runtime.write_bytes(self.files['postalReferences.ts'] + b'\n')
                with self.assertRaises(ValueError):
                    builder.check(self.files)

    def test_prepare_only_new_destination_never_overwrites_or_accepts_links(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            destination = root / 'new'
            builder.write_new(destination, self.files)
            self.assertEqual({p.name: p.read_bytes() for p in destination.iterdir()}, self.files)
            with self.assertRaises(ValueError):
                builder.write_new(destination, self.files)
            link = root / 'linked'
            link.symlink_to(destination, target_is_directory=True)
            with self.assertRaises(ValueError):
                builder.write_new(link / 'nested', self.files)
            with self.assertRaises(ValueError):
                builder.write_new(root / 'escape', {'../app.ts': b'bad'})
            self.assertFalse((root / 'escape').exists())
            with self.assertRaises(ValueError):
                builder.write_new(ROOT / 'src/data/test-postal-overwrite', self.files)


if __name__ == '__main__':
    unittest.main()
