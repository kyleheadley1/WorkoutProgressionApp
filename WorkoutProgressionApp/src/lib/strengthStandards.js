// src/lib/strengthStandards.js
// Minimal strength standard snapshots derived from Strength Level population data.
// Sources:
// Dumbbell Bench Press (male, 180 lb bodyweight):
// https://strengthlevel.com/strength-standards/dumbbell-bench-press
// Push Ups (male, 180 lb bodyweight):
// https://strengthlevel.com/strength-standards/push-ups

const ALIASES = {
  deficitPushups: 'pushUps',
};

const STANDARDS = {
  dumbbellBenchPress: {
    metric: 'perHandWeight',
    unit: 'lb',
    source: 'https://strengthlevel.com/strength-standards/dumbbell-bench-press',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 32 },
          { percentile: 20, label: 'Novice', value: 49 },
          { percentile: 50, label: 'Intermediate', value: 71 },
          { percentile: 80, label: 'Advanced', value: 97 },
          { percentile: 95, label: 'Elite', value: 124 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 13 },
          { percentile: 20, label: 'Novice', value: 22 },
          { percentile: 50, label: 'Intermediate', value: 34 },
          { percentile: 80, label: 'Advanced', value: 48 },
          { percentile: 95, label: 'Elite', value: 60 },
        ],
      },
    },
  },
  pushUps: {
    metric: 'reps',
    unit: 'reps',
    source: 'https://strengthlevel.com/strength-standards/push-ups',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 11 },
          { percentile: 20, label: 'Novice', value: 24 },
          { percentile: 50, label: 'Intermediate', value: 39 },
          { percentile: 80, label: 'Advanced', value: 55 },
          { percentile: 95, label: 'Elite', value: 73 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 5 },
          { percentile: 20, label: 'Novice', value: 12 },
          { percentile: 50, label: 'Intermediate', value: 21 },
          { percentile: 80, label: 'Advanced', value: 32 },
          { percentile: 95, label: 'Elite', value: 45 },
        ],
      },
    },
  },
};

function resolveExerciseId(exerciseId) {
  if (!exerciseId) return null;
  if (STANDARDS[exerciseId]) return exerciseId;
  return ALIASES[exerciseId] || null;
}

function interpolatePercentile(points, value) {
  if (!Number.isFinite(value)) return null;
  if (value <= points[0].value) {
    const span = points[0].value || 1;
    const pct = (value / span) * points[0].percentile;
    return { percentile: Math.max(1, pct), label: points[0].label };
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (value >= a.value && value <= b.value) {
      const ratio = (value - a.value) / (b.value - a.value || 1);
      const pct = a.percentile + ratio * (b.percentile - a.percentile);
      const label = ratio < 0.5 ? a.label : b.label;
      return { percentile: pct, label };
    }
  }
  const last = points[points.length - 1];
  const pct = last.percentile + (value - last.value) * 0.5;
  return { percentile: Math.min(99, pct), label: last.label };
}

function getBaseForProfile(standard, profile = {}) {
  const genderKey = profile.gender === 'female' ? 'female' : 'male';
  const baseByGender = standard.base?.[genderKey] || standard.base?.male;
  const genderUsed = standard.base?.[genderKey] ? genderKey : 'male';
  return { baseByGender, genderUsed };
}

export function getStrengthLevelComparison(
  exerciseId,
  metrics = {},
  profile = { gender: 'male', bodyweight: 180 }
) {
  const resolved = resolveExerciseId(exerciseId);
  if (!resolved) return null;
  const standard = STANDARDS[resolved];
  if (!standard) return null;

  const { baseByGender, genderUsed } = getBaseForProfile(standard, profile);
  if (!baseByGender) return null;

  let value = null;
  if (standard.metric === 'perHandWeight') {
    if (!Number.isFinite(metrics.weight)) return null;
    // Weight is already per-hand/per-dumbbell, use directly
    value = metrics.weight;
  } else if (standard.metric === 'weight') {
    value = metrics.weight;
  } else if (standard.metric === 'reps') {
    value = metrics.reps;
  }
  if (!Number.isFinite(value)) return null;

  let normalizedValue = value;
  if (standard.metric === 'perHandWeight' || standard.metric === 'weight') {
    const targetBw = Number(profile?.bodyweight) || baseByGender.bodyweight;
    const scale = Math.pow(targetBw / baseByGender.bodyweight, 0.67) || 1;
    normalizedValue = value / scale;
  }

  const match = interpolatePercentile(baseByGender.points, normalizedValue);
  if (!match) return null;
  return {
    exerciseId: resolved,
    percentile: Math.max(1, Math.min(100, Math.round(match.percentile))),
    label: match.label,
    bodyweight: Number(profile?.bodyweight) || baseByGender.bodyweight,
    gender: genderUsed,
    unit: standard.unit,
    source: standard.source,
  };
}
