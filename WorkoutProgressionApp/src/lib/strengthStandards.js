// src/lib/strengthStandards.js
// Minimal strength standard snapshots derived from Strength Level population data.
// Sources:
// Dumbbell Bench Press (male, 180 lb bodyweight):
// https://strengthlevel.com/strength-standards/dumbbell-bench-press
// Push Ups (male, 180 lb bodyweight):
// https://strengthlevel.com/strength-standards/push-ups

const ALIASES = {
  deficitPushups: 'pushUps',
  // Note: Do NOT alias incline variants to flat press; they have their own standard.
  // Keep explicit IDs only. Unknown IDs will simply return null.
  pullUp: 'pullUps',
  diamondPushUp: 'pushUps',
  diamondPushups: 'pushUps',
  dumbbellRomanianDeadlift: 'romanianDeadlifts',
  dumbbellRDL: 'romanianDeadlifts',
  gobletSquats: 'dumbbellGobletSquat',
  dumbbellGobletSquat: 'dumbbellGobletSquat',
  dumbbellRow: 'singleArmDumbbellRow',
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
  // One-arm Dumbbell Row (per-hand)
  singleArmDumbbellRow: {
    metric: 'perHandWeight',
    unit: 'lb',
    source:
      'https://strengthlevel.com/strength-standards/one-arm-dumbbell-row',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 35 },
          { percentile: 20, label: 'Novice', value: 55 },
          { percentile: 50, label: 'Intermediate', value: 80 },
          { percentile: 80, label: 'Advanced', value: 110 },
          { percentile: 95, label: 'Elite', value: 140 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 15 },
          { percentile: 20, label: 'Novice', value: 25 },
          { percentile: 50, label: 'Intermediate', value: 40 },
          { percentile: 80, label: 'Advanced', value: 60 },
          { percentile: 95, label: 'Elite', value: 80 },
        ],
      },
    },
  },
  dumbbellLateralRaise: {
    metric: 'perHandWeight',
    unit: 'lb',
    source: 'https://strengthlevel.com/strength-standards/dumbbell-lateral-raise',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 8 },
          { percentile: 20, label: 'Novice', value: 13 },
          { percentile: 50, label: 'Intermediate', value: 20 },
          { percentile: 80, label: 'Advanced', value: 29 },
          { percentile: 95, label: 'Elite', value: 38 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 4 },
          { percentile: 20, label: 'Novice', value: 7 },
          { percentile: 50, label: 'Intermediate', value: 11 },
          { percentile: 80, label: 'Advanced', value: 16 },
          { percentile: 95, label: 'Elite', value: 21 },
        ],
      },
    },
  },
  dumbbellBicepCurl: {
    metric: 'perHandWeight',
    unit: 'lb',
    source: 'https://strengthlevel.com/strength-standards/dumbbell-curl',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 16 },
          { percentile: 20, label: 'Novice', value: 25 },
          { percentile: 50, label: 'Intermediate', value: 37 },
          { percentile: 80, label: 'Advanced', value: 51 },
          { percentile: 95, label: 'Elite', value: 64 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 7 },
          { percentile: 20, label: 'Novice', value: 11 },
          { percentile: 50, label: 'Intermediate', value: 17 },
          { percentile: 80, label: 'Advanced', value: 24 },
          { percentile: 95, label: 'Elite', value: 31 },
        ],
      },
    },
  },
  hammerCurls: {
    metric: 'perHandWeight',
    unit: 'lb',
    source: 'https://strengthlevel.com/strength-standards/dumbbell-hammer-curl',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 20 },
          { percentile: 20, label: 'Novice', value: 30 },
          { percentile: 50, label: 'Intermediate', value: 44 },
          { percentile: 80, label: 'Advanced', value: 60 },
          { percentile: 95, label: 'Elite', value: 76 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 8 },
          { percentile: 20, label: 'Novice', value: 13 },
          { percentile: 50, label: 'Intermediate', value: 20 },
          { percentile: 80, label: 'Advanced', value: 28 },
          { percentile: 95, label: 'Elite', value: 36 },
        ],
      },
    },
  },
  preacherCurl: {
    metric: 'weight',
    unit: 'lb',
    source: 'https://strengthlevel.com/strength-standards/preacher-curl',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 40 },
          { percentile: 20, label: 'Novice', value: 60 },
          { percentile: 50, label: 'Intermediate', value: 85 },
          { percentile: 80, label: 'Advanced', value: 115 },
          { percentile: 95, label: 'Elite', value: 145 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 20 },
          { percentile: 20, label: 'Novice', value: 30 },
          { percentile: 50, label: 'Intermediate', value: 45 },
          { percentile: 80, label: 'Advanced', value: 62 },
          { percentile: 95, label: 'Elite', value: 78 },
        ],
      },
    },
  },
  latPulldowns: {
    metric: 'weight',
    unit: 'lb',
    source: 'https://strengthlevel.com/strength-standards/lat-pulldown',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 90 },
          { percentile: 20, label: 'Novice', value: 120 },
          { percentile: 50, label: 'Intermediate', value: 160 },
          { percentile: 80, label: 'Advanced', value: 200 },
          { percentile: 95, label: 'Elite', value: 240 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 50 },
          { percentile: 20, label: 'Novice', value: 70 },
          { percentile: 50, label: 'Intermediate', value: 100 },
          { percentile: 80, label: 'Advanced', value: 130 },
          { percentile: 95, label: 'Elite', value: 160 },
        ],
      },
    },
  },
  dumbbellGobletSquat: {
    metric: 'weight',
    isDumbbell: true,
    unit: 'lb',
    source: 'https://strengthlevel.com/strength-standards/dumbbell-goblet-squat',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 40 },
          { percentile: 20, label: 'Novice', value: 60 },
          { percentile: 50, label: 'Intermediate', value: 85 },
          { percentile: 80, label: 'Advanced', value: 115 },
          { percentile: 95, label: 'Elite', value: 145 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 20 },
          { percentile: 20, label: 'Novice', value: 35 },
          { percentile: 50, label: 'Intermediate', value: 55 },
          { percentile: 80, label: 'Advanced', value: 75 },
          { percentile: 95, label: 'Elite', value: 95 },
        ],
      },
    },
  },
  dumbbellStepUp: {
    metric: 'perHandWeight',
    unit: 'lb',
    source: 'https://strengthlevel.com/strength-standards/dumbbell-step-up',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 20 },
          { percentile: 20, label: 'Novice', value: 35 },
          { percentile: 50, label: 'Intermediate', value: 55 },
          { percentile: 80, label: 'Advanced', value: 78 },
          { percentile: 95, label: 'Elite', value: 100 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 10 },
          { percentile: 20, label: 'Novice', value: 16 },
          { percentile: 50, label: 'Intermediate', value: 26 },
          { percentile: 80, label: 'Advanced', value: 37 },
          { percentile: 95, label: 'Elite', value: 48 },
        ],
      },
    },
  },
  seatedDumbbellCalfRaise: {
    metric: 'weight',
    isDumbbell: true,
    unit: 'lb',
    source: 'https://strengthlevel.com/strength-standards/seated-calf-raise',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 60 },
          { percentile: 20, label: 'Novice', value: 95 },
          { percentile: 50, label: 'Intermediate', value: 140 },
          { percentile: 80, label: 'Advanced', value: 190 },
          { percentile: 95, label: 'Elite', value: 240 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 35 },
          { percentile: 20, label: 'Novice', value: 60 },
          { percentile: 50, label: 'Intermediate', value: 90 },
          { percentile: 80, label: 'Advanced', value: 125 },
          { percentile: 95, label: 'Elite', value: 160 },
        ],
      },
    },
  },
  hangingLegRaise: {
    metric: 'reps',
    unit: 'reps',
    source: 'https://strengthlevel.com/strength-standards/hanging-leg-raise',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 4 },
          { percentile: 20, label: 'Novice', value: 9 },
          { percentile: 50, label: 'Intermediate', value: 18 },
          { percentile: 80, label: 'Advanced', value: 30 },
          { percentile: 95, label: 'Elite', value: 44 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 1 },
          { percentile: 20, label: 'Novice', value: 4 },
          { percentile: 50, label: 'Intermediate', value: 9 },
          { percentile: 80, label: 'Advanced', value: 16 },
          { percentile: 95, label: 'Elite', value: 24 },
        ],
      },
    },
  },
  // Incline Dumbbell Bench Press has its own population data.
  // Source: Strength Level incline dumbbell bench press
  // https://strengthlevel.com/strength-standards/incline-dumbbell-bench-press
  dumbbellInclineBenchPress: {
    metric: 'perHandWeight',
    unit: 'lb',
    source:
      'https://strengthlevel.com/strength-standards/incline-dumbbell-bench-press',
    base: {
      male: {
        bodyweight: 180,
        // Snapshot points (structured same as other standards).
        // If you want to refine these, update with refreshed values.
        points: [
          { percentile: 5, label: 'Beginner', value: 27 },
          { percentile: 20, label: 'Novice', value: 43 },
          { percentile: 50, label: 'Intermediate', value: 63 },
          { percentile: 80, label: 'Advanced', value: 86 },
          { percentile: 95, label: 'Elite', value: 109 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 11 },
          { percentile: 20, label: 'Novice', value: 19 },
          { percentile: 50, label: 'Intermediate', value: 30 },
          { percentile: 80, label: 'Advanced', value: 43 },
          { percentile: 95, label: 'Elite', value: 55 },
        ],
      },
    },
  },
  // Pull-ups (bodyweight)
  pullUps: {
    metric: 'reps',
    unit: 'reps',
    source: 'https://strengthlevel.com/strength-standards/pull-ups',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 1 },
          { percentile: 20, label: 'Novice', value: 6 },
          { percentile: 50, label: 'Intermediate', value: 13 },
          { percentile: 80, label: 'Advanced', value: 22 },
          { percentile: 95, label: 'Elite', value: 32 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 0 },
          { percentile: 20, label: 'Novice', value: 1 },
          { percentile: 50, label: 'Intermediate', value: 3 },
          { percentile: 80, label: 'Advanced', value: 6 },
          { percentile: 95, label: 'Elite', value: 10 },
        ],
      },
    },
  },
  chinUps: {
    metric: 'reps',
    unit: 'reps',
    source: 'https://strengthlevel.com/strength-standards/chin-ups',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 2 },
          { percentile: 20, label: 'Novice', value: 7 },
          { percentile: 50, label: 'Intermediate', value: 15 },
          { percentile: 80, label: 'Advanced', value: 25 },
          { percentile: 95, label: 'Elite', value: 36 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 0 },
          { percentile: 20, label: 'Novice', value: 1 },
          { percentile: 50, label: 'Intermediate', value: 4 },
          { percentile: 80, label: 'Advanced', value: 7 },
          { percentile: 95, label: 'Elite', value: 12 },
        ],
      },
    },
  },
  // Trap Bar Deadlift (total weight)
  trapBarDeadlift: {
    metric: 'weight',
    unit: 'lb',
    source: 'https://strengthlevel.com/strength-standards/trap-bar-deadlift',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 185 },
          { percentile: 20, label: 'Novice', value: 255 },
          { percentile: 50, label: 'Intermediate', value: 335 },
          { percentile: 80, label: 'Advanced', value: 415 },
          { percentile: 95, label: 'Elite', value: 500 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 95 },
          { percentile: 20, label: 'Novice', value: 140 },
          { percentile: 50, label: 'Intermediate', value: 200 },
          { percentile: 80, label: 'Advanced', value: 260 },
          { percentile: 95, label: 'Elite', value: 315 },
        ],
      },
    },
  },
  // Romanian Deadlift (barbell). If user does DB RDL, we'll double per-hand weight (see logic below).
  romanianDeadlifts: {
    metric: 'weight',
    unit: 'lb',
    source: 'https://strengthlevel.com/strength-standards/romanian-deadlift',
    base: {
      male: {
        bodyweight: 180,
        points: [
          { percentile: 5, label: 'Beginner', value: 135 },
          { percentile: 20, label: 'Novice', value: 185 },
          { percentile: 50, label: 'Intermediate', value: 255 },
          { percentile: 80, label: 'Advanced', value: 325 },
          { percentile: 95, label: 'Elite', value: 395 },
        ],
      },
      female: {
        bodyweight: 150,
        points: [
          { percentile: 5, label: 'Beginner', value: 65 },
          { percentile: 20, label: 'Novice', value: 95 },
          { percentile: 50, label: 'Intermediate', value: 140 },
          { percentile: 80, label: 'Advanced', value: 185 },
          { percentile: 95, label: 'Elite', value: 225 },
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
    // If our exercise is a dumbbell movement but the standard is NOT dumbbell-specific,
    // double per-hand weight to total system weight before comparing.
    const isDumbbellExercise =
      /dumbbell/i.test(exerciseId || '') ||
      /db\b/i.test(exerciseId || '');
    const isDumbbellStandard = standard.metric === 'perHandWeight' || standard.isDumbbell === true;
    const raw = Number(metrics.weight);
    if (!Number.isFinite(raw)) return null;
    value = isDumbbellExercise && !isDumbbellStandard ? raw * 2 : raw;
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

