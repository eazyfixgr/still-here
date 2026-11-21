import { DAY, YEAR } from './constants.js';

export function birthMs(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date.getTime()
    : NaN;
}

export function validBirth(value, now = Date.now()) {
  const time = birthMs(value);
  return Number.isFinite(time) && time <= now && (now - time) / YEAR <= 120;
}

export function localDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function birthBounds(now = Date.now()) {
  const max = new Date(now);
  const min = new Date(now);
  min.setFullYear(min.getFullYear() - 120);
  return { min: localDateString(min), max: localDateString(max) };
}

export function parseDateTimeLocal(value) {
  if (typeof value !== 'string' || !value) return NaN;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.getTime() : NaN;
}

export function toDateTimeLocal(ms) {
  const date = new Date(ms);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function shifted(date, months) {
  const source = new Date(date);
  const target = source.getMonth() + months;
  const year = source.getFullYear() + Math.floor(target / 12);
  const month = ((target % 12) + 12) % 12;
  source.setDate(1);
  source.setFullYear(year, month, Math.min(new Date(date).getDate(), new Date(year, month + 1, 0).getDate()));
  return source;
}

export function calendarParts(from, to) {
  let cursor = new Date(from);
  const end = new Date(to);
  let years = Math.max(0, end.getFullYear() - cursor.getFullYear());
  while (years && shifted(cursor, years * 12) > end) years -= 1;
  cursor = shifted(cursor, years * 12);
  let months = Math.max(0, (end.getFullYear() - cursor.getFullYear()) * 12 + end.getMonth() - cursor.getMonth());
  while (months && shifted(cursor, months) > end) months -= 1;
  cursor = shifted(cursor, months);
  let remaining = Math.max(0, Math.floor((to - cursor.getTime()) / 1000));
  const days = Math.floor(remaining / 86400);
  remaining %= 86400;
  const hours = Math.floor(remaining / 3600);
  remaining %= 3600;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return [years, months, days, hours, minutes, seconds];
}

export function anniversaryMs(birth, years) {
  const start = new Date(birthMs(birth));
  const year = start.getFullYear() + years;
  const month = start.getMonth();
  const day = Math.min(start.getDate(), new Date(year, month + 1, 0).getDate());
  return new Date(year, month, day, 0, 0, 0, 0).getTime();
}

export function ageAt(ms, birth) {
  return (ms - birthMs(birth)) / YEAR;
}

function birthdayInYear(birth, year) {
  const birthDate = new Date(birthMs(birth));
  const month = birthDate.getMonth();
  const day = Math.min(birthDate.getDate(), new Date(year, month + 1, 0).getDate());
  return new Date(year, month, day, 0, 0, 0, 0).getTime();
}

export function nextBirthdayMs(birth, now = Date.now()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  let target = birthdayInYear(birth, today.getFullYear());
  if (target < today.getTime()) {
    target = birthdayInYear(birth, today.getFullYear() + 1);
  }
  return target;
}

export function daysUntil(target, now = Date.now()) {
  return Math.max(0, Math.ceil((target - now) / DAY));
}

export function startOfTruncatedDay(ms) {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}
