import { DAY } from './constants.js';
import { anniversaryMs, birthMs } from './dates.js';
import { formatNumber } from './format.js';
import { t } from './i18n.js';

const TIME_DEFINITIONS = [
  { id: 'start', delay: 0, titleKey: 'timeMilestoneStartTitle', symbol: '✦', keyStart: true },
  { id: 'm1', delay: 60000, titleKey: 'timeMilestone1mTitle', symbol: '·' },
  { id: 'm10', delay: 600000, titleKey: 'timeMilestone10mTitle', symbol: 'Ⅱ' },
  { id: 'h1', delay: 3600000, titleKey: 'timeMilestone1hTitle', symbol: '◷' },
  { id: 'h6', delay: 21600000, titleKey: 'timeMilestone6hTitle', symbol: '◒' },
  { id: 'd1', delay: DAY, titleKey: 'timeMilestone1dTitle', symbol: '☀' },
  { id: 'd3', delay: 3 * DAY, titleKey: 'timeMilestone3dTitle', symbol: '≋' },
  { id: 'd7', delay: 7 * DAY, titleKey: 'timeMilestone1wTitle', symbol: '☼' },
  { id: 'd14', delay: 14 * DAY, titleKey: 'timeMilestone2wTitle', symbol: '⌁' },
  { id: 'd30', delay: 30 * DAY, titleKey: 'timeMilestone1moTitle', symbol: '☽' },
  { id: 'd90', delay: 90 * DAY, titleKey: 'timeMilestone3moTitle', symbol: '❋' },
  { id: 'd182', delay: 182 * DAY, titleKey: 'timeMilestone6moTitle', symbol: '◐' },
  { id: 'd365', delay: 365 * DAY, titleKey: 'timeMilestone1yTitle', symbol: '◎' },
  { id: 'd730', delay: 730 * DAY, titleKey: 'timeMilestone2yTitle', symbol: '∞' },
  { id: 'd1826', delay: 1826 * DAY, titleKey: 'timeMilestone5yTitle', symbol: '✧' },
  { id: 'd3652', delay: 3652 * DAY, titleKey: 'timeMilestone10yTitle', symbol: '✺' },
  { id: 'd7305', delay: 7305 * DAY, titleKey: 'timeMilestone20yTitle', symbol: '✶' },
];

const LIFE_DAYS = [1000, 5000, 10000, 15000, 20000, 25000, 30000];
const BIRTHDAY_AGES = [18, 21, 25, 30, 40, 50, 60, 70, 80, 90, 100];
const SCENARIO_PERCENTS = [10, 25, 50, 75, 90];

export function buildAchievements(game) {
  if (!game) return [];
  const birth = birthMs(game.profile.birth);
  const created = game.scenario.createdAt;
  const list = TIME_DEFINITIONS.map((item) => ({
    id: `game-${item.id}`,
    at: created + item.delay,
    start: created,
    title: t(item.titleKey),
    description: t(item.keyStart ? 'timeMilestoneStartDesc' : 'timeMilestoneDesc'),
    symbol: item.symbol,
    kind: 'time',
  }));

  for (const days of LIFE_DAYS) {
    list.push({
      id: `life-${days}`,
      at: birth + days * DAY,
      start: birth,
      title: t('lifeDaysTitle', { amount: formatNumber(days) }),
      description: t('lifeDaysDesc'),
      symbol: '✹',
      kind: 'life',
    });
  }

  for (const age of BIRTHDAY_AGES) {
    list.push({
      id: `birthday-${age}`,
      at: anniversaryMs(game.profile.birth, age),
      start: birth,
      title: t('birthdayTitle', { age: formatNumber(age) }),
      description: t('birthdayDesc'),
      symbol: '✳',
      kind: 'birthday',
    });
  }

  for (const percent of SCENARIO_PERCENTS) {
    list.push({
      id: `scenario-${percent}`,
      at: created + (game.scenario.endpoint - created) * (percent / 100),
      start: created,
      title: t('scenarioPercentTitle', { percent: formatNumber(percent) }),
      description: t('scenarioPercentDesc'),
      symbol: '◇',
      kind: 'scenario',
    });
  }

  list.push({
    id: 'overtime',
    at: game.scenario.endpoint,
    start: created,
    title: t('overtimeMilestoneTitle'),
    description: t('overtimeMilestoneDesc'),
    symbol: '↗',
    kind: 'scenario',
  });

  for (const milestone of game.customMilestones ?? []) {
    list.push({
      id: milestone.id,
      at: milestone.at,
      start: created,
      title: milestone.title,
      description: milestone.note || t('customMilestoneFallback'),
      symbol: '◆',
      kind: 'custom',
    });
  }

  return list;
}

export function isEarned(game, id) {
  return Object.prototype.hasOwnProperty.call(game?.earned ?? {}, id);
}

export function earnedCount(game) {
  return Object.keys(game?.earned ?? {}).length;
}

export function syncAchievements(game, now = Date.now()) {
  const fresh = [];
  for (const item of buildAchievements(game)) {
    if (item.at <= now && !isEarned(game, item.id)) {
      game.earned[item.id] = Math.max(game.scenario.createdAt, item.at);
      fresh.push(item);
    }
  }
  return fresh;
}

export function nextAchievement(game, now = Date.now()) {
  return buildAchievements(game)
    .filter((item) => !isEarned(game, item.id))
    .sort((a, b) => a.at - b.at)[0] ?? null;
}

export function achievementProgress(item, now = Date.now()) {
  if (!item || item.at <= item.start) return 100;
  return Math.min(100, Math.max(0, ((now - item.start) / (item.at - item.start)) * 100));
}

export function sortAchievements(items, game) {
  return [...items].sort((a, b) => {
    const ae = isEarned(game, a.id);
    const be = isEarned(game, b.id);
    if (ae !== be) return ae ? -1 : 1;
    return a.at - b.at;
  });
}
