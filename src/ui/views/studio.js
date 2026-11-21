import { button, el, option } from '../dom.js';
import { icon } from '../icons.js';
import { t } from '../../core/i18n.js';
import { HABITS } from '../../data/habits.js';
import { scenarioFor } from '../../core/model.js';
import { YEAR } from '../../core/constants.js';
import { ageAt } from '../../core/dates.js';
import {
  baselineLabel,
  formatDate,
  formatNumber,
  formatShortDuration,
  formatYears,
} from '../../core/format.js';

function differenceText(delta) {
  if (Math.abs(delta) < 0.08) return { text: t('studioDifferenceSame'), tone: 'same' };
  const amount = Math.abs(delta) >= 1 ? formatYears(Math.abs(delta), 1) : formatShortDuration(Math.abs(delta) * YEAR);
  return delta > 0
    ? { text: t('studioDifferenceMore', { time: amount }), tone: 'more' }
    : { text: t('studioDifferenceLess', { time: amount }), tone: 'less' };
}

export function renderStudio({ game }) {
  const localHabits = { ...game.habits };
  const selects = new Map();
  const years = el('strong', { class: 'studio-years' }, '—');
  const end = el('span', { class: 'studio-end-date' }, '—');
  const difference = el('span', { class: 'difference-pill' }, '—');
  const points = el('span', null, '—');
  const currentRemaining = Math.max(0, (game.scenario.endpoint - Date.now()) / YEAR);

  const previewCard = el(
    'aside',
    { class: 'studio-preview' },
    el('div', { class: 'eyebrow' }, t('studioPreviewTitle')),
    el('div', { class: 'studio-years-row' }, years, el('span', { class: 'studio-years-unit' }, t('studioYears'))),
    el('div', { class: 'studio-end-row' }, el('span', null, t('studioEnd')), end),
    el('div', { class: 'studio-current' }, t('studioCurrent', { years: formatNumber(currentRemaining, 1) })),
    el('div', { class: 'studio-difference-row' }, el('span', { class: 'eyebrow' }, t('studioDifference')), difference),
    el('div', { class: 'studio-points' }, points),
    el('div', { class: 'studio-meta' },
      el('span', null, t('studioAgeNow', { age: formatNumber(Math.floor(ageAt(Date.now(), game.profile.birth))) })),
      el('span', null, t('studioBaseline', { country: baselineLabel(game.profile.baselineId) })),
    ),
    el('p', { class: 'model-note' }, t('studioSandboxNote')),
    el('p', { class: 'model-note' }, t('studioFictionalNote')),
    button(t('studioReset'), {
      class: 'btn btn-ghost btn-small',
      onclick: () => {
        Object.assign(localHabits, game.habits);
        for (const [id, select] of selects) select.value = String(game.habits[id]);
        update();
      },
    }, icon('reset', { size: 15 })),
  );

  const controls = el('div', { class: 'studio-controls' });
  for (const habit of HABITS) {
    const select = el(
      'select',
      {
        class: 'select',
        id: `studio-${habit.id}`,
        onchange: (event) => {
          localHabits[habit.id] = Number(event.target.value);
          update();
        },
      },
      ...habit.choices.map((choice, index) => option(index, t(choice.labelKey), index === localHabits[habit.id])),
    );
    selects.set(habit.id, select);
    controls.append(
      el(
        'label',
        { class: 'habit-control', for: `studio-${habit.id}` },
        el('span', { class: 'habit-name' }, t(habit.labelKey)),
        select,
      ),
    );
  }

  function update() {
    try {
      const result = scenarioFor({ ...game.profile, habits: localHabits });
      const delta = result.remainingYears - currentRemaining;
      years.textContent = formatNumber(result.remainingYears, 1);
      end.textContent = formatDate(result.endpoint);
      points.textContent = t('studioPoints', { points: formatNumber(result.points) });
      const diff = differenceText(delta);
      difference.textContent = diff.text;
      difference.className = `difference-pill is-${diff.tone}`;
    } catch {
      years.textContent = '—';
      end.textContent = '—';
      difference.textContent = '—';
    }
  }

  update();

  const node = el(
    'div',
    { class: 'view studio-view' },
    el(
      'div',
      { class: 'page-head' },
      el(
        'div',
        { class: 'page-head-copy' },
        el('div', { class: 'eyebrow' }, t('navStudio')),
        el('h1', { class: 'page-title' }, t('studioTitle')),
        el('p', { class: 'page-sub' }, t('studioCopy')),
      ),
      el('span', { class: 'sandbox-badge' }, icon('studio', { size: 15 }), t('studioSandboxNote')),
    ),
    el('div', { class: 'studio-layout' }, el('div', { class: 'card studio-form' }, el('h2', null, t('step2Title')), el('p', { class: 'muted-copy' }, t('studioEditHint')), controls), previewCard),
    el('p', { class: 'studio-footnote' }, t('studioFictionalNote')),
  );

  return { node, tick() {} };
}
