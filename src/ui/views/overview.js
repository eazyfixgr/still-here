import { button, el } from '../dom.js';
import { icon } from '../icons.js';
import { createCountdown, updateCountdown } from '../countdown.js';
import { t } from '../../core/i18n.js';
import { DAY, YEAR } from '../../core/constants.js';
import { ageAt, birthMs, calendarParts, daysUntil, nextBirthdayMs } from '../../core/dates.js';
import {
  achievementProgress,
  earnedCount,
  nextAchievement,
} from '../../core/achievements.js';
import { nextSealedCapsule } from '../../core/game.js';
import { lifeInNumbers, momentFor, validMomentDate, yearInDays } from '../../core/moments.js';
import {
  baselineLabel,
  clamp,
  formatDate,
  formatNumber,
  formatPercent,
  formatShortDuration,
} from '../../core/format.js';
import { firstName } from '../../core/format.js';

function progressCard(game, now) {
  const birthMsValue = birthMs(game.profile.birth);
  const percentage = clamp(
    ((now - birthMsValue) / (game.scenario.endpoint - birthMsValue)) * 100,
    0,
    100,
  );
  const percent = el('span', { class: 'percent-value' }, formatPercent(percentage));
  const fill = el('div', { class: 'progress-fill' });
  fill.style.width = `${percentage}%`;
  const days = el('strong', null, formatNumber(Math.max(0, Math.floor((now - birthMsValue) / DAY))));
  const gameDays = el('strong', null, formatNumber(Math.max(0, Math.floor((now - game.scenario.createdAt) / DAY))));
  const earned = el('strong', null, formatNumber(earnedCount(game)));
  const progressbar = el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': t('progressLabel'), 'aria-valuenow': percentage.toFixed(2) }, fill);
  return {
    node: el(
      'article',
      { class: 'card progress-card' },
      el('div', { class: 'card-head' }, el('h2', null, t('timelineProgress')), percent),
      progressbar,
      el(
        'div',
        { class: 'progress-labels' },
        el('span', null, t('bornOn', { date: formatDate(birthMsValue, { short: true }) })),
        el('span', null, t('progressEnd')),
      ),
      el(
        'div',
        { class: 'stat-grid' },
        el('div', null, days, el('span', null, t('statDaysLived'))),
        el('div', null, gameDays, el('span', null, t('statGameDays'))),
        el('div', null, earned, el('span', null, t('statMilestones'))),
      ),
    ),
    tick(nextNow) {
      const nextPercentage = clamp(
        ((nextNow - birthMsValue) / (game.scenario.endpoint - birthMsValue)) * 100,
        0,
        100,
      );
      percent.textContent = formatPercent(nextPercentage);
      fill.style.width = `${nextPercentage}%`;
      progressbar.setAttribute('aria-valuenow', nextPercentage.toFixed(2));
      days.textContent = formatNumber(Math.max(0, Math.floor((nextNow - birthMsValue) / DAY)));
      gameDays.textContent = formatNumber(Math.max(0, Math.floor((nextNow - game.scenario.createdAt) / DAY)));
    },
  };
}

function nextMilestoneCard(game, now) {
  const next = nextAchievement(game, now);
  if (!next) {
    return {
      node: el(
        'article',
        { class: 'card next-card' },
        el('div', { class: 'card-head' }, el('h2', null, t('upNext')), el('span', { class: 'pill muted-pill' }, t('nextMilestone'))),
        el('p', { class: 'empty-copy' }, t('noNextMilestone')),
      ),
      tick() {},
    };
  }
  const progress = achievementProgress(next, now);
  const fill = el('div', { class: 'progress-fill' });
  fill.style.width = `${progress}%`;
  const remaining = el('span', null, formatShortDuration(next.at - now));
  const percent = el('span', null, formatPercent(progress, 1));
  return {
    node: el(
      'article',
      { class: 'card next-card' },
      el(
        'div',
        { class: 'card-head' },
        el('h2', null, t('upNext')),
        el('span', { class: 'pill accent-pill' }, t('nextMilestone')),
      ),
      el(
        'div',
        { class: 'next-body' },
        el('div', { class: 'symbol-badge', 'aria-hidden': 'true' }, next.symbol),
        el('div', { class: 'next-copy' }, el('h3', null, next.title), el('p', null, next.description)),
      ),
      el('div', { class: 'progress small' }, fill),
      el('div', { class: 'next-foot' }, remaining, percent),
    ),
    tick(nextNow) {
      const nextProgress = achievementProgress(next, nextNow);
      fill.style.width = `${nextProgress}%`;
      remaining.textContent = formatShortDuration(Math.max(0, next.at - nextNow));
      percent.textContent = formatPercent(nextProgress, 1);
    },
  };
}

