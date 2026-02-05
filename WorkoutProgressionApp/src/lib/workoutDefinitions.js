// src/lib/workoutDefinitions.js
// Exercise definitions per day type for the "Add past workout" flow.
// Kept in sync with Push, Pull, Legs, Upper, Lower, FullBody components.

function def(exerciseId, name, repScheme, modality = undefined) {
  return { exerciseId, name, repScheme, modality };
}

const PUSH_DEFS = [
  def(
    'dumbbellBenchPress',
    'Dumbbell Bench Press',
    { type: 'fixed', targetReps: 5, sets: 3 },
    'dumbbell',
  ),
  def('larsenPress', 'Larsen Press', {
    type: 'fixed',
    targetReps: 10,
    sets: 2,
  }),
  def('standingArnoldPress', 'Standing Arnold Press', {
    type: 'range',
    minReps: 8,
    maxReps: 10,
    sets: 3,
  }),
  def(
    'deficitPushups',
    'Deficit Push-ups',
    { type: 'range', minReps: 12, maxReps: 15, sets: 3 },
    'bodyweight',
  ),
  def('lateralRaises', 'Lateral Raises', {
    type: 'range',
    minReps: 12,
    maxReps: 15,
    sets: 3,
  }),
  def('skullCrushers', 'Skull-crushers', {
    type: 'fixed',
    targetReps: 15,
    sets: 3,
  }),
  def('tricepKickback', 'Single-arm Tricep Kickback', {
    type: 'fixed',
    targetReps: 12,
    sets: 2,
  }),
];

const PULL_DEFS = [
  def(
    'pullUps',
    'Pull-ups',
    { type: 'fixed', targetReps: 10, sets: 4 },
    'bodyweight',
  ),
  def('rearDeltRaises', 'Rear Delt Raises', {
    type: 'range',
    minReps: 12,
    maxReps: 15,
    sets: 3,
  }),
  def('latPulldowns', 'Lat Pulldowns', {
    type: 'range',
    minReps: 10,
    maxReps: 12,
    sets: 3,
  }),
  def('hammerCurls', 'Hammer Curls', {
    type: 'range',
    minReps: 10,
    maxReps: 12,
    sets: 3,
  }),
  def('preacherCurls', 'Preacher Curls', {
    type: 'range',
    minReps: 10,
    maxReps: 12,
    sets: 3,
  }),
];

const LEGS_DEFS = [
  def('bulgarianSplitSquats', 'Bulgarian Split Squats', {
    type: 'fixed',
    targetReps: 4,
    sets: 4,
  }),
  def('bulgarianSplitSquatsPause', 'Bulgarian Split Squats (Pause)', {
    type: 'fixed',
    targetReps: 5,
    sets: 2,
  }),
  def('romanianDeadlifts', 'Romanian Deadlifts', {
    type: 'fixed',
    targetReps: 10,
    sets: 3,
  }),
  def('dumbbellGobletSquat', 'Dumbbell Goblet Squat', {
    type: 'range',
    minReps: 10,
    maxReps: 12,
    sets: 3,
  }),
  def('calfRaises', 'Calf Raises', {
    type: 'range',
    minReps: 15,
    maxReps: 20,
    sets: 3,
  }),
  def(
    'weightedCrunches',
    'Weighted Crunches',
    { type: 'range', minReps: 12, maxReps: 20, sets: 3 },
    'dumbbell',
  ),
];

const UPPER_DEFS = [
  def(
    'pullUp',
    'Pull Up',
    { type: 'fixed', targetReps: 10, sets: 2 },
    'bodyweight',
  ),
  def(
    'closeGripInclineDumbbellPress',
    'Close Grip Incline Dumbbell Press',
    { type: 'custom', sets: 3, reps: [8, 5, 12] },
    'dumbbell',
  ),
  def(
    'dumbbellRow',
    'Dumbbell Row',
    { type: 'fixed', targetReps: 12, sets: 3 },
    'dumbbell',
  ),
  def(
    'dumbbellLateralRaise',
    'Dumbbell Lateral Raise',
    { type: 'fixed', targetReps: 12, sets: 3 },
    'dumbbell',
  ),
  def(
    'dumbbellBicepCurl',
    'Dumbbell Bicep Curl',
    { type: 'fixed', targetReps: 12, sets: 3 },
    'dumbbell',
  ),
  def(
    'diamondPushUp',
    'Diamond Push Up',
    { type: 'fixed', targetReps: 25, sets: 1 },
    'bodyweight',
  ),
];

