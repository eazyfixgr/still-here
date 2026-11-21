import { getLocaleMeta, t } from './i18n.js';

export function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat(getLocaleMeta().locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value, digits = 1) {
  return `${formatNumber(value, digits)}%`;
}

export function formatDate(ms, { short = false, weekday = false } = {}) {
  return new Intl.DateTimeFormat(getLocaleMeta().locale, {
    year: 'numeric',
    month: short ? 'short' : 'long',
    day: 'numeric',
    ...(weekday ? { weekday: 'long' } : {}),
  }).format(new Date(ms));
}

export function formatDateTime(ms) {
  return new Intl.DateTimeFormat(getLocaleMeta().locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));
}

export function formatTime(ms) {
  return new Intl.DateTimeFormat(getLocaleMeta().locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ms));
}

export function formatClockParts(parts, locale = getLocaleMeta().locale) {
  return parts.map((part) =>
    new Intl.NumberFormat(locale, {
      minimumIntegerDigits: 2,
      useGrouping: false,
    }).format(part),
  );
}

export function formatYears(value, digits = 1) {
  return `${formatNumber(value, digits)} ${t('unitYears')}`;
}

export function formatShortDuration(ms) {
  let seconds = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  if (days > 0) return `${t('daysShort', { n: formatNumber(days) })} ${t('hoursShort', { n: formatNumber(hours) })}`;
  if (hours > 0) return `${t('hoursShort', { n: formatNumber(hours) })} ${t('minutesShort', { n: formatNumber(minutes) })}`;
  if (minutes > 0) return `${t('minutesShort', { n: formatNumber(minutes) })} ${t('secondsShort', { n: formatNumber(seconds) })}`;
  return t('secondsShort', { n: formatNumber(seconds) });
}

export function formatSignedYears(delta, digits = 1) {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return `${sign}${formatNumber(Math.abs(delta), digits)} ${t('unitYears')}`;
}

export function baselineLabel(id) {
  if (!id) return t('unknownValue');
  try {
    return new Intl.DisplayNames(getLocaleMeta().locale, { type: 'region' }).of(id) ?? id;
  } catch {
    return id;
  }
}

export function firstName(name) {
  const trimmed = String(name || '').trim();
  return trimmed ? trimmed.split(/\s+/)[0] : '';
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
