import { el } from './dom.js';
import { formatClockParts } from '../core/format.js';
import { t } from '../core/i18n.js';

const UNITS = [
  { key: 'unitYears', className: 'is-years' },
  { key: 'unitMonths' },
  { key: 'unitDays' },
  { key: 'unitHours' },
  { key: 'unitMinutes' },
  { key: 'unitSeconds', className: 'is-seconds' },
];

export function createCountdown(showSeconds = true) {
  const grid = el('div', { class: 'countdown-grid', role: 'timer', 'aria-live': 'off' });
  for (const unit of UNITS) {
    const value = el('span', { class: 'countdown-value' }, '00');
    const label = el('span', { class: 'countdown-label' }, t(unit.key));
    const cell = el('div', { class: `countdown-cell ${unit.className ?? ''}`, dataset: { unit: unit.key } }, value, label);
    grid.append(cell);
  }
  grid.dataset.showSeconds = String(showSeconds);
  return grid;
}

export function updateCountdown(grid, parts, showSeconds = true) {
  grid.dataset.showSeconds = String(showSeconds);
  const formatted = formatClockParts(parts);
  [...grid.children].forEach((cell, index) => {
    cell.firstElementChild.textContent = formatted[index];
  });
}