function capsuleCard(game, now) {
  const capsule = nextSealedCapsule(game);
  if (!capsule) {
    return {
      node: el(
        'article',
        { class: 'card capsule-preview' },
        el('div', { class: 'card-head' }, el('h2', null, t('navCapsules')), icon('capsules', { size: 19 })),
        el('p', { class: 'empty-copy' }, t('noCapsulesYet')),
        el('a', { class: 'btn btn-ghost btn-small', href: '#/capsules' }, t('sealCapsule')),
      ),
      tick() {},
    };
  }
  const isReady = capsule.openAt <= now;
  const timeLabel = el(
    'span',
    { class: `capsule-time${isReady ? ' is-ready' : ''}` },
    isReady ? t('capsuleReady') : t('opensIn', { time: formatShortDuration(capsule.openAt - now) }),
  );
  const statusPill = el('span', { class: 'pill' }, isReady ? t('readyLabel') : t('sealedLabel'));
  const ctaLabel = el('span', null, isReady ? t('openNow') : t('openCapsules'));
  return {
    node: el(
      'article',
      { class: 'card capsule-preview' },
      el('div', { class: 'card-head' }, el('h2', null, t('nextCapsule')), statusPill),
      el('h3', { class: 'capsule-title' }, capsule.title),
      el('p', { class: 'capsule-date' }, t('opensOn', { date: formatDate(capsule.openAt) })),
      timeLabel,
      el('a', { class: 'btn btn-ghost btn-small', href: '#/capsules' }, ctaLabel, icon('arrow', { size: 15 })),
    ),
    tick(nextNow) {
      const ready = capsule.openAt <= nextNow;
      timeLabel.classList.toggle('is-ready', ready);
      timeLabel.textContent = ready
        ? t('capsuleReady')
        : t('opensIn', { time: formatShortDuration(capsule.openAt - nextNow) });
      statusPill.textContent = ready ? t('readyLabel') : t('sealedLabel');
      ctaLabel.textContent = ready ? t('openNow') : t('openCapsules');
    },
  };
}

function dailyQuestionCard(game, sharedMomentDate, onShare, onSaveReflection, onOpenArchive) {
  const date = validMomentDate(sharedMomentDate) ? sharedMomentDate : null;
  const moment = momentFor(date ?? undefined);
  const shared = Boolean(date);
  const existing = game.reflections?.[moment.date] ?? '';
  const answerCount = Object.keys(game.reflections ?? {}).length;
  const textarea = el('textarea', {
    id: 'daily-reflection',
    class: 'input textarea reflection-input',
    maxlength: '1000',
    rows: '3',
    placeholder: t('reflectionPlaceholder'),
    value: existing,
  });
  const form = el(
    'form',
    {
      class: 'reflection-form',
      onsubmit: (event) => {
        event.preventDefault();
        onSaveReflection(moment.date, textarea.value);
      },
    },
    el('label', { class: 'sr-only', for: 'daily-reflection' }, t('reflectionSummary')),
    textarea,
    el(
      'div',
      { class: 'reflection-actions' },
      el('span', { class: 'reflection-hint' }, icon('lock', { size: 14 }), t('reflectionHint')),
      button(t('saveReflection'), { class: 'btn btn-ghost btn-small', type: 'submit' }, icon('check', { size: 15 })),
    ),
  );
  return el(
    'section',
    { class: 'card daily-card' },
    el(
      'div',
      { class: 'daily-card-head' },
      el('div', { class: 'eyebrow' }, t(shared ? 'sharedMomentEyebrow' : 'momentEyebrow')),
      shared ? el('span', { class: 'pill accent-pill' }, t('momentShared')) : el('span', { class: 'daily-date' }, formatDate(new Date(`${moment.date}T12:00:00`).getTime(), { short: true })),
    ),
    el('blockquote', { class: 'daily-question' }, t(moment.key)),
    el(
      'div',
      { class: 'daily-card-foot' },
      el('p', null, t('momentCopy')),
      el(
        'div',
        { class: 'daily-actions' },
        answerCount > 0
          ? button(`${t('pastAnswers')} (${formatNumber(answerCount)})`, { class: 'btn btn-ghost btn-small', onclick: onOpenArchive }, icon('capsules', { size: 15 }))
          : null,
        button(t('momentShare'), { class: 'btn btn-ghost btn-small', onclick: () => onShare({ kind: 'moment', momentDate: moment.date }) }, icon('share', { size: 15 })),
      ),
    ),
    el(
      'details',
      { class: 'reflection-box', open: Boolean(existing) },
      el('summary', null, icon(existing ? 'check' : 'lock', { size: 15 }), t(existing ? 'reflectionSummary' : 'reflectionSummaryEmpty')),
      form,
    ),
  );
}

