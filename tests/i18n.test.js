import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../src/core/i18n.js';

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
    expect(Object.keys(MESSAGES.el).sort()).toEqual(Object.keys(MESSAGES.en).sort());
  });

  it('does not define duplicate keys', () => {
    for (const file of ['en', 'el', 'en.launch', 'el.launch']) {
      expect(duplicateKeys(`src/core/locales/${file}.js`), file).toEqual([]);
    }
  });

  it('keeps placeholders in sync', () => {
    for (const key of Object.keys(MESSAGES.en)) {
      const enTokens = (MESSAGES.en[key].match(/\{\w+\}/g) ?? []).sort();
      const elTokens = (MESSAGES.el[key].match(/\{\w+\}/g) ?? []).sort();
      expect(elTokens, key).toEqual(enTokens);
    }
  });

  it('does not leave untranslated Latin lookalike fragments in Greek copy', () => {
    expect(JSON.stringify(MESSAGES.el)).not.toContain('κopia');
    expect(MESSAGES.el.heroCopy).toMatch(/[Α-ω]/);
    expect(MESSAGES.el.shareTitle).toMatch(/[Α-ω]/);
  });
});
