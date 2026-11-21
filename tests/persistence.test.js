import { describe, expect, it } from 'vitest';
import { createLocalPersistence } from '../src/core/persistence.js';
import { createGame } from '../src/core/game.js';
import { DEFAULT_HABITS } from '../src/data/habits.js';
import { GAME_KEY, LEGACY_KEY, PREFS_KEY } from '../src/core/constants.js';

const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime();

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

function makeGame() {
  return createGame(
    { name: 'Alex', sex: 'female', birth: '1990-05-12', baselineId: 'GR' },
    DEFAULT_HABITS,
    { locale: 'el', theme: 'light', showSeconds: false },
    NOW,
  );
}

describe('local persistence', () => {
  it('stores and reads preferences', () => {
    const storage = memoryStorage();
    const persistence = createLocalPersistence(storage, () => NOW);
    expect(persistence.savePrefs({ locale: 'el', theme: 'light' })).toBe(true);
    expect(persistence.loadPrefs()).toEqual({ locale: 'el', theme: 'light' });
  });

  it('round-trips a saved game', () => {
    const storage = memoryStorage();
    const persistence = createLocalPersistence(storage, () => NOW);
    const game = makeGame();
    expect(persistence.saveGame(game)).toBe(true);
    const loaded = persistence.loadGame();
    expect(loaded.error).toBeNull();
    expect(loaded.state.profile.name).toBe('Alex');
    expect(loaded.state.settings.locale).toBe('el');
  });

  it('migrates a legacy prototype save', () => {
    const legacy = {
      version: 1,
      model: 'gompertz-game-v1',
      sex: 'male',
      birth: '1990-05-12',
      habits: { smoking: 0, alcohol: 0, diet: 1, activity: 1, sleep: 1 },
      createdAt: NOW - 1000,
      endpoint: NOW + 40 * 365.2425 * 86400000,
      lastSeen: NOW - 500,
      earned: {},
    };
    const storage = memoryStorage({ [LEGACY_KEY]: JSON.stringify(legacy) });
    const persistence = createLocalPersistence(storage, () => NOW);
    const loaded = persistence.loadGame();
    expect(loaded.migrated).toBe(true);
    expect(loaded.state.profile.birth).toBe('1990-05-12');
    expect(storage.getItem(GAME_KEY)).toBeTruthy();
  });

  it('reports corrupt saves and storage failures', () => {
    const storage = memoryStorage({ [GAME_KEY]: '{broken' });
    const persistence = createLocalPersistence(storage, () => NOW);
    expect(persistence.loadGame().error).toBe('corruptSave');

    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {},
    };
    const unavailable = createLocalPersistence(broken, () => NOW);
    expect(unavailable.loadGame().error).toBe('storageError');
    expect(unavailable.saveGame(makeGame())).toBe(false);
  });

  it('keeps preferences when the journey is reset', () => {
    const storage = memoryStorage();
    const persistence = createLocalPersistence(storage, () => NOW);
    persistence.savePrefs({ locale: 'el', theme: 'dark' });
    persistence.saveGame(makeGame());
    persistence.clear();
    expect(storage.getItem(GAME_KEY)).toBeNull();
    expect(JSON.parse(storage.getItem(PREFS_KEY)).locale).toBe('el');
  });
});
