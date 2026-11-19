import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { RECIPES } from '../src/data/recipes';
import * as publicPhotos from '../src/domain/recipePhotos';

interface ReceptionManifest {
  recipes: { recipeId: string; state: string }[];
}

// The reception document is a test input only, never a dependency of the app.
const reception = JSON.parse(readFileSync(new URL(
  '../referencias/recetas-v83/fotografias-publicas/MANIFIESTO_FOTOS_ACTIVAS_127.json', import.meta.url,
), 'utf8')) as ReceptionManifest;
const source = ts.createSourceFile('recipePhotos.ts', readFileSync(new URL(
  '../src/domain/recipePhotos.ts', import.meta.url,
), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

/** Inspect the private table without exposing a mutable registry for testing. */
function projectionRows(): [string, string][] {
  const tables: ts.NewExpression[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'Map') tables.push(node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (tables.length !== 1 || tables[0].arguments?.length !== 1 || !ts.isArrayLiteralExpression(tables[0].arguments[0])) {
    throw new Error('Expected one explicit public status table.');
  }
  return tables[0].arguments[0].elements.map(row => {
    if (!ts.isArrayLiteralExpression(row) || row.elements.length !== 2) throw new Error('Expected only identity and status.');
    const [id, status] = row.elements;
    if (!ts.isStringLiteral(id) || !ts.isStringLiteral(status)) throw new Error('Expected explicit public identity and status literals.');
    return [id.text, status.text];
  });
}

describe('public recipe-photo availability without image publication', () => {
  it('exposes only a status getter, without importing reception files or metadata into the app', () => {
    expect(Object.keys(publicPhotos)).toEqual(['recipePhotoStatus']);
    const dependencies: ts.Node[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node) ||
          ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
            ts.isIdentifier(node.expression) && node.expression.text === 'require')) dependencies.push(node);
      ts.forEachChild(node, visit);
    };
    visit(source);
    expect(dependencies).toHaveLength(0);
    expect(projectionRows().every(([, state]) => ['NO_LOCALIZADA', 'PENDIENTE'].includes(state))).toBe(true);
  });

  it('covers exactly the 127 active public identities once, with no additional photo states for other recipes', () => {
    const rows = projectionRows();
    const ids = rows.map(([id]) => id);
    const activeIds = RECIPES.map(recipe => recipe.id).sort();
    expect(rows).toHaveLength(127);
    expect(new Set(ids).size).toBe(127);
    expect(new Set(activeIds).size).toBe(127);
    expect([...ids].sort()).toEqual(activeIds);
    expect(reception.recipes).toHaveLength(127);
    expect(reception.recipes.map(row => row.recipeId).sort()).toEqual(activeIds);
  });

  it('preserves every reception state as a primitive value, without resource or review metadata', () => {
    const expected = new Map(reception.recipes.map(row => [row.recipeId, row.state]));
    for (const [id, state] of projectionRows()) {
      expect(state, id).toBe(expected.get(id));
      const status = publicPhotos.recipePhotoStatus(id);
      expect(status, id).toBe(state);
      expect(typeof status, id).toBe('string');
      expect(status, id).toBe('NO_LOCALIZADA');
    }
  });

  it('keeps unknown, prototype, case and whitespace variants unknown instead of guessing an identity', () => {
    const unknownIds = [
      '', 'missing-recipe', '__proto__', 'constructor', 'prototype', 'toString', 'hasOwnProperty',
      'ARROZ-VERDURAS', 'arroz-verduras ', ' arroz-verduras', 'jj-e03-001', 'JJ-E03-001 ',
      'JJ-E03-001\u0000', '../JJ-E03-001', 'https://example.invalid/JJ-E03-001',
    ];
    for (const id of unknownIds) expect(publicPhotos.recipePhotoStatus(id), id).toBeUndefined();
    expect(publicPhotos.recipePhotoStatus('arroz-verduras')).toBe('NO_LOCALIZADA');
    expect(publicPhotos.recipePhotoStatus('JJ-E03-001')).toBe('NO_LOCALIZADA');
  });
});
