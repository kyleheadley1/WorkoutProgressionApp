// src/lib/exercisePairings.js
// Pairs for trend comparison (e.g. dumbbell vs barbell). pairIsPerHand = true means the *paired* exercise is per-hand.

import { getFriendlyName } from './aliases';

export const EXERCISE_PAIRS = {
  dumbbellBenchPress: {
    pairedId: 'barbellBenchPress',
    pairIsPerHand: false,
  },
  barbellBenchPress: {
    pairedId: 'dumbbellBenchPress',
    pairIsPerHand: true,
  },
  closeGripInclineDumbbellPress: {
    pairedId: 'barbellInclineBenchPress',
    pairIsPerHand: false,
  },
  barbellInclineBenchPress: {
    pairedId: 'closeGripInclineDumbbellPress',
    pairIsPerHand: true,
  },
};

export function getPairedExercise(exerciseId) {
  return EXERCISE_PAIRS[exerciseId] || null;
}

export function getPairedExerciseName(pairedId) {
  return getFriendlyName(pairedId) || pairedId;
}
