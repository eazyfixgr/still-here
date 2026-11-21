import { describe, expect, it } from 'vitest';
import {
  addCapsule,
  addCustomMilestone,
  createGame,
  migrateLegacyGame,
  openCapsule,
  removeCustomMilestone,
  saveReflection,
  validateImport,
} from '../src/core/game.js';
import { DEFAULT_HABITS } from '../src/data/habits.js';
import { sanitizeGame, validateGame, validateLegacyGame } from '../src/core/validation.js';
import { syncAchievements } from '../src/core/achievements.js';

const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime();
const SETTINGS = { locale: 'en', theme: 'dark', showSeconds: true };

function makeGame() {
  return createGame(
    { name: 'Alex', sex: 'female', birth: '1990-05-12', baselineId: 'GR' },
    { ...DEFAULT_HABITS },
    SETTINGS,
    NOW,
  );
}

describe('game state', () => {
  it('creates a valid, savable journey', () => {
    const game = makeGame();
    expect(validateGame(game, NOW)).toBe(true);
    expect(game.profile.name).toBe('Alex');
    expect(game.earned).toEqual({});
  });

  it('records achievements even when time passed silently', () => {
    const game = makeGame();
    const fresh = syncAchievements(game, NOW);
    expect(fresh.length).toBeGreaterThan(0);
    expect(validateGame(game, NOW)).toBe(true);
  });

  it('keeps private daily answers without putting them in old saves', () => {
    const game = makeGame();
    expect(saveReflection(game, '2026-01-15', 'A private answer', NOW)).toBe(true);
    expect(game.reflections['2026-01-15']).toBe('A private answer');
    expect(validateGame(game, NOW)).toBe(true);
    expect(saveReflection(game, 'not-a-date', 'x', NOW)).toBe(false);
    saveReflection(game, '2026-01-15', '', NOW);
    expect(game.reflections['2026-01-15']).toBeUndefined();

    const older = makeGame();
    delete older.reflections;
    expect(validateGame(older, NOW)).toBe(true);
    expect(sanitizeGame(older).reflections).toEqual({});
  });

  it('adds and removes custom milestones', () => {
    const game = makeGame();
    const item = addCustomMilestone(game, {
      title: 'A quiet morning',
      note: 'Remember this.',
      at: NOW + 86400000,
    }, NOW);
    expect(item).not.toBeNull();
    expect(validateGame(game, NOW)).toBe(true);
    expect(removeCustomMilestone(game, item.id, NOW)).toBe(true);
    expect(game.customMilestones).toHaveLength(0);
  });

  it('seals, opens and validates capsules', () => {
    const game = makeGame();
    const capsule = addCapsule(game, {
      title: 'For later',
      message: 'Keep going.',
      openAt: NOW + 60000,
    }, NOW);
    expect(capsule).not.toBeNull();
    expect(validateGame(game, NOW)).toBe(true);
    expect(openCapsule(game, capsule.id, NOW + 60000)).not.toBeNull();
    expect(validateGame(game, NOW + 60000)).toBe(true);
  });

  it('migrates the v1 prototype save', () => {
    const legacy = {
      version: 1,
      model: 'gompertz-game-v1',
      sex: 'male',
      birth: '1990-05-12',
      habits: { smoking: 0, alcohol: 1, diet: 2, activity: 2, sleep: 1 },
      createdAt: NOW - 86400000,
      endpoint: NOW + 40 * 365.2425 * 86400000,
      lastSeen: NOW - 3600000,
      earned: { 'game-start': NOW - 86400000 },
    };
    expect(validateLegacyGame(legacy, NOW)).toBe(true);
    const migrated = migrateLegacyGame(legacy, { locale: 'en', theme: 'dark' }, NOW);
    expect(validateGame(migrated, NOW)).toBe(true);
    expect(migrated.profile.baselineId).toBe('GR');
    expect(migrated.habits.nutrition).toBe(2);
    expect(migrated.earned['game-start']).toBe(NOW - 86400000);
  });

  it('accepts wrapped, raw and legacy imports', () => {
    const game = makeGame();
    expect(validateImport({ app: 'still-here', state: game }, SETTINGS, NOW)).not.toBeNull();
    expect(validateImport(game, SETTINGS, NOW)).not.toBeNull();
    expect(validateImport({ version: 1 }, SETTINGS, NOW)).toBeNull();
  });
});
