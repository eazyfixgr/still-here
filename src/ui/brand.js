import { el } from './dom.js';
import { t } from '../core/i18n.js';

export function brand({ href, compact = false } = {}) {
  const content = el(
    'span',
    { class: 'brand' },
    el('span', { class: 'brandmark', 'aria-hidden': 'true' }),
    el('span', { class: 'brand-name' }, t('appName'), el('span', { class: 'green' }, '.')),
  );
  if (!href) return content;
  return el('a', { class: `brand-link${compact ? ' compact' : ''}`, href, 'aria-label': t('appName') }, content);
}
