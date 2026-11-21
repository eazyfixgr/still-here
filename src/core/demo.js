import { createGame } from './game.js';
import { DEFAULT_HABITS } from '../data/habits.js';
import { DAY } from './constants.js';
import { localDateString } from './dates.js';
import { syncAchievements } from './achievements.js';
import { t } from './i18n.js';

export function createDemo(settings, now = Date.now()) {
  const birth = new Date(now);
  birth.setFullYear(birth.getFullYear() - 30);
  birth.setMonth(4, 12);
  const game = createGame({ name: 'Alex', sex: 'midpoint', birth: localDateString(birth), baselineId: 'GR' }, { ...DEFAULT_HABITS }, settings, now - 8 * DAY);
  game.customMilestones.push({
    id: 'custom-demo-moment', title: t('demoMilestoneTitle'), note: t('demoMilestoneNote'),
    at: now + 30 * DAY, createdAt: game.scenario.createdAt,
  });
  game.capsules.push({
    id: 'capsule-demo-letter', title: t('demoCapsuleTitle'), message: t('demoCapsuleMessage'),
    openAt: now - DAY, createdAt: game.scenario.createdAt, openedAt: null,
  });
  game.meta.lastSeen = now;
  syncAchievements(game, now);
  return game;
}
