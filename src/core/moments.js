import { DAY } from './constants.js';
import { birthMs, localDateString } from './dates.js';

export const MOMENT_KEYS = Array.from({ length: 21 }, (_, index) => `momentPrompt${index}`);

export function civilDay(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY);
}

export function validMomentDate(value) {
  const time = birthMs(value);
  if (!Number.isFinite(time)) return false;
  const year = new Date(time).getFullYear();
  return year >= 2020 && year <= 2100;
}

export function momentFor(value = localDateString(new Date())) {
  const date = validMomentDate(value) ? value : localDateString(new Date());
  const day = civilDay(birthMs(date));
  const index = ((day % MOMENT_KEYS.length) + MOMENT_KEYS.length) % MOMENT_KEYS.length;
  return { date, key: MOMENT_KEYS[index], index };
}

export function lifeInNumbers(birth, now = Date.now()) {
  const start = birthMs(birth);
  if (!Number.isFinite(start)) throw new Error('invalid-birth');
  const days = Math.max(0, civilDay(now) - civilDay(start));
  const nextRound = (Math.floor(days / 1000) + 1) * 1000;
  const roundDate = new Date(start);
  roundDate.setDate(roundDate.getDate() + nextRound);
  return {
    days,
    weeks: Math.floor(days / 7),
    nextRound,
    daysToRound: nextRound - days,
    roundDate: roundDate.getTime(),
  };
}

export function yearInDays(now = Date.now()) {
  const today = new Date(now);
  const year = today.getFullYear();
  const first = new Date(year, 0, 1);
  const next = new Date(year + 1, 0, 1);
  return {
    year,
    day: civilDay(today) - civilDay(first) + 1,
    total: civilDay(next) - civilDay(first),
  };
}
