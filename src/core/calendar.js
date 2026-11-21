import { publicLink } from './sharing.js';
import { t } from './i18n.js';

export function escapeCalendarText(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\r?\n|\r/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

export function foldCalendarLine(line) {
  const encoder = new TextEncoder();
  const lines = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 75) {
      lines.push(current);
      current = ' ';
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  lines.push(current);
  return lines.join('\r\n');
}

function stamp(time) {
  return new Date(time).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function capsuleCalendar(capsule, now = Date.now()) {
  if (!Number.isFinite(capsule.openAt)) throw new Error('invalid-date');
  const url = `${publicLink()}#/capsules`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Still Here//Time Capsules//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:stillhere-${escapeCalendarText(capsule.id ?? Math.floor(capsule.openAt))}@eazyfixgr.github.io`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(capsule.openAt)}`,
    `DTEND:${stamp(capsule.openAt + 10 * 60000)}`,
    `SUMMARY:${escapeCalendarText(t('calendarEventTitle'))}`,
    `DESCRIPTION:${escapeCalendarText(`${t('calendarEventDescription')}\n${url}`)}`,
    `URL:${url}`,
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeCalendarText(t('calendarEventTitle'))}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(foldCalendarLine).join('\r\n')}\r\n`;
}
