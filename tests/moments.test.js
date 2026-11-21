import { describe, expect, it } from 'vitest';
import { civilDay, lifeInNumbers, momentFor, validMomentDate, yearInDays } from '../src/core/moments.js';

describe('daily moments', () => {
  it('picks a stable question for each date', () => {
    const first = momentFor('2026-11-22');
    const second = momentFor('2026-11-22');
    const next = momentFor('2026-11-23');
    expect(first.key).toBe(second.key);
    expect(first.key).toMatch(/^momentPrompt\d+$/);
    expect(next.index).toBe((first.index + 1) % 21);
  });

  it('validates shared dates', () => {
    expect(validMomentDate('2026-11-10')).toBe(true);
    expect(validMomentDate('2019-11-10')).toBe(false);
    expect(validMomentDate('nonsense')).toBe(false);
  });

  it('counts a life in ordinary days', () => {
    const birth = new Date(2000, 0, 1, 12, 0, 0).getTime();
    const now = new Date(2026, 0, 1, 18, 0, 0).getTime();
    const numbers = lifeInNumbers('2000-01-01', now);
    expect(civilDay(now) - civilDay(birth)).toBe(9497);
    expect(numbers.days).toBe(9497);
    expect(numbers.weeks).toBe(Math.floor(9497 / 7));
    expect(numbers.nextRound).toBe(10000);
    expect(numbers.daysToRound).toBe(503);
  });

  it('maps the current day inside a year', () => {
    const info = yearInDays(new Date(2024, 11, 31, 12, 0, 0).getTime());
    expect(info.year).toBe(2024);
    expect(info.total).toBe(366);
    expect(info.day).toBe(366);
  });
});
