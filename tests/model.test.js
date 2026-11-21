import { describe, expect, it } from 'vitest';
import { expectedRemaining, lifestyleModifier, scenarioFor } from '../src/core/model.js';
import { DEFAULT_HABITS, habitPoints, HABITS } from '../src/data/habits.js';
import { BASELINES, findBaseline } from '../src/data/baselines.js';

const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime();

describe('scenario model', () => {
  it('keeps life expectancy close to the population baseline at birth', () => {
    expect(expectedRemaining(0, 'male', 79.4)).toBeCloseTo(79.4, 0);
    expect(expectedRemaining(0, 'female', 84.4)).toBeCloseTo(84.4, 0);
  });

  it('is age-aware', () => {
    expect(expectedRemaining(65, 'male', 79.4)).toBeGreaterThan(15);
    expect(expectedRemaining(65, 'male', 79.4)).toBeLessThan(22);
  });

  it('creates a fixed, valid scenario endpoint', () => {
    const scenario = scenarioFor(
      { birth: '1990-05-12', sex: 'female', baselineId: 'GR', habits: DEFAULT_HABITS },
      NOW,
    );
    expect(scenario.endpoint).toBeGreaterThan(NOW);
    expect(scenario.remainingYears).toBeGreaterThan(10);
    expect(scenario.remainingYears).toBeLessThan(100);
    expect(scenario.ageAtStart).toBeCloseTo(35.68, 1);
  });

  it('only lets habits nudge the fictional baseline', () => {
    expect(lifestyleModifier(0)).toBe(1);
    expect(lifestyleModifier(12)).toBeGreaterThan(1);
    expect(lifestyleModifier(-26)).toBeLessThan(1);
    expect(lifestyleModifier(-100)).toBe(lifestyleModifier(-26));
    expect(lifestyleModifier(100)).toBe(lifestyleModifier(12));
  });

  it('has valid habit points and country data', () => {
    expect(habitPoints(DEFAULT_HABITS)).toBe(0);
    for (const habit of HABITS) {
      expect(habit.choices.length).toBeGreaterThan(1);
      expect(habit.choices.some((choice) => choice.points === 0)).toBe(true);
    }
    for (const baseline of BASELINES) {
      expect(findBaseline(baseline.id)).toBe(baseline);
      expect(baseline.e0.male).toBeGreaterThan(60);
      expect(baseline.e0.female).toBeGreaterThan(baseline.e0.male);
    }
  });
});
