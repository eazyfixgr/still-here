import {
  APP_VERSION,
  GAME_MODEL,
  MAX_CAPSULES,
  MAX_CUSTOM_MILESTONES,
  MAX_MESSAGE,
  MAX_NAME,
  MAX_NOTE,
  MAX_REFLECTION,
  MAX_REFLECTIONS,
  MAX_TITLE,
  YEAR,
} from './constants.js';
import { validBirth } from './dates.js';
import { isValidHabitValue, HABITS } from '../data/habits.js';
import { findBaseline } from '../data/baselines.js';
import { isLanguage } from './i18n.js';
import { validMomentDate } from './moments.js';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isText(value, min, max) {
  return typeof value === 'string' && value.length >= min && value.length <= max;
}

function uniqueIds(items) {
  return new Set(items.map((item) => item.id)).size === items.length;
}

function validMilestone(milestone, birth, now) {
  return (
    isObject(milestone) &&
    isText(milestone.id, 8, 80) &&
    /^custom-[A-Za-z0-9-]+$/.test(milestone.id) &&
    isText(milestone.title, 1, MAX_TITLE) &&
    isText(milestone.note ?? '', 0, MAX_NOTE) &&
    isFiniteNumber(milestone.at) &&
    milestone.at >= birth &&
    milestone.at <= now + 200 * YEAR &&
    isFiniteNumber(milestone.createdAt) &&
    milestone.createdAt >= birth &&
    milestone.createdAt <= now + 60000
  );
}

function validCapsule(capsule, now) {
  return (
    isObject(capsule) &&
    isText(capsule.id, 9, 80) &&
    /^capsule-[A-Za-z0-9-]+$/.test(capsule.id) &&
    isText(capsule.title, 1, MAX_TITLE) &&
    isText(capsule.message, 1, MAX_MESSAGE) &&
    isFiniteNumber(capsule.openAt) &&
    capsule.openAt <= now + 200 * YEAR &&
    isFiniteNumber(capsule.createdAt) &&
    capsule.createdAt <= now + 60000 &&
    (capsule.openedAt === null || isFiniteNumber(capsule.openedAt)) &&
    (capsule.openedAt === null || capsule.openedAt >= capsule.createdAt)
  );
}

export function validateGame(game, now = Date.now()) {
  if (!isObject(game) || game.version !== APP_VERSION || game.model !== GAME_MODEL) return false;
  if (!isObject(game.profile) || !isObject(game.habits) || !isObject(game.scenario)) return false;
  if (!isObject(game.earned) || Array.isArray(game.earned)) return false;
  if (!Array.isArray(game.customMilestones) || !Array.isArray(game.capsules)) return false;
  if (!isObject(game.settings) || !isObject(game.meta)) return false;
  if (game.reflections !== undefined && !isObject(game.reflections)) return false;

  const profile = game.profile;
  if (typeof profile.name !== 'string' || profile.name.length > MAX_NAME) return false;
  if (!['male', 'female', 'midpoint'].includes(profile.sex)) return false;
  if (!validBirth(profile.birth, now)) return false;
  if (!findBaseline(profile.baselineId)) return false;

  for (const habit of HABITS) {
    if (!isValidHabitValue(habit.id, game.habits[habit.id])) return false;
  }

  const scenario = game.scenario;
  if (!isFiniteNumber(scenario.createdAt) || scenario.createdAt <= 0 || scenario.createdAt > now + 60000) return false;
  if (scenario.createdAt < validBirthDateMs(profile.birth)) return false;
  if (!isFiniteNumber(scenario.endpoint) || scenario.endpoint <= scenario.createdAt) return false;
  if (scenario.endpoint > scenario.createdAt + 200 * YEAR) return false;
  if (!isFiniteNumber(scenario.baselineYears) || scenario.baselineYears < 0 || scenario.baselineYears > 200) return false;
  if (!isFiniteNumber(scenario.remainingYears) || scenario.remainingYears <= 0 || scenario.remainingYears > 200) return false;
  if (!isFiniteNumber(scenario.modifier) || scenario.modifier < 0.1 || scenario.modifier > 10) return false;
  if (!isFiniteNumber(scenario.points) || scenario.points < -100 || scenario.points > 100) return false;
  if (!isFiniteNumber(scenario.e0) || scenario.e0 < 30 || scenario.e0 > 120) return false;
  if (!isFiniteNumber(scenario.ageAtStart) || scenario.ageAtStart < 0 || scenario.ageAtStart > 120) return false;

  const entries = Object.entries(game.earned);
  if (entries.length > 500) return false;
  for (const [id, value] of entries) {
    if (typeof id !== 'string' || id.length === 0 || id.length > 80) return false;
    if (!isFiniteNumber(value) || value < game.scenario.createdAt || value > now + 60000) return false;
  }

  if (game.customMilestones.length > MAX_CUSTOM_MILESTONES) return false;
  for (const milestone of game.customMilestones) {
    if (!validMilestone(milestone, validBirthDateMs(profile.birth), now)) return false;
  }
  if (!uniqueIds(game.customMilestones)) return false;

  if (game.capsules.length > MAX_CAPSULES) return false;
  for (const capsule of game.capsules) {
    if (!validCapsule(capsule, now)) return false;
  }
  if (!uniqueIds(game.capsules)) return false;

  const reflections = Object.entries(game.reflections ?? {});
  if (reflections.length > MAX_REFLECTIONS) return false;
  for (const [date, text] of reflections) {
    if (!validMomentDate(date) || !isText(text, 0, MAX_REFLECTION)) return false;
  }

  if (!isLanguage(game.settings.locale)) return false;
  if (!['dark', 'light'].includes(game.settings.theme)) return false;
  if (typeof game.settings.showSeconds !== 'boolean') return false;
  if (!isFiniteNumber(game.meta.lastSeen) || game.meta.lastSeen < game.scenario.createdAt || game.meta.lastSeen > now + 60000) return false;
  if (game.meta.legacy !== undefined && typeof game.meta.legacy !== 'boolean') return false;

  return true;
}

