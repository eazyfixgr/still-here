import { APP_VERSION, GAME_MODEL, MAX_CAPSULES, MAX_CUSTOM_MILESTONES } from './constants.js';
import { birthMs, validBirth } from './dates.js';
import { scenarioFor, baselineE0, lifestyleModifier } from './model.js';
import { DEFAULT_HABITS, habitPoints } from '../data/habits.js';
import { DEFAULT_BASELINE, findBaseline } from '../data/baselines.js';
import { sanitizeGame, validateGame, validateLegacyGame } from './validation.js';

function createId(prefix) {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${suffix}`;
}

export function createGame(profile, habits, settings, now = Date.now()) {
  const cleanProfile = {
    name: String(profile.name || '').trim(),
    sex: profile.sex,
    birth: profile.birth,
    baselineId: profile.baselineId || DEFAULT_BASELINE,
  };
  const scenario = scenarioFor({ ...cleanProfile, habits }, now);
  return {
    version: APP_VERSION,
    model: GAME_MODEL,
    profile: cleanProfile,
    habits: { ...habits },
    scenario,
    earned: {},
    customMilestones: [],
    capsules: [],
    settings: {
      locale: settings.locale,
      theme: settings.theme,
      showSeconds: settings.showSeconds,
    },
    meta: {
      lastSeen: now,
    },
  };
}

export function migrateLegacyGame(legacy, prefs, now = Date.now()) {
  const habits = { ...DEFAULT_HABITS };
  for (const key of ['smoking', 'alcohol', 'diet', 'activity', 'sleep']) {
    const mapped = key === 'diet' ? 'nutrition' : key === 'activity' ? 'movement' : key;
    if (Number.isInteger(legacy.habits[key])) habits[mapped] = legacy.habits[key];
  }
  const profile = {
    name: '',
    sex: legacy.sex,
    birth: legacy.birth,
    baselineId: DEFAULT_BASELINE,
  };
  const points = habitPoints(habits);
  const modifier = lifestyleModifier(points);
  const remainingYears = (legacy.endpoint - legacy.createdAt) / (365.2425 * 86400000);
  const baseline = findBaseline(DEFAULT_BASELINE);
  return {
    version: APP_VERSION,
    model: GAME_MODEL,
    profile,
    habits,
    scenario: {
      createdAt: legacy.createdAt,
      endpoint: legacy.endpoint,
      baselineYears: remainingYears / modifier,
      remainingYears,
      points,
      modifier,
      e0: baselineE0(baseline, legacy.sex),
      ageAtStart: (legacy.createdAt - birthMs(legacy.birth)) / (365.2425 * 86400000),
    },
    earned: { ...legacy.earned },
    customMilestones: [],
    capsules: [],
    settings: {
      locale: prefs.locale,
      theme: prefs.theme,
      showSeconds: true,
    },
    meta: {
      lastSeen: Math.min(now, Math.max(legacy.lastSeen, legacy.createdAt)),
      legacy: true,
    },
  };
}

export function validateImport(raw, prefs, now = Date.now()) {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw.app === 'still-here' && raw.state ? raw.state : raw;
  if (validateGame(candidate, now)) return sanitizeGame(candidate);
  if (validateLegacyGame(candidate, now)) return migrateLegacyGame(candidate, prefs, now);
  return null;
}

export function exportPayload(game, now = Date.now()) {
  return {
    app: 'still-here',
    exportedAt: new Date(now).toISOString(),
    version: APP_VERSION,
    state: game,
  };
}

export function restampForImport(game, now = Date.now()) {
  const clean = sanitizeGame(game);
  clean.settings.locale = clean.settings.locale;
  clean.meta.lastSeen = now;
  return clean;
}

export function updateName(game, name, now = Date.now()) {
  const trimmed = String(name || '').trim();
  if (trimmed.length > 40) return false;
  game.profile.name = trimmed;
  game.meta.lastSeen = now;
  return true;
}

export function addCustomMilestone(game, { title, note, at }, now = Date.now()) {
  if (game.customMilestones.length >= MAX_CUSTOM_MILESTONES) return null;
  if (!validBirth(game.profile.birth, now)) return null;
  if (!Number.isFinite(at)) return null;
  if (at < birthMs(game.profile.birth) || at > now + 200 * 365.2425 * 86400000) return null;
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle || cleanTitle.length > 80) return null;
  const cleanNote = String(note || '').trim();
  if (cleanNote.length > 500) return null;
  const milestone = {
    id: createId('custom'),
    title: cleanTitle,
    note: cleanNote,
    at,
    createdAt: now,
  };
  game.customMilestones.push(milestone);
  game.meta.lastSeen = now;
  return milestone;
}

export function removeCustomMilestone(game, id, now = Date.now()) {
  const before = game.customMilestones.length;
  game.customMilestones = game.customMilestones.filter((milestone) => milestone.id !== id);
  if (game.customMilestones.length === before) return false;
  delete game.earned[id];
  game.meta.lastSeen = now;
  return true;
}

export function addCapsule(game, { title, message, openAt }, now = Date.now()) {
  if (game.capsules.length >= MAX_CAPSULES) return null;
  if (!Number.isFinite(openAt) || openAt < now + 60000) return null;
  const cleanTitle = String(title || '').trim();
  const cleanMessage = String(message || '').trim();
  if (!cleanTitle || cleanTitle.length > 80) return null;
  if (!cleanMessage || cleanMessage.length > 5000) return null;
  const capsule = {
    id: createId('capsule'),
    title: cleanTitle,
    message: cleanMessage,
    openAt,
    createdAt: now,
    openedAt: null,
  };
  game.capsules.push(capsule);
  game.meta.lastSeen = now;
  return capsule;
}

export function openCapsule(game, id, now = Date.now()) {
  const capsule = game.capsules.find((item) => item.id === id);
  if (!capsule || capsule.openAt > now) return null;
  if (!capsule.openedAt) capsule.openedAt = now;
  game.meta.lastSeen = now;
  return capsule;
}

export function removeCapsule(game, id, now = Date.now()) {
  const before = game.capsules.length;
  game.capsules = game.capsules.filter((capsule) => capsule.id !== id);
  if (game.capsules.length === before) return false;
  game.meta.lastSeen = now;
  return true;
}

export function capsulesDue(game, now = Date.now()) {
  return game.capsules.filter((capsule) => !capsule.openedAt && capsule.openAt <= now);
}

export function nextSealedCapsule(game) {
  return [...game.capsules]
    .filter((capsule) => !capsule.openedAt)
    .sort((a, b) => a.openAt - b.openAt)[0] ?? null;
}

export function createSettingsPrefs(settings) {
  return { locale: settings.locale, theme: settings.theme };
}
