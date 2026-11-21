import { el } from '../dom.js';
import { languageOptions, t } from '../../core/i18n.js';

export function languageSelect({ id = 'language', value, onChange, className = '' }) {
  const select = el(
    'select',
    {
      id,
      class: `select language-select ${className}`.trim(),
      'aria-label': t('language'),
      onchange: (event) => onChange(event.target.value),
    },
    ...languageOptions().map((language) =>
      el('option', { value: language.code, selected: language.code === value }, language.name),
    ),
  );
  return select;
}
