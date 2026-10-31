import { describe, expect, it } from 'vitest';
import { resources } from '../src/i18n/resources';
import { createTranslator } from '../src/i18n/core';
import { SUPPORTED_LANGUAGES } from '../src/i18n/types';

const placeholders = (value: string) => [...value.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map(match => match[1]).sort();

describe('complete launch catalogs', () => {
  const sourceKeys = Object.keys(resources.es).sort();
  it('contains namespaced product messages instead of an empty framework shell', () => {
    expect(sourceKeys.length).toBeGreaterThan(100);
    for (const prefix of ['app.', 'common.', 'menus.', 'prices.', 'recipes.', 'legacy.', 'errors.']) {
      expect(sourceKeys.some(key => key.startsWith(prefix))).toBe(true);
    }
  });

  for (const language of SUPPORTED_LANGUAGES) {
    it(language + ': covers every Spanish key and preserves every placeholder', () => {
      expect(Object.keys(resources[language]).sort()).toEqual(sourceKeys);
      const t = createTranslator(language, resources);
      for (const key of sourceKeys) {
        expect(resources[language][key].trim(), key).not.toBe('');
        expect(placeholders(resources[language][key]), key).toEqual(placeholders(resources.es[key]));
        const parameters = Object.fromEntries(placeholders(resources.es[key]).map(name => [name, 'value']));
        expect(t(key, parameters), key).not.toBe(key);
        expect(t(key, parameters), key).not.toMatch(/\{[a-zA-Z][a-zA-Z0-9_]*\}/);
      }
    });
  }
});