export function validBirthDateMs(birth) {
  const [year, month, day] = birth.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
}

export function sanitizeGame(game) {
  const profile = {
    name: String(game.profile.name || '').trim().slice(0, MAX_NAME),
    sex: game.profile.sex,
    birth: game.profile.birth,
    baselineId: game.profile.baselineId,
  };
  const habits = Object.fromEntries(HABITS.map((habit) => [habit.id, game.habits[habit.id]]));
  const scenario = {
    createdAt: game.scenario.createdAt,
    endpoint: game.scenario.endpoint,
    baselineYears: game.scenario.baselineYears,
    remainingYears: game.scenario.remainingYears,
    points: game.scenario.points,
    modifier: game.scenario.modifier,
    e0: game.scenario.e0,
    ageAtStart: game.scenario.ageAtStart,
  };
  const earned = Object.fromEntries(
    Object.entries(game.earned)
      .filter(([id, value]) => typeof id === 'string' && Number.isFinite(value))
      .map(([id, value]) => [id, value]),
  );
  const customMilestones = game.customMilestones.map((milestone) => ({
    id: milestone.id,
    title: milestone.title,
    note: milestone.note || '',
    at: milestone.at,
    createdAt: milestone.createdAt,
  }));
  const capsules = game.capsules.map((capsule) => ({
    id: capsule.id,
    title: capsule.title,
    message: capsule.message,
    openAt: capsule.openAt,
    createdAt: capsule.createdAt,
    openedAt: capsule.openedAt ?? null,
  }));
  const reflections = Object.fromEntries(
    Object.entries(game.reflections ?? {})
      .filter(([date, text]) => validMomentDate(date) && typeof text === 'string')
      .map(([date, text]) => [date, text.slice(0, MAX_REFLECTION)]),
  );
  return {
    version: APP_VERSION,
    model: GAME_MODEL,
    profile,
    habits,
    scenario,
    earned,
    customMilestones,
    capsules,
    reflections,
    settings: {
      locale: game.settings.locale,
      theme: game.settings.theme,
      showSeconds: game.settings.showSeconds,
    },
    meta: {
      lastSeen: game.meta.lastSeen,
      ...(game.meta.legacy ? { legacy: true } : {}),
    },
  };
}

export function validateLegacyGame(game, now = Date.now()) {
  if (!isObject(game) || game.version !== 1 || game.model !== 'gompertz-game-v1') return false;
  if (!['male', 'female'].includes(game.sex)) return false;
  if (!validBirth(game.birth, now)) return false;
  if (!isObject(game.habits) || !isObject(game.earned)) return false;
  const legacyHabits = [
    ['smoking', 4],
    ['alcohol', 4],
    ['diet', 4],
    ['activity', 4],
    ['sleep', 3],
  ];
  for (const [id, choices] of legacyHabits) {
    if (!Number.isInteger(game.habits[id]) || game.habits[id] < 0 || game.habits[id] >= choices) {
      return false;
    }
  }
  if (!isFiniteNumber(game.createdAt) || game.createdAt > now + 60000) return false;
  if (game.createdAt < validBirthDateMs(game.birth)) return false;
  if (!isFiniteNumber(game.endpoint) || game.endpoint <= game.createdAt) return false;
  if (game.endpoint > game.createdAt + 200 * YEAR) return false;
  if (!isFiniteNumber(game.lastSeen) || game.lastSeen < game.createdAt || game.lastSeen > now + 60000) return false;
  return Object.entries(game.earned).every(
    ([id, value]) =>
      typeof id === 'string' &&
      id.length > 0 &&
      id.length <= 80 &&
      isFiniteNumber(value) &&
      value >= game.createdAt &&
      value <= now + 60000,
  );
}
