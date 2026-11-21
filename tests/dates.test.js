import { describe, expect, it } from 'vitest';
import {
  anniversaryMs,
  birthMs,
  calendarParts,
  daysUntil,
  nextBirthdayMs,
  validBirth,
} from '../src/core/dates.js';

describe('dates', () => {
  it('parses local birth dates and rejects impossible ones', () => {
    expect(Number.isFinite(birthMs('1990-05-12'))).toBe(true);
    expect(Number.isNaN(birthMs('1990-02-30'))).toBe(true);
    const now = new Date(2026, 0, 1).getTime();
    expect(validBirth('1990-05-12', now)).toBe(true);
    expect(validBirth('2030-01-01', now)).toBe(false);
    expect(validBirth('1890-01-01', now)).toBe(false);
  });

  it('splits calendar duration into years, months and smaller parts', () => {
    const from = new Date(2024, 0, 1, 0, 0, 0).getTime();
    const to = new Date(2025, 0, 1, 0, 0, 0).getTime();
    expect(calendarParts(from, to)).toEqual([1, 0, 0, 0, 0, 0]);
    const half = new Date(2025, 5, 1, 12, 30, 15).getTime();
    expect(calendarParts(from, half)).toEqual([1, 5, 0, 12, 30, 15]);
  });

  it('clamps leap-day anniversaries', () => {
    const leap = new Date(2000, 1, 29, 0, 0, 0).getTime();
    const anniversary = new Date(anniversaryMs('2000-02-29', 1));
    expect(anniversary.getMonth()).toBe(1);
    expect(anniversary.getDate()).toBe(28);
    expect(leap).toBeLessThan(anniversary.getTime());
  });

  it('finds the next birthday including today', () => {
    const now = new Date(2026, 4, 12, 9, 0, 0).getTime();
    const birthday = nextBirthdayMs('1990-05-12', now);
    const date = new Date(birthday);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(12);
    expect(daysUntil(birthday, now)).toBe(0);
  });

  it('clamps a leap-day birthday in a common year', () => {
    const now = new Date(2026, 1, 1).getTime();
    const date = new Date(nextBirthdayMs('2000-02-29', now));
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(1);
    expect(date.getDate()).toBe(28);
  });
});
