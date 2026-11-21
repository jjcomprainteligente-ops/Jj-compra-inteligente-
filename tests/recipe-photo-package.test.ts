import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from 'vitest';

const { recipePhotoPackage, verifyRecipePhotoPackage } = createRequire(import.meta.url)('../scripts/recipe-photo-package.cjs');
const temporary: string[] = [];
afterEach(() => temporary.splice(0).forEach(directory => rmSync(directory, { recursive: true, force: true })));

function fixture() {
  const project = mkdtempSync(path.join(tmpdir(), 'jj-photo-package-'));
  temporary.push(project);
  const directory = path.join(project, 'referencias/recetas-v3');
  mkdirSync(directory, { recursive: true });
  const filename = path.join(directory, 'manifest-assets.json');
  const files: { file: string; size: number; sha256: string }[] = [];
  const photos = Array.from({ length: 150 }, (_, index) => {
    const recipeId = 'JJ-TEST-' + index.toString().padStart(3, '0');
    const pair = Object.fromEntries([['thumbnail', 'thumbnails'], ['detail', 'details']].map(([variant, folder]) => {
      files.push({ file: 'assets/assets/recipes-v3/' + folder + '/' + recipeId + '.' + 'a'.repeat(32) + '.jpg',
        size: 100, sha256: 'b'.repeat(64) });
      return [variant, { path: 'assets/recipes-v3/' + folder + '/' + recipeId + '.jpg',
        bytes: 100, sha256: 'b'.repeat(64), width: 192, height: 128 }];
    }));
    return { recipeId, ...pair };
  });
  const manifest = { schemaVersion: 1, source: { zipSHA256: 'c'.repeat(64), sidecarSHA256: 'd'.repeat(64) }, photos };
  writeFileSync(filename, JSON.stringify(manifest));
  return { project, filename, files, manifest };
}

describe('compiled recipe-photo publication boundary', () => {
  it('includes exactly the reviewed derivatives and verifies their package record', () => {
    const { project, files } = fixture();
    const result = recipePhotoPackage(project, files);
    expect(result.recipes).toBe(150);
    expect(result.files).toHaveLength(300);
    expect(result.totalBytes).toBe(30000);
    expect(verifyRecipePhotoPackage(project, result, files)).toEqual(result);
  });

  it('rejects a missing, corrupted or duplicated compiled image', () => {
    const { project, files } = fixture();
    expect(() => recipePhotoPackage(project, files.slice(1))).toThrow();
    expect(() => recipePhotoPackage(project, [{ ...files[0], sha256: 'f'.repeat(64) }, ...files.slice(1)])).toThrow();
    expect(() => recipePhotoPackage(project, [...files, files[0]])).toThrow();
  });

  it('rejects original-size or unrelated JPEGs instead of silently shipping them', () => {
    const { project, files } = fixture();
    expect(() => recipePhotoPackage(project, [...files, { file: 'assets/raw/source.jpg', size: 800000, sha256: 'b'.repeat(64) }])).toThrow();
    expect(() => recipePhotoPackage(project, [{ ...files[0], size: 800000 }, ...files.slice(1)])).toThrow();
  });

  it('rejects path traversal and duplicate identities in derivative metadata', () => {
    const { project, files, filename, manifest } = fixture();
    const edited = JSON.parse(JSON.stringify(manifest));
    edited.photos[0].detail.path = '../../owner-data.jpg';
    writeFileSync(filename, JSON.stringify(edited));
    expect(() => recipePhotoPackage(project, files)).toThrow();
    manifest.photos[1] = manifest.photos[0];
    writeFileSync(filename, JSON.stringify(manifest));
    expect(() => recipePhotoPackage(project, files)).toThrow();
  });

  it('rejects a symlinked source manifest without following it', () => {
    const { project, filename, files } = fixture();
    const external = path.join(project, 'external.json');
    writeFileSync(external, readFileSync(filename));
    rmSync(filename);
    symlinkSync(external, filename);
    expect(() => recipePhotoPackage(project, files)).toThrow();
  });

  it('rejects a package record whose image association or source binding was altered', () => {
    const { project, files } = fixture();
    const result = recipePhotoPackage(project, files);
    result.files[0].recipeId = 'JJ-OTHER';
    expect(() => verifyRecipePhotoPackage(project, result, files)).toThrow();
    const other = recipePhotoPackage(project, files);
    other.sourceZIP_SHA256 = '0'.repeat(64);
    expect(() => verifyRecipePhotoPackage(project, other, files)).toThrow();
  });
});
