
// src/lib/progressionEngineStandalone.js
// Linear / rep-range progression engine with simple RPE-aware throttling.

export function roundTo(value, step = 2.5) {
  if (!isFinite(value)) return 0;
  const rounded = Math.round(value / step) * step;
  // Clamp floating point junk
  return Number(rounded.toFixed(4));
}

function summarizeSession(repScheme, session) {
  // session: { target: { weight, reps, sets }, sets: [{reps, weight, rpe?}] }
  const sets = session.sets || [];
  const weights = sets.map(s => s.weight ?? session.target?.weight ?? 0);
  const reps = sets.map(s => s.reps ?? 0);
  const rpes = sets.map(s => s.rpe).filter(x => typeof x === "number");
  const avgRPE = rpes.length ? rpes.reduce((a,b)=>a+b,0)/rpes.length : null;

  let metTarget = false;
  let toppedOut = false;
  if (repScheme.type === "fixed") {
    const need = repScheme.targetReps;
    metTarget = reps.length && reps.every(r => r >= need);
    toppedOut = metTarget; // same concept for fixed
  } else { // range
    const minR = repScheme.minReps;
    const maxR = repScheme.maxReps;
    metTarget = reps.length && reps.every(r => r >= minR);
    toppedOut = reps.length && reps.every(r => r >= maxR);
  }

  const lastTargetWeight = session?.target?.weight ?? (weights.length ? weights[0] : 0);

  return { metTarget, toppedOut, avgRPE, lastTargetWeight };
}

export function computeFailureStreak(repScheme, history) {
  // Count consecutive "miss" sessions starting from last
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const sum = summarizeSession(repScheme, history[i]);
    if (sum.metTarget) break;
    streak++;
  }
  return streak;
}

/**
 * Compute next recommendation.
 * @param {object} def - exercise definition
 *  {
 *    exerciseId, name, increment, rounding,
 *    repScheme: { type:'fixed'|'range', targetReps|minReps|maxReps, sets },
 *    failurePolicy: { repeatFailures, deloadPercent },
 *  }
 * @param {Array} history - recent sessions for this exercise
 * @returns {object} { exerciseId, recommended: {weight, reps, sets}, reason, meta }
 */
export function computeNextTargetFromHistory(def, history = []) {
  const inc = def.increment ?? 2.5;
  const rounding = def.rounding ?? 2.5;
  const failPolicy = { repeatFailures: 2, deloadPercent: 0.1, ...(def.failurePolicy || {}) };
  const last = history.length ? history[history.length - 1] : null;

  // Default starting target
  let nextWeight = roundTo(def.startWeight ?? 0, rounding);
  let nextReps, nextSets;

  const scheme = def.repScheme;
  if (scheme.type === "fixed") {
    nextReps = scheme.targetReps;
    nextSets = scheme.sets;
  } else {
    nextReps = scheme.minReps;
    nextSets = scheme.sets;
  }

  if (!last) {
    const reason = `No history found. Starting at ${nextWeight} with base scheme.`;
    return {
      exerciseId: def.exerciseId,
      recommended: { weight: nextWeight, reps: nextReps, sets: nextSets },
      reason,
      meta: { increment: inc, rounding, failureStreak: 0, lastAvgRPE: null }
    };
  }

  const summary = summarizeSession(scheme, last);
  const failureStreak = computeFailureStreak(scheme, history);

  let reason = "";
  // Establish the candidate baseline: last target weight
  nextWeight = summary.lastTargetWeight ?? nextWeight;

  if (summary.metTarget) {
    // Success path
    if (scheme.type === "fixed") {
      // RPE-aware adjustment
      let delta = inc;
      if (typeof summary.avgRPE === "number") {
        if (summary.avgRPE >= 9.5) delta = inc * 0.5;
        else if (summary.avgRPE <= 7.5) delta = inc * 1.5;
      }
      nextWeight = roundTo(nextWeight + delta, rounding);
      reason = `Hit all sets at target reps last time${summary.avgRPE ? ` (avg RPE ${summary.avgRPE.toFixed(1)})` : ""}. +${roundTo(nextWeight - summary.lastTargetWeight, rounding)} progression.`;
      nextReps = scheme.targetReps;
      nextSets = scheme.sets;
    } else {
      // rep-range
      if (summary.toppedOut) {
        nextWeight = roundTo(nextWeight + inc, rounding);
        nextReps = scheme.minReps;
        reason = `All sets reached the top of range. +${inc} and reset reps to ${scheme.minReps}.`;
      } else {
        // stay at same weight, increase reps by 1 up to max
        const lastTargetReps = last?.target?.reps ?? scheme.minReps;
        const proposed = Math.min((Array.isArray(lastTargetReps) ? lastTargetReps[0] : lastTargetReps) + 1, scheme.maxReps);
        nextReps = proposed;
        reason = `Progress within the range. Add a rep per set until ${scheme.maxReps}, then add weight.`;
      }
      nextSets = scheme.sets;
    }
  } else {
    // Failure path
    if (failureStreak >= failPolicy.repeatFailures) {
      nextWeight = roundTo(nextWeight * (1 - failPolicy.deloadPercent), rounding);
      reason = `Missed target ${failureStreak} times. Deload ${Math.round(failPolicy.deloadPercent*100)}%.`;
    } else {
      reason = `Missed target. Repeat the weight.`;
    }

    if (scheme.type === "fixed") {
      nextReps = scheme.targetReps;
    } else {
      nextReps = scheme.minReps;
    }
    nextSets = scheme.sets;
  }

  return {
    exerciseId: def.exerciseId,
    recommended: { weight: nextWeight, reps: nextReps, sets: nextSets },
    reason,
    meta: {
      increment: inc, rounding,
      failureStreak,
      lastAvgRPE: summary.avgRPE ?? null
    }
  };
}
