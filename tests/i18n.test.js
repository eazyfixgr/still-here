import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import en from '../src/core/locales/en.js';
import el from '../src/core/locales/el.js';

function duplicateKeys(path) {
  const source = readFileSync(path, 'utf8');
  const seen = new Set();
  const duplicates = new Set();
  for (const match of source.matchAll(/^\s{2}([A-Za-z0-9_]+):/gm)) {
    if (seen.has(match[1])) duplicates.add(match[1]);
    seen.add(match[1]);
  }
  return [...duplicates];
}

describe('translations', () => {
  it('keeps the same keys in English and Greek', () => {
    expect(Object.keys(el).sort()).toEqual(Object.keys(en).sort());
  });

  it('does not define duplicate keys', () => {
    expect(duplicateKeys('src/core/locales/en.js')).toEqual([]);
    expect(duplicateKeys('src/core/locales/el.js')).toEqual([]);
  });

  it('keeps placeholders in sync', () => {
    for (const key of Object.keys(en)) {
      const enTokens = (en[key].match(/\{\w+\}/g) ?? []).sort();
      const elTokens = (el[key].match(/\{\w+\}/g) ?? []).sort();
      expect(elTokens, key).toEqual(enTokens);
    }
  });

  it('does not leave untranslated Latin lookalike fragments in Greek copy', () => {
    expect(JSON.stringify(el)).not.toContain('κopia');
  });
});