function lifeNumbersCard(game, now, onShare) {
  const numbers = lifeInNumbers(game.profile.birth, now);
  return el(
    'article',
    { class: 'card numbers-card' },
    el('div', { class: 'eyebrow' }, t('perspectiveEyebrow')),
    el('h2', null, t('lifeNumbersTitle')),
    el('p', { class: 'muted-copy' }, t('lifeNumbersCopy')),
    el(
      'div',
      { class: 'numbers-grid' },
      el('div', null, el('strong', null, formatNumber(numbers.days)), el('span', null, t('metricDays'))),
      el('div', null, el('strong', null, formatNumber(numbers.weeks)), el('span', null, t('metricWeeks'))),
      el('div', null, el('strong', null, formatNumber(numbers.days * 24)), el('span', null, t('metricHours'))),
      el('div', { class: 'numbers-next' },
        el('strong', null, t('lifeNextRoundValue', { days: formatNumber(numbers.daysToRound) })),
        el('span', null, t('lifeNextRound')),
        el('small', null, t('lifeNextRoundDate', { date: formatDate(numbers.roundDate, { short: true }) })),
      ),
    ),
    button(t('shareDaysButton'), { class: 'btn btn-primary btn-small', onclick: () => onShare({ kind: 'days' }) }, icon('share', { size: 15 })),
  );
}

function yearMosaicCard(now) {
  const info = yearInDays(now);
  const grid = el('div', { class: 'year-mosaic', role: 'img', 'aria-label': t('yearMosaicAria', { day: formatNumber(info.day), total: formatNumber(info.total), year: formatNumber(info.year) }) });
  for (let day = 1; day <= info.total; day += 1) {
    const state = day < info.day ? 'is-past' : day === info.day ? 'is-today' : 'is-future';
    grid.append(el('span', { class: `mosaic-dot ${state}`, 'aria-hidden': 'true' }));
  }
  return el(
    'article',
    { class: 'card mosaic-card' },
    el('div', { class: 'eyebrow' }, t('perspectiveEyebrow')),
    el('h2', null, t('yearMosaicTitle')),
    el('p', { class: 'muted-copy' }, t('yearMosaicCopy')),
    grid,
    el(
      'div',
      { class: 'mosaic-legend' },
      el('span', null, el('i', { class: 'is-past', 'aria-hidden': 'true' }), t('yearMosaicPast')),
      el('span', null, el('i', { class: 'is-today', 'aria-hidden': 'true' }), t('yearMosaicToday')),
      el('span', null, el('i', { class: 'is-future', 'aria-hidden': 'true' }), t('yearMosaicAhead')),
      el('strong', null, t('yearMosaicDay', { day: formatNumber(info.day), total: formatNumber(info.total) })),
    ),
  );
}

