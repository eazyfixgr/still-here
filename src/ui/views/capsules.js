import { button, el } from '../dom.js';
import { icon } from '../icons.js';
import { t } from '../../core/i18n.js';
import { capsulesDue } from '../../core/game.js';
import { formatDateTime, formatNumber, formatShortDuration } from '../../core/format.js';

function capsuleCard(capsule, now, { onOpenCapsule, onDeleteCapsule }, tickers) {
  const opened = Boolean(capsule.openedAt);
  const due = !opened && capsule.openAt <= now;
  const status = el(
    'span',
    { class: `state-pill ${opened ? 'is-opened' : due ? 'is-ready' : 'is-sealed'}` },
    icon(opened ? 'check' : due ? 'capsules' : 'lock', { size: 14 }),
    opened ? t('openedLabel') : due ? t('readyLabel') : t('sealedLabel'),
  );
  const time = el('span', { class: 'capsule-open-date' }, opened
    ? t('openedOn', { date: formatDateTime(capsule.openedAt) })
    : t('opensOn', { date: formatDateTime(capsule.openAt) }));
  const countdown = el('span', { class: 'capsule-countdown' }, '');
  const openButton = button(
    opened ? t('readCapsule') : t('openCapsule'),
    {
      class: `btn btn-small ${due || opened ? 'btn-primary' : 'btn-ghost'}`,
      hidden: !opened && !due,
      onclick: () => onOpenCapsule(capsule),
    },
    icon(opened ? 'capsules' : 'arrow', { size: 15 }),
  );
  const readPreview = opened
    ? el('p', { class: 'capsule-excerpt' }, capsule.message)
    : el('p', { class: 'capsule-excerpt muted' }, t('capsuleSealedPreview'));

  const card = el(
    'article',
    { class: `capsule-card${opened ? ' is-opened' : due ? ' is-ready' : ' is-sealed'}` },
    el(
      'div',
      { class: 'capsule-card-head' },
      status,
      button('', {
        class: 'icon-button tiny',
        'aria-label': t('delete') + ': ' + capsule.title,
        title: t('delete'),
        onclick: () => onDeleteCapsule(capsule.id),
      }, icon('trash', { size: 15 })),
    ),
    el('h3', { class: 'capsule-title' }, capsule.title),
    readPreview,
    el('div', { class: 'capsule-foot' }, el('div', { class: 'capsule-dates' }, time, due ? null : countdown), openButton),
  );

  tickers.push((current) => {
    if (opened) return;
    const isDue = capsule.openAt <= current;
    if (isDue) {
      openButton.hidden = false;
      openButton.className = 'btn btn-small btn-primary';
      openButton.textContent = '';
      openButton.append(t('openCapsule'), icon('arrow', { size: 15 }));
      status.className = 'state-pill is-ready';
      status.textContent = '';
      status.append(icon('capsules', { size: 14 }), t('readyLabel'));
      countdown.textContent = t('capsuleReady');
    } else {
      openButton.hidden = true;
      countdown.textContent = t('capsuleWaiting', { time: formatShortDuration(capsule.openAt - current) });
    }
  });

  return card;
}

export function renderCapsules({ game, onAddCapsule, onOpenCapsule, onDeleteCapsule }) {
  const now = Date.now();
  const tickers = [];
  const all = [...game.capsules].sort((a, b) => {
    if (Boolean(a.openedAt) !== Boolean(b.openedAt)) return a.openedAt ? 1 : -1;
    return (a.openedAt ?? a.openAt) - (b.openedAt ?? b.openAt);
  });
  const dueCount = capsulesDue(game, now).length;
  const sealedCount = all.filter((item) => !item.openedAt).length;
  const grid = el('div', { class: 'capsule-grid' });

  for (const capsule of all) {
    grid.append(capsuleCard(capsule, now, { onOpenCapsule, onDeleteCapsule }, tickers));
  }

  if (!all.length) {
    grid.append(
      el(
        'div',
        { class: 'empty-state capsules-empty' },
        icon('capsules', { size: 30 }),
        el('h2', null, t('noCapsulesTitle')),
        el('p', null, t('noCapsulesCopy')),
        button(t('sealCapsule'), { class: 'btn btn-primary', onclick: onAddCapsule }, icon('plus', { size: 16 })),
      ),
    );
  }

  const node = el(
    'div',
    { class: 'view capsules-view' },
    el(
      'div',
      { class: 'page-head with-action' },
      el(
        'div',
        { class: 'page-head-copy' },
        el('div', { class: 'eyebrow' }, t('navCapsules')),
        el('h1', { class: 'page-title' }, t('capsulesTitle')),
        el('p', { class: 'page-sub' }, t('capsulesCopy')),
      ),
      button(t('sealCapsule'), { class: 'btn btn-primary', onclick: onAddCapsule }, icon('plus', { size: 17 })),
    ),
    el(
      'div',
      { class: 'capsule-summary' },
      el('span', { class: 'state-pill is-sealed' }, icon('lock', { size: 14 }), sealedCount === 1 ? t('capsuleCountSealedOne') : t('capsuleCountSealed', { count: formatNumber(sealedCount) })),
      dueCount > 0
        ? el('span', { class: 'state-pill is-ready' }, icon('capsules', { size: 14 }), dueCount === 1 ? t('capsuleCountReadyOne') : t('capsuleCountReady', { count: formatNumber(dueCount) }))
        : null,
    ),
    grid,
    el('p', { class: 'local-privacy-note' }, icon('shield', { size: 16 }), t('capsuleLocalNote')),
  );

  const runTickers = (current) => {
    for (const ticker of tickers) ticker(current);
  };
  runTickers(now);

  return {
    node,
    tick() {
      runTickers(Date.now());
    },
  };
}
