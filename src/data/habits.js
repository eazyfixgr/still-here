export const HABITS = [
  {
    id: 'smoking',
    labelKey: 'habitSmoking',
    choices: [
      { labelKey: 'smokingNever', points: 0 },
      { labelKey: 'smokingFormer', points: -2 },
      { labelKey: 'smokingSome', points: -5 },
      { labelKey: 'smokingDaily', points: -8 },
    ],
    initial: 0,
  },
  {
    id: 'alcohol',
    labelKey: 'habitAlcohol',
    choices: [
      { labelKey: 'alcoholNone', points: 0 },
      { labelKey: 'alcoholRare', points: -1 },
      { labelKey: 'alcoholWeekly', points: -3 },
      { labelKey: 'alcoholDaily', points: -6 },
    ],
    initial: 0,
  },
  {
    id: 'nutrition',
    labelKey: 'habitNutrition',
    choices: [
      { labelKey: 'nutritionProcessed', points: -2 },
      { labelKey: 'nutritionMixed', points: 0 },
      { labelKey: 'nutritionBalanced', points: 2 },
      { labelKey: 'nutritionConsistent', points: 3 },
    ],
    initial: 1,
  },
  {
    id: 'movement',
    labelKey: 'habitMovement',
    choices: [
      { labelKey: 'movementSedentary', points: -2 },
      { labelKey: 'movementLight', points: 0 },
      { labelKey: 'movementRegular', points: 2 },
      { labelKey: 'movementActive', points: 4 },
    ],
    initial: 1,
  },
  {
    id: 'sleep',
    labelKey: 'habitSleep',
    choices: [
      { labelKey: 'sleepShort', points: -2 },
      { labelKey: 'sleepVariable', points: 0 },
      { labelKey: 'sleepRestful', points: 1 },
    ],
    initial: 1,
  },
  {
    id: 'stress',
    labelKey: 'habitStress',
    choices: [
      { labelKey: 'stressHigh', points: -2 },
      { labelKey: 'stressManageable', points: 0 },
      { labelKey: 'stressLow', points: 1 },
    ],
    initial: 1,
  },
  {
    id: 'connection',
    labelKey: 'habitConnection',
    choices: [
      { labelKey: 'connectionLimited', points: -2 },
      { labelKey: 'connectionSteady', points: 0 },
      { labelKey: 'connectionStrong', points: 1 },
    ],
    initial: 1,
  },
  {
    id: 'checkups',
    labelKey: 'habitCheckups',
    choices: [
      { labelKey: 'checkupsRare', points: -1 },
      { labelKey: 'checkupsOccasional', points: 0 },
      { labelKey: 'checkupsRegular', points: 1 },
    ],
    initial: 1,
  },
  {
    id: 'purpose',
    labelKey: 'habitPurpose',
    choices: [
      { labelKey: 'purposeSearching', points: -1 },
      { labelKey: 'purposeSome', points: 0 },
      { labelKey: 'purposeStrong', points: 1 },
    ],
    initial: 1,
  },
];

export const DEFAULT_HABITS = Object.fromEntries(
  HABITS.map((habit) => [habit.id, habit.initial]),
);

export const HABIT_POINT_DIVISOR = 70;

export function habitPoints(habits) {
  return HABITS.reduce((sum, habit) => {
    const index = habits?.[habit.id];
    const choice = habit.choices[index];
    return sum + (choice?.points ?? 0);
  }, 0);
}

export function isValidHabitValue(id, value) {
  const habit = HABITS.find((item) => item.id === id);
  return Boolean(habit) && Number.isInteger(value) && value >= 0 && value < habit.choices.length;
}
