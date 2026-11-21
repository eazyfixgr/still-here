import { append, button, clear, el } from '../dom.js';
import { icon } from '../icons.js';
import { t } from '../../core/i18n.js';
import {
  achievementProgress,
  buildAchievements,
  isEarned,
  sortAchievements,
} from '../../core/achievements.js';
import { formatDate, formatNumber, formatPercent } from '../../core/format.js';

function createCard(item, game, now, onDelete) {
  const earned = isEarned(game, item.id);
  const card = el('article', { class: `achievement-card ${earned ? 'is-unlocked' : 'is-locked'}${item.kind === 'custom' ? ' is-custom' : ''}` });
  const title = el('h3', { class: 'achievement-title' }, item.title);
  const desc = el('p', { class: 'achievement-desc' }, item.description);
  const badge = item.kind === 'custom' ? el('span', { class: 'badge custom-badge' }, t('customBadge')) : null;

  append(
    card,
    el('div', { class: 'achievement-top' }, el('div', { class: 'symbol-badge', 'aria-hidden': 'true' }, item.symbol), earned
      ? el('span', { class: 'state-label is-unlocked' }, icon('check', { size: 14 }), t('unlockedLabel'))
      : el('span', { class: 'state-label' }, icon('lock', { size: 14 }), t('aheadLabel'))),
    badge,
    title,
    desc,
  );

  if (earned) {
    const already = item.at < game.scenario.createdAt;
    append(
      card,
      el('div', { class: 'achievement-foot' },
        el('span', { class: 'achievement-date' }, already ? t('alreadyLived') : t('earnedOn', { date: formatDate(game.earned[item.id] ?? item.at, { short: true }) })),
        item.kind === 'custom'
          ? button('', { class: 'icon-button tiny', 'aria-label': t('deleteMilestone'), title: t('deleteMilestone'), onclick: () => onDelete(item.id) }, icon('trash', { size: 15 }))
          : null,
      ),
    );
  } else {
    const progress = achievementProgress(item, now);
    const fill = el('div', { class: 'progress-fill' });
    fill.style.width = `${progress}%`;
    append(
      card,
      el('div', { class: 'achievement-target' }, el('span', null, t('targetDate', { date: formatDate(item.at, { short: true }) })), el('span', null, formatPercent(progress, 0))),
      el('div', { class: 'progress tiny', role: 'progressbar', 'aria-label': t('milestoneProgressLabel', { title: item.title }), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': progress.toFixed(1) }, fill),
      item.kind === 'custom'
        ? button('', { class: 'icon-button tiny delete-locked', 'aria-label': t('deleteMilestone'), title: t('deleteMilestone'), onclick: () => onDelete(item.id) }, icon('trash', { size: 15 }))
        : null,
    );
  }

  return card;
}

export function renderMilestones({ game, onAddMilestone, onDeleteMilestone }) {
  const all = buildAchievements(game);
  const total = all.length;
  const unlocked = all.filter((item) => isEarned(game, item.id)).length;
  let filter = 'all';
  let query = '';

  const grid = el('div', { class: 'achievement-grid' });
  const summary = el('span', { class: 'collection-count' }, t('collectionSummary', { unlocked: formatNumber(unlocked), total: formatNumber(total) }));
  const countBadge = summary;

  const searchInput = el('input', {
    class: 'input search-input',
    type: 'search',
    placeholder: t('searchMilestones'),
    'aria-label': t('searchMilestones'),
    oninput: (event) => {
      query = event.target.value.trim().toLocaleLowerCase();
      draw();
    },
  });

  const filters = ['all', 'unlocked', 'ahead'].map((name) =>
    button(t(name === 'all' ? 'filterAll' : name === 'unlocked' ? 'filterUnlocked' : 'filterAhead'), {
      class: `filter${name === 'all' ? ' is-active' : ''}`,
      'aria-pressed': String(name === 'all'),
      onclick: (event) => {
        filter = name;
        for (const sibling of filters) {
          sibling.classList.toggle('is-active', sibling === event.currentTarget);
          sibling.setAttribute('aria-pressed', String(sibling === event.currentTarget));
        }
        draw();
      },
    }),
  );

  function draw() {
    clear(grid);
    const visible = sortAchievements(all, game).filter((item) => {
      if (filter === 'unlocked' && !isEarned(game, item.id)) return false;
      if (filter === 'ahead' && isEarned(game, item.id)) return false;
      if (query && !`${item.title} ${item.description}`.toLocaleLowerCase().includes(query)) return false;
      return true;
    });
    const currentUnlocked = all.filter((item) => isEarned(game, item.id)).length;
    countBadge.textContent = t('collectionSummary', { unlocked: formatNumber(currentUnlocked), total: formatNumber(total) });
    if (!visible.length) {
      const message = query
        ? t('emptySearch')
        : filter === 'unlocked'
          ? t('emptyUnlocked')
          : filter === 'ahead'
            ? t('emptyAhead')
            : t('emptyMilestones');
      grid.append(el('div', { class: 'empty-state' }, icon('milestones', { size: 26 }), el('p', null, message)));
      return;
    }
    for (const item of visible) grid.append(createCard(item, game, Date.now(), onDeleteMilestone));
  }

  draw();

  const node = el(
    'div',
    { class: 'view milestones-view' },
    el(
      'div',
      { class: 'page-head with-action' },
      el(
        'div',
        { class: 'page-head-copy' },
        el('div', { class: 'eyebrow' }, t('navMilestones')),
        el('h1', { class: 'page-title' }, t('milestonesTitle')),
        el('p', { class: 'page-sub' }, t('milestonesCopy')),
      ),
      button(t('addMilestone'), { class: 'btn btn-primary', onclick: onAddMilestone }, icon('plus', { size: 17 })),
    ),
    el(
      'div',
      { class: 'collection-toolbar' },
      el('div', { class: 'collection-heading' }, countBadge),
      el('div', { class: 'toolbar-controls' }, el('div', { class: 'filters', role: 'group', 'aria-label': t('filtersLabel') }, ...filters), el('div', { class: 'search-wrap' }, icon('search', { size: 16 }), searchInput)),
    ),
    grid,
  );

  return { node, tick() {} };
}