function atAGlance(game, now) {
  const age = Math.floor(ageAt(now, game.profile.birth));
  const birthday = nextBirthdayMs(game.profile.birth, now);
  const birthdayDays = daysUntil(birthday, now);
  const birthdayValue = birthdayDays === 0
    ? t('nextBirthdayToday')
    : birthdayDays === 1
      ? t('nextBirthdayInOne')
      : t('nextBirthdayIn', { days: formatNumber(birthdayDays) });
  return el(
    'article',
    { class: 'card glance-card' },
    el('div', { class: 'card-head' }, el('h2', null, t('thisJourney')), el('span', { class: 'pill' }, t('savedLocally'))),
    el(
      'dl',
      { class: 'glance-list' },
      el('div', null, el('dt', null, t('statAge')), el('dd', null, t('profileAge', { age: formatNumber(age) }))),
      el('div', null, el('dt', null, t('statNextBirthday')), el('dd', null, birthdayValue)),
      el('div', null, el('dt', null, t('reviewBaseline')), el('dd', null, baselineLabel(game.profile.baselineId))),
      el('div', null, el('dt', null, t('startedOn')), el('dd', null, formatDate(game.scenario.createdAt, { short: true }))),
    ),
  );
}

export function renderOverview({ game, awayCount, showSeconds, sharedMomentDate, onShare, onSaveReflection, onOpenArchive, onAwayDismiss }) {
  const now = Date.now();
  const countdown = createCountdown(showSeconds);
  const title = el('h1', { class: 'page-title' }, game.profile.name ? t('greetingNamed', { name: firstName(game.profile.name) }) : t('greeting'));
  const countdownTitle = el('span', { class: 'eyebrow countdown-eyebrow' }, t('countdownTitle'));
  const endDate = el('strong', null, formatDate(game.scenario.endpoint));
  const ageAtEnd = el('span', null, t('scenarioAge', { age: formatNumber((game.scenario.endpoint - birthMs(game.profile.birth)) / YEAR, 1) }));
  const countdownCard = el(
    'section',
    { class: 'countdown-card' },
    el(
      'div',
      { class: 'countdown-head' },
      countdownTitle,
      el(
        'div',
        { class: 'countdown-tools' },
        el('span', { class: 'pill fictional-pill' }, t('fictional')),
        button(t('shareShort'), { class: 'btn btn-ghost btn-small countdown-share', onclick: () => onShare({ kind: 'days' }) }, icon('share', { size: 14 })),
      ),
    ),
    countdown,
    el(
      'div',
      { class: 'scenario-line' },
      el('span', null, t('scenarioEndsOn'), ' ', endDate),
      ageAtEnd,
    ),
    el('p', { class: 'model-note' }, t('countdownNote')),
  );

  const progress = progressCard(game, now);
  const next = nextMilestoneCard(game, now);
  const capsule = capsuleCard(game, now);
  const glance = atAGlance(game, now);
  const daily = dailyQuestionCard(game, sharedMomentDate, onShare, onSaveReflection, onOpenArchive);
  const numbers = lifeNumbersCard(game, now, onShare);
  const mosaic = yearMosaicCard(now);

  const away = awayCount > 0
    ? el(
        'div',
        { class: 'returning-banner', role: 'status' },
        el('span', { class: 'returning-icon' }, icon('milestones', { size: 17 })),
        el('span', null, awayCount === 1 ? t('awayNewMilestonesOne') : t('awayNewMilestonesMany', { count: formatNumber(awayCount) })),
        button(t('awayDismiss'), { class: 'text-button', onclick: onAwayDismiss }),
      )
    : null;

  const node = el(
    'div',
    { class: 'view overview-view' },
    el(
      'div',
      { class: 'page-head' },
      el('div', { class: 'page-head-copy' }, el('div', { class: 'eyebrow' }, t('yourTimeline')), title, el('p', { class: 'page-sub' }, t('overviewSub'))),
      el('span', { class: 'live-status' }, el('span', { class: 'dot', 'aria-hidden': 'true' }), t('clockRunning')),
    ),
    away,
    countdownCard,
    daily,
    el('div', { class: 'overview-grid' }, progress.node, next.node),
    el('div', { class: 'overview-grid lower' }, capsule.node, glance),
    el('div', { class: 'overview-grid perspective' }, numbers, mosaic),
  );

  function tick() {
    const current = Date.now();
    const overtime = current >= game.scenario.endpoint;
    countdownTitle.textContent = t(overtime ? 'overtimeTitle' : 'countdownTitle');
    const parts = calendarParts(overtime ? game.scenario.endpoint : current, overtime ? current : game.scenario.endpoint);
    updateCountdown(countdown, parts, showSeconds);
    progress.tick(current);
    next.tick(current);
    capsule.tick(current);
  }

  tick();
  return { node, tick };
}
