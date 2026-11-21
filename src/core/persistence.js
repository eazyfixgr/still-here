import {
  DEFAULT_LOCALE,
  DEFAULT_THEME,
  GAME_KEY,
  LEGACY_KEY,
  PREFS_KEY,
  SAVE_LIMIT,
} from './constants.js';
import { isLanguage } from './i18n.js';
import { migrateLegacyGame } from './game.js';
import { sanitizeGame, validateGame, validateLegacyGame } from './validation.js';

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function defaultPrefs() {
  return { locale: DEFAULT_LOCALE, theme: DEFAULT_THEME };
}

export function createLocalPersistence(storage = defaultStorage(), clock = () => Date.now()) {
  let error = null;
  let lastSavedAt = 0;

  function fail(key = 'storageError') {
    error = key;
    return null;
  }

  function read(key) {
    if (!storage) return fail();
    try {
      return storage.getItem(key);
    } catch {
      return fail();
    }
  }

  function write(key, value) {
    if (!storage) return fail();
    try {
      storage.setItem(key, value);
      return true;
    } catch {
      return fail();
    }
  }

  function remove(key) {
    if (!storage) return fail();
    try {
      storage.removeItem(key);
      return true;
    } catch {
      return fail();
    }
  }

  function loadPrefs() {
    const raw = read(PREFS_KEY);
    if (!raw) return defaultPrefs();
    try {
      const parsed = JSON.parse(raw);
      return {
        locale: isLanguage(parsed?.locale) ? parsed.locale : DEFAULT_LOCALE,
        theme: parsed?.theme === 'light' || parsed?.theme === 'dark' ? parsed.theme : DEFAULT_THEME,
      };
    } catch {
      return defaultPrefs();
    }
  }

  function savePrefs(prefs) {
    const clean = {
      locale: isLanguage(prefs.locale) ? prefs.locale : DEFAULT_LOCALE,
      theme: prefs.theme === 'light' ? 'light' : DEFAULT_THEME,
    };
    return write(PREFS_KEY, JSON.stringify(clean));
  }

  function saveGame(game) {
    if (!game) return false;
    let serialized;
    try {
      serialized = JSON.stringify(game);
    } catch {
      return fail();
    }
    if (serialized.length > SAVE_LIMIT) return fail();
    const saved = write(GAME_KEY, serialized);
    if (saved) {
      lastSavedAt = clock();
      error = null;
    }
    return Boolean(saved);
  }

  function loadLegacy(prefs) {
    const raw = read(LEGACY_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!validateLegacyGame(parsed, clock())) return null;
      const migrated = migrateLegacyGame(parsed, prefs, clock());
      saveGame(migrated);
      return migrated;
    } catch {
      return null;
    }
  }

  function loadGame() {
    const prefs = loadPrefs();
    const raw = read(GAME_KEY);
    if (!raw) {
      const legacy = loadLegacy(prefs);
      if (legacy) return { state: legacy, migrated: true, error: null };
      return { state: null, migrated: false, error: error === 'storageError' ? error : null };
    }
    try {
      const parsed = JSON.parse(raw);
      if (!validateGame(parsed, clock())) {
        fail('corruptSave');
        return { state: null, migrated: false, error: 'corruptSave' };
      }
      return { state: sanitizeGame(parsed), migrated: false, error: null };
    } catch {
      fail('corruptSave');
      return { state: null, migrated: false, error: 'corruptSave' };
    }
  }

  function clear() {
    remove(GAME_KEY);
    remove(LEGACY_KEY);
    lastSavedAt = 0;
  }

  function getError() {
    return error;
  }

  function getLastSavedAt() {
    return lastSavedAt;
  }

  return {
    loadGame,
    saveGame,
    loadPrefs,
    savePrefs,
    clear,
    getError,
    getLastSavedAt,
  };
}
