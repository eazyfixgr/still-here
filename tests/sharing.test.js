import { afterEach, describe, expect, it } from 'vitest';
import { launchContext, publicLink, shareContent } from '../src/core/sharing.js';
import { setLocale } from '../src/core/i18n.js';

const NOW = new Date(2026, 10, 22, 12, 0, 0).getTime();

afterEach(() => setLocale('en'));

describe('sharing', () => {
  it('parses launch links without trusting arbitrary values', () => {
    expect(launchContext('?lang=el&moment=2026-11-10')).toEqual({ locale: 'el', momentDate: '2026-11-10' });
    expect(launchContext('?lang=xx&moment=bad')).toEqual({ locale: null, momentDate: null });
  });

  it('builds public links with language and moment', () => {
    const link = new URL(publicLink({ locale: 'el', momentDate: '2026-11-10' }));
    expect(link.origin).toBe('https://eazyfixgr.github.io');
    expect(link.pathname).toBe('/still-here/');
    expect(link.searchParams.get('lang')).toBe('el');
    expect(link.searchParams.get('moment')).toBe('2026-11-10');
    expect(publicLink({ locale: 'en' })).not.toContain('lang=');
  });

  it('makes a private-safe days caption without the birth date', () => {
    const content = shareContent({ game: { profile: { birth: '1990-05-12' } }, kind: 'days', now: NOW });
    expect(content.value).toBe('13,343');
    expect(content.caption).toContain('13,343');
    expect(content.caption).not.toContain('1990');
    expect(content.url).toContain('eazyfixgr.github.io/still-here');
  });

  it('marks demo cards and can share a moment or milestone', () => {
    const moment = shareContent({ kind: 'moment', momentDate: '2026-11-10', sample: true, now: NOW });
    expect(moment.sample).toBe(true);
    expect(moment.caption).toMatch(/question/i);
    const milestone = shareContent({
      game: { profile: { birth: '1990-05-12' } },
      kind: 'milestone',
      milestone: { title: 'A quiet morning by the sea' },
      now: NOW,
    });
    expect(milestone.caption).toContain('A quiet morning by the sea');
    expect(milestone.url).not.toContain('moment=');
  });

  it('uses Greek copy when the locale is Greek', () => {
    setLocale('el');
    const content = shareContent({ kind: 'moment', momentDate: '2026-11-10', now: NOW });
    expect(content.eyebrow).toBe('Η ΕΡΩΤΗΣΗ ΤΗΣ ΗΜΕΡΑΣ');
    expect(content.caption).toMatch(/ερώτηση/i);
  });
});
