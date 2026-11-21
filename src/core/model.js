import { YEAR } from './constants.js';
import { birthMs, validBirth } from './dates.js';
import { findBaseline } from '../data/baselines.js';
import { HABIT_POINT_DIVISOR, habitPoints } from '../data/habits.js';

const EULER_GAMMA = 0.5772156649015329;
const SHAPE = {
  male: 11.14235873075077,
  female: 9.86572917450873,
  midpoint: (11.14235873075077 + 9.86572917450873) / 2,
};

export function shapeFor(sex) {
  return SHAPE[sex] ?? SHAPE.midpoint;
}

export function baselineE0(baseline, sex) {
  if (!baseline) return NaN;
  if (sex === 'male' || sex === 'female') return baseline.e0[sex];
  return (baseline.e0.male + baseline.e0.female) / 2;
}

export function expectedRemaining(age, sex, e0) {
  const b = shapeFor(sex);
  const a = -(e0 / b + Math.log(b) + EULER_GAMMA);
  const hazard = Math.exp(a + age / b) * b;
  const dt = 1 / 12;
  let result = 0;
  let previous = 1;
  for (let i = 1; i <= 2400; i += 1) {
    const survival = Math.exp(-hazard * Math.expm1((i * dt) / b));
    result += ((previous + survival) * dt) / 2;
    previous = survival;
    if (survival < 1e-12) break;
  }
  return result;
}

export function lifestyleModifier(points) {
  const safe = Math.max(-26, Math.min(12, points));
  return Math.exp(safe / HABIT_POINT_DIVISOR);
}

export function scenarioFor({ birth, sex, baselineId, habits }, now = Date.now()) {
  if (!validBirth(birth, now)) {
    throw new Error('invalid-birth');
  }
  const baseline = findBaseline(baselineId);
  if (!baseline) {
    throw new Error('invalid-baseline');
  }
  const age = (now - birthMs(birth)) / YEAR;
  const e0 = baselineE0(baseline, sex);
  const baselineYears = expectedRemaining(age, sex, e0);
  const points = habitPoints(habits);
  const modifier = lifestyleModifier(points);
  const remainingYears = Math.max(0.03, baselineYears * modifier);
  return {
    remainingYears,
    baselineYears,
    points,
    modifier,
    e0,
    ageAtStart: age,
    endpoint: now + remainingYears * YEAR,
    createdAt: now,
  };
}

export function previewScenario(profile, habits, now = Date.now()) {
  return scenarioFor({ ...profile, habits }, now);
}
