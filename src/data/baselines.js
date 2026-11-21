export const BASELINES = [
  { id: 'GR', e0: { male: 79.4, female: 84.4 } },
  { id: 'EU', e0: { male: 78.9, female: 84.1 } },
  { id: 'AT', e0: { male: 79.8, female: 84.3 } },
  { id: 'BE', e0: { male: 80.3, female: 84.4 } },
  { id: 'BG', e0: { male: 72.2, female: 79.5 } },
  { id: 'CY', e0: { male: 81.5, female: 85.6 } },
  { id: 'CZ', e0: { male: 77.1, female: 83.0 } },
  { id: 'DE', e0: { male: 78.9, female: 83.5 } },
  { id: 'DK', e0: { male: 80.2, female: 83.9 } },
  { id: 'ES', e0: { male: 81.4, female: 86.5 } },
  { id: 'FI', e0: { male: 79.6, female: 84.8 } },
  { id: 'FR', e0: { male: 80.2, female: 85.8 } },
  { id: 'HU', e0: { male: 73.7, female: 79.9 } },
  { id: 'IE', e0: { male: 81.4, female: 84.7 } },
  { id: 'IT', e0: { male: 81.6, female: 85.7 } },
  { id: 'NL', e0: { male: 80.5, female: 83.3 } },
  { id: 'PL', e0: { male: 74.8, female: 82.2 } },
  { id: 'PT', e0: { male: 80.0, female: 85.4 } },
  { id: 'RO', e0: { male: 72.8, female: 80.3 } },
  { id: 'SE', e0: { male: 82.3, female: 85.3 } },
];

export const DEFAULT_BASELINE = 'GR';

export const BASELINE_SOURCE_URL =
  'https://ec.europa.eu/eurostat/databrowser/view/demo_mlexpec/default/table?lang=en';

export function findBaseline(id) {
  return BASELINES.find((baseline) => baseline.id === id) ?? null;
}
