// src/lib/weightUtils.js
// All stored weights are in lbs. Convert to/from kg for display and input.
// Kg input uses step 1 (so e.g. 8 is valid); lb uses step 2.5.

const LBS_PER_KG = 2.20462262185;

export function convertToLbs(value, unit) {
  if (unit === 'kg') {
    const kg = Number(value);
    return Number.isFinite(kg) ? kg * LBS_PER_KG : 0;
  }
  return Number(value) || 0;
}

export function convertFromLbs(lbs, unit) {
  if (!Number.isFinite(lbs)) return 0;
  if (unit === 'kg') return lbs / LBS_PER_KG;
  return lbs;
}

/** Round for display: kg under 10 → nearest 1; kg 10+ → nearest 2.5; lbs → 1 decimal. */
export function roundForDisplay(value, unit) {
  if (!Number.isFinite(value)) return 0;
  if (unit === 'kg') {
    const step = value < 10 ? 1 : 2.5;
    const rounded = Math.round(value / step) * step;
    return Number(rounded.toFixed(1));
  }
  return Math.round(value * 10) / 10;
}

/** Format weight for display: "130 lb" or "59 kg" */
export function formatWeight(lbs, unit) {
  if (!Number.isFinite(lbs)) return '—';
  const display = roundForDisplay(convertFromLbs(lbs, unit), unit);
  return unit === 'kg' ? `${display} kg` : `${display} lb`;
}

/** Input step: for kg use 1 (so 1–9 and 8 are valid); for lb use 2.5. */
export function getWeightStep(unit) {
  return unit === 'kg' ? 1 : 2.5;
}

export function getWeightUnitLabel(unit) {
  return unit === 'kg' ? 'kg' : 'lb';
}
