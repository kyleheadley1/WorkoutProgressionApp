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

/** Normalize for comparison: lowercase, single spaces, no punctuation. */
function normalize(s) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, ' ');
}

/** Modality terms that make exercises distinct (dumbbell ≠ barbell, etc.). */
const MODALITY_TERMS = new Set([
  'dumbbell',
  'dumbell',
  'db',
  'barbell',
  'bb',
  'kettlebell',
  'kb',
  'cable',
  'machine',
  'band',
  'ez',
  'trap',
  'bar',
]);

function getModalityWord(str) {
  const words = normalize(str).split(/\s+/).filter(Boolean);
  return words.find((w) => MODALITY_TERMS.has(w)) || null;
}

/** Levenshtein distance. */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
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
 * Find a similar exercise only when it looks like a misspelling (typo) of the same exercise.
 * Does NOT suggest when the only difference is modality (e.g. dumbbell vs barbell).
 */
export function findSimilarExercise(query, allDefs) {
  const q = normalize(query);
  if (!q || q.length < 2) return null;
  const exact = findExactExercise(query, allDefs);
  if (exact) return null;

  const queryModality = getModalityWord(query);
  let best = null;
  let bestScore = 0;

  for (const d of allDefs) {
    const name = normalize(d.name);
    const nameModality = getModalityWord(d.name);

    // Don't suggest if they use different modality (dumbbell vs barbell = different exercise).
    if (queryModality && nameModality && queryModality !== nameModality) {
      continue;
    }

    // Typo-style similarity: small edit distance relative to length.
    const maxLen = Math.max(q.length, name.length);
    const distance = levenshtein(q, name);
    const ratio = distance / maxLen;
    // Suggest only when very close (likely typo): e.g. 1–2 chars wrong in a short string.
    const typoScore = 1 - ratio;
    if (ratio <= 0.25 && typoScore > bestScore) {
      bestScore = typoScore;
      best = d;
    }
  }

  return best;
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
