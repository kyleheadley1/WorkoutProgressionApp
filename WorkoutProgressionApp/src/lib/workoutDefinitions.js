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

export function getDefsForDayType(dayType) {
  const key = (dayType || '').toLowerCase();
  return BY_DAY[key] || [];
}
