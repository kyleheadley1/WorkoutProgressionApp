// src/lib/aliases.js
// Canonicalize exercise IDs across variants and provide friendly display names.

const EXERCISE_ID_ALIASES = {
  // Pull-ups
  pullUp: 'pullUps',
  // Rows
  dumbbellRow: 'singleArmDumbbellRow',
  // RDLs
  dumbbellRDL: 'romanianDeadlifts',
  dumbbellRomanianDeadlift: 'romanianDeadlifts',
  romanianDeadlifts: 'romanianDeadlifts',
  // Goblet squats
  gobletSquats: 'dumbbellGobletSquat',
  dumbbellGobletSquat: 'dumbbellGobletSquat',
  // Lateral raise typo safety
  dumbbellLateraRaise: 'dumbbellLateralRaise',
  // Diamond push-ups
  diamondPushUp: 'diamondPushups',
};

const FRIENDLY_NAME = {
  pullUps: 'Pull-ups',
  singleArmDumbbellRow: 'Single-arm Dumbbell Row',
  romanianDeadlifts: 'Romanian Deadlift',
  dumbbellGobletSquat: 'Dumbbell Goblet Squat',
  dumbbellLateralRaise: 'Dumbbell Lateral Raise',
  dumbbellBicepCurl: 'Dumbbell Bicep Curl',
  hammerCurls: 'Hammer Curls',
  preacherCurls: 'Preacher Curls',
  latPulldowns: 'Lat Pulldowns',
  dumbbellStepUp: 'Dumbbell Step-up',
  seatedDumbbellCalfRaise: 'Seated Dumbbell Calf Raise',
  hangingLegRaise: 'Hanging Leg Raise',
  dumbbellBenchPress: 'Dumbbell Bench Press',
  dumbbellInclineBenchPress: 'Incline Dumbbell Bench Press',
  closeGripInclineDumbbellPress: 'Close-Grip Incline Dumbbell Press',
  diamondPushups: 'Diamond Push-ups',
  deficitPushups: 'Deficit Push-ups',
  larsenPress: 'Larsen Press',
  standingArnoldPress: 'Standing Arnold Press',
  lateralRaises: 'Lateral Raises',
  skullCrushers: 'Skull-crushers',
  tricepKickback: 'Single-arm Tricep Kickback',
  trapBarDeadlift: 'Dumbbell Deadlift',
  barbellBenchPress: 'Barbell Bench Press',
  barbellInclineBenchPress: 'Barbell Incline Bench Press',
};

export function canonicalizeExerciseId(exerciseId) {
  if (!exerciseId) return exerciseId;
  return EXERCISE_ID_ALIASES[exerciseId] || exerciseId;
}

/** Convert legacy "custom-slug-name" id to display name, e.g. "Barbell Bench Press" */
function customSlugToDisplayName(exerciseId) {
  if (!exerciseId || !exerciseId.startsWith('custom-')) return null;
  const slug = exerciseId.slice(7).trim();
  if (!slug) return null;
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function getFriendlyName(exerciseId) {
  const canon = canonicalizeExerciseId(exerciseId);
  const customName = customSlugToDisplayName(canon);
  if (customName) return customName;
  return FRIENDLY_NAME[canon] || canon;
}

export const __ALIASES_INTERNAL = {
  EXERCISE_ID_ALIASES,
  FRIENDLY_NAME,
};
