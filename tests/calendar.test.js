import { describe, expect, it } from 'vitest';
import { capsuleCalendar, escapeCalendarText } from '../src/core/calendar.js';

const NOW = new Date(2026, 10, 22, 12, 0, 0).getTime();

describe('calendar export', () => {
  it('escapes commas, semicolons and new lines', () => {
    expect(escapeCalendarText('one, two; three\nfour')).toBe('one\\, two\\; three\\nfour');
  });

  it('creates a valid capsule reminder with URL and alarm', () => {
    const ics = capsuleCalendar({ openAt: NOW + 86400000 }, NOW);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('TRIGGER:-PT15M');
    expect(ics).toContain('https://eazyfixgr.github.io/still-here/');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics.split('\r\n').length).toBeGreaterThan(10);
  });
});
