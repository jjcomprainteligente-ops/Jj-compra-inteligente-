import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { LEGACY_RECIPES, RECIPES } from '../src/data/recipes';
import { V3_RECIPES } from '../src/data/recipesV3';
import * as publicPhotos from '../src/domain/recipePhotos';
import { recipePhotoMessages } from '../src/i18n/catalogs/recipePhotos';

const projectFile = (path: string) => new URL('../' + path, import.meta.url);
const source = (path: string) => ts.createSourceFile(path, readFileSync(projectFile(path), 'utf8'),
  ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
interface AssetEntry { path: string; sha256: string; bytes: number; width: number; height: number }
interface Manifest { photos: { recipeId: string; thumbnail: AssetEntry; detail: AssetEntry }[] }

/** Inspect Metro declarations without asking Node to execute JPEG resources. */
function resourceRows(): { id: string; thumbnail: string; detail: string }[] {
  const maps: ts.NewExpression[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'Map') maps.push(node);
    ts.forEachChild(node, visit);
  };
  visit(source('src/data/recipePhotoAssets.ts'));
  expect(maps).toHaveLength(1);
  const input = maps[0].arguments?.[0];
  if (!input || !ts.isArrayLiteralExpression(input)) throw new Error('Static resource table required.');
  return input.elements.map(row => {
    if (!ts.isArrayLiteralExpression(row) || row.elements.length !== 2) throw new Error('Static ID and resources required.');
    const [id, wrapped] = row.elements;
    if (!ts.isStringLiteral(id) || !ts.isCallExpression(wrapped) || wrapped.expression.getText() !== 'Object.freeze' ||
      wrapped.arguments.length !== 1 || !ts.isObjectLiteralExpression(wrapped.arguments[0])) throw new Error('Immutable resource pair required.');
    const resources = new Map<string, string>();
    for (const property of wrapped.arguments[0].properties) {
      if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name) || !ts.isCallExpression(property.initializer) ||
          !ts.isIdentifier(property.initializer.expression) || property.initializer.expression.text !== 'require' ||
          property.initializer.arguments.length !== 1 || !ts.isStringLiteral(property.initializer.arguments[0])) throw new Error('Literal Metro require required.');
      resources.set(property.name.text, property.initializer.arguments[0].text);
    }
    expect([...resources.keys()].sort()).toEqual(['detail', 'thumbnail']);
    return { id: id.text, thumbnail: resources.get('thumbnail')!, detail: resources.get('detail')! };
  });
}

describe('verified catalogue photo availability', () => {
  it('preserves seven legacy identities and makes exactly the 150 delivered recipes available', () => {
    expect(LEGACY_RECIPES).toHaveLength(7);
    expect(V3_RECIPES).toHaveLength(150);
    expect(RECIPES).toHaveLength(157);
    expect(new Set(RECIPES.map(recipe => recipe.id)).size).toBe(157);
    for (const recipe of LEGACY_RECIPES) expect(publicPhotos.recipePhotoStatus(recipe.id), recipe.id).toBe('NO_LOCALIZADA');
    for (const recipe of V3_RECIPES) expect(publicPhotos.recipePhotoStatus(recipe.id), recipe.id).toBe('DISPONIBLE');
    expect(Object.keys(publicPhotos)).toEqual(['recipePhotoStatus']);
  });

  it('keeps binary assets and private reception metadata outside the status API', () => {
    const status = source('src/domain/recipePhotos.ts');
    const imports: string[] = [];
    const calls: string[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          ts.isIdentifier(node.expression) && node.expression.text === 'require')) calls.push(node.getText());
      ts.forEachChild(node, visit);
    };
    visit(status);
    expect(imports).toEqual(['../data/recipesV3']);
    expect(calls).toEqual([]);
    expect(status.text).not.toMatch(/https?:|sha256|licen[cs]e|\.jpg|\.png/);
  });

  it('declares one immutable, local Metro resource pair per delivered ID, with no legacy substitution', () => {
    const rows = resourceRows();
    expect(rows).toHaveLength(150);
    expect(new Set(rows.map(row => row.id)).size).toBe(150);
    expect(rows.map(row => row.id).sort()).toEqual(V3_RECIPES.map(recipe => recipe.id).sort());
    for (const row of rows) {
      expect(row.thumbnail).toBe('../../assets/recipes-v3/thumbnails/' + row.id + '.jpg');
      expect(row.detail).toBe('../../assets/recipes-v3/details/' + row.id + '.jpg');
    }
  });

  it('binds all 300 resources to the derivative manifest without decoding or exposing originals', () => {
    const manifest = JSON.parse(readFileSync(projectFile('referencias/recetas-v3/manifest-assets.json'), 'utf8')) as Manifest;
    expect(manifest.photos).toHaveLength(150);
    expect(manifest.photos.map(row => row.recipeId).sort()).toEqual(V3_RECIPES.map(recipe => recipe.id).sort());
    for (const row of manifest.photos) for (const [variant, directory, width] of [
      ['thumbnail', 'thumbnails', 192], ['detail', 'details', 960],
    ] as const) {
      const asset = row[variant];
      expect(asset.path).toBe('assets/recipes-v3/' + directory + '/' + row.recipeId + '.jpg');
      const bytes = readFileSync(projectFile(asset.path));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.width).toBe(width);
      expect([width * 2 / 3, width * 3 / 4]).toContain(asset.height);
    }
  });

  it('keeps unknown, prototype, case and whitespace variants unknown instead of guessing a file', () => {
    for (const id of ['', 'missing-recipe', '__proto__', 'constructor', 'prototype', 'toString', 'hasOwnProperty',
      'ARROZ-VERDURAS', 'arroz-verduras ', ' arroz-verduras', 'jj-e03-001', 'JJ-E03-001 ',
      'JJ-E03-001\u0000', '../JJ-E03-001', 'https://example.invalid/JJ-E03-001']) {
      expect(publicPhotos.recipePhotoStatus(id), id).toBeUndefined();
    }
  });

  it('provides photo alt text and unavailable copy in all four interface languages', () => {
    expect(Object.keys(recipePhotoMessages).sort()).toEqual(['de', 'en', 'es', 'fr']);
    for (const catalog of Object.values(recipePhotoMessages)) {
      expect(catalog['recipePhotos.imageAlt']).toContain('{title}');
      expect(catalog['recipePhotos.unavailable'].trim().length).toBeGreaterThan(0);
      expect(catalog['recipePhotos.pending'].trim().length).toBeGreaterThan(0);
    }
  });
});