const LOWER_DEFS = [
  def(
    'trapBarDeadlift',
    'Dumbbell Deadlift',
    { type: 'fixed', targetReps: 5, sets: 1 },
    'dumbbell',
  ),
  def(
    'dumbbellRomanianDeadlift',
    'Dumbbell Romanian Deadlift',
    { type: 'fixed', targetReps: 8, sets: 2 },
    'dumbbell',
  ),
  def(
    'dumbbellGobletSquat',
    'Dumbbell Goblet Squat',
    { type: 'fixed', targetReps: 12, sets: 4 },
    'dumbbell',
  ),
  def(
    'dumbbellStepUp',
    'Dumbbell Step Up',
    { type: 'fixed', targetReps: 10, sets: 3 },
    'dumbbell',
  ),
  def(
    'seatedDumbbellCalfRaise',
    'Seated Dumbbell Calf Raise',
    { type: 'fixed', targetReps: 20, sets: 4 },
    'dumbbell',
  ),
  def(
    'hangingLegRaise',
    'Hanging Leg Raise',
    { type: 'fixed', targetReps: 8, sets: 5 },
    'bodyweight',
  ),
];

const FULL_DEFS = [
  def(
    'trapBarDeadlift',
    'Dumbbell Deadlift',
    { type: 'fixed', targetReps: 5, sets: 1 },
    'dumbbell',
  ),
  def(
    'dumbbellRDL',
    'Dumbbell RDL',
    { type: 'fixed', targetReps: 8, sets: 2 },
    'dumbbell',
  ),
  def(
    'closeGripInclineDumbbellPress',
    'Close Grip Incline Dumbbell Press',
    { type: 'custom', sets: 3, reps: [8, 5, 12] },
    'dumbbell',
  ),
  def(
    'chinUps',
    'Chin-ups',
    { type: 'fixed', targetReps: 10, sets: 2 },
    'bodyweight',
  ),
  def(
    'gobletSquats',
    'Goblet Squats',
    { type: 'fixed', targetReps: 12, sets: 5 },
    'dumbbell',
  ),
  def(
    'singleArmDumbbellRow',
    'Single Arm DB Row',
    { type: 'fixed', targetReps: 12, sets: 4 },
    'dumbbell',
  ),
  def(
    'diamondPushups',
    'Diamond Push-ups',
    { type: 'amrap', sets: 1 },
    'bodyweight',
  ),
];

const BY_DAY = {
  push: PUSH_DEFS,
  pull: PULL_DEFS,
  legs: LEGS_DEFS,
  upper: UPPER_DEFS,
  lower: LOWER_DEFS,
  full: FULL_DEFS,
};

const ALL_DEFS_FLAT = [
  ...PUSH_DEFS,
  ...PULL_DEFS,
  ...LEGS_DEFS,
  ...UPPER_DEFS,
  ...LOWER_DEFS,
  ...FULL_DEFS,
];

/** Unique exercise defs by exerciseId (first occurrence wins). Used for manual add-past-workout. */
let _allExerciseDefsCache = null;
export function getAllExerciseDefs() {
  if (_allExerciseDefsCache) return _allExerciseDefsCache;
  const seen = new Set();
  _allExerciseDefsCache = ALL_DEFS_FLAT.filter((d) => {
    if (seen.has(d.exerciseId)) return false;
    seen.add(d.exerciseId);
    return true;
  });
  return _allExerciseDefsCache;
}

export function getDefByExerciseId(exerciseId) {
  return getAllExerciseDefs().find((d) => d.exerciseId === exerciseId) || null;
}

export function getDefsForDayType(dayType) {
  const key = (dayType || '').toLowerCase();
  return BY_DAY[key] || [];
}

/** Normalize for comparison: lowercase, single spaces. */
function normalize(s) {
  return (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Find an exact match by name or exerciseId.
 */
export function findExactExercise(query, allDefs) {
  const q = normalize(query);
  if (!q) return null;
  return (
    allDefs.find(
      (d) =>
        normalize(d.name) === q ||
        d.exerciseId.toLowerCase() === q.replace(/\s/g, ''),
    ) || null
  );
}

/**
 * Find a similar (but not exact) exercise to suggest "Did you mean X?".
 * Returns the best match if similarity is high enough.
 */
export function findSimilarExercise(query, allDefs) {
  const q = normalize(query);
  if (!q || q.length < 2) return null;
  const exact = findExactExercise(query, allDefs);
  if (exact) return null; // no "similar" if exact exists

  let best = null;
  let bestScore = 0;

  for (const d of allDefs) {
    const name = normalize(d.name);
    // Substring: typed is inside name or name is inside typed
    if (name.includes(q) || q.includes(name)) {
      const score =
        Math.min(name.length, q.length) / Math.max(name.length, q.length);
      if (score > bestScore) {
        bestScore = score;
        best = d;
      }
    }
    // Word overlap: majority of query words appear in name
    const qWords = q.split(/\s+/).filter(Boolean);
    const nameWords = new Set(name.split(/\s+/));
    const matchCount = qWords.filter(
      (w) => nameWords.has(w) || name.includes(w),
    ).length;
    const wordScore = matchCount / qWords.length;
    if (wordScore >= 0.6 && wordScore > bestScore) {
      bestScore = wordScore;
      best = d;
    }
  }

  return bestScore >= 0.5 ? best : null;
}

/**
 * Filter stored exercises by query for predictive text (contains, case-insensitive).
 */
export function filterExercisesByQuery(query, allDefs, limit = 10) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  return allDefs
    .filter((d) => d.name.toLowerCase().includes(q))
    .slice(0, limit);
}
