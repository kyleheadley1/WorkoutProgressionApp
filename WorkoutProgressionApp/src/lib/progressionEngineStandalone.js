
// src/lib/progressionEngineStandalone.js
// Linear / rep-range progression engine with simple RPE-aware throttling.

export function roundTo(value, step = 2.5) {
  if (!isFinite(value)) return 0;
  const rounded = Math.round(value / step) * step;
  // Clamp floating point junk
  return Number(rounded.toFixed(4));
}

// Simple Epley 1RM estimate
function est1RM(weight, reps) {
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return null;
  return weight * (1 + reps / 30);
}

// 1RM percentage lookup used to convert 1RM → target reps weight
function get1RMPercentage(reps) {
  const table = {
    1: 1.0,
    2: 0.97,
    3: 0.94,
    4: 0.92,
    5: 0.89,
    6: 0.86,
    7: 0.83,
    8: 0.81,
    9: 0.78,
    10: 0.75,
    11: 0.73,
    12: 0.71,
    13: 0.7,
    14: 0.68,
    15: 0.67,
  };
  const r = Math.round(Number(reps) || 0);
  if (r <= 1) return 1.0;
  if (r >= 15) return 0.67;
  return table[r] ?? 0.67;
}

function weightForRepsFrom1RM(oneRM, reps, rounding) {
  const pct = get1RMPercentage(reps);
  return roundTo((oneRM || 0) * pct, rounding);
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
  } else if (scheme.type === "range") {
    nextReps = scheme.minReps;
    nextSets = scheme.sets;
  } else if (scheme.type === "custom" && Array.isArray(scheme.reps)) {
    // Custom: first rep prescription defines the "base" recommendation;
    // UI will derive other sets from this.
    nextReps = scheme.reps[0];
    nextSets = scheme.sets ?? scheme.reps.length;
  } else {
    // Fallback
    nextReps = scheme?.targetReps ?? scheme?.minReps ?? 10;
    nextSets = scheme?.sets ?? 3;
  }

  // Enhancement: if a solid estimate exists within the last 14 days, prefer it.
  // We look for the highest estimated 1RM in that window and convert to current target reps.
  (function maybeUseRecent1RM() {
    const now = Date.now();
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    let bestOneRM = null;
    for (const sess of history) {
      const t = new Date(sess?.date || 0).getTime();
      if (!Number.isFinite(t) || now - t > twoWeeksMs) continue;
      const sets = (sess?.sets || (sess?.exercises?.[0]?.sets) || []);
      for (const s of sets) {
        const e = est1RM(Number(s.weight) || 0, Number(s.reps) || 0);
        if (Number.isFinite(e)) {
          bestOneRM = Math.max(bestOneRM ?? 0, e);
        }
      }
      // Also consider target if no sets (just in case)
      if ((!sets || sets.length === 0) && sess?.target) {
        const e = est1RM(Number(sess.target.weight) || 0, Number(sess.target.reps) || 0);
        if (Number.isFinite(e)) {
          bestOneRM = Math.max(bestOneRM ?? 0, e);
        }
      }
    }
    if (Number.isFinite(bestOneRM) && bestOneRM > 0) {
      const derived = weightForRepsFrom1RM(bestOneRM, nextReps, rounding);
      if (Number.isFinite(derived) && derived > 0) {
        nextWeight = derived;
      }
    }
  })();

  // If no history, but this is a dumbbell movement with a start weight above per-hand cap,
  // clamp immediately and start with reps/sets baseline so UI doesn't suggest >90/hand.
  const isDumbbellMovement =
    def?.modality === "dumbbell" || /dumbbell/i.test(def?.name || "");
  const perHandCap = 90;
  if (!last && isDumbbellMovement) {
    if ((def.startWeight ?? nextWeight ?? 0) > perHandCap) {
      nextWeight = perHandCap;
      // start with base prescription (e.g., 5 reps, 1 set if available)
      const baseReps =
        (scheme?.type === "fixed" && scheme.targetReps) ||
        (scheme?.type === "range" && scheme.minReps) ||
        5;
      const baseSets = (scheme?.sets ?? 1) || 1;
      nextReps = baseReps;
      nextSets = baseSets;
      const reason = `At cap ${perHandCap} lb/hand — start at ${nextSets}×${nextReps} and progress via reps/sets.`;
      return {
        exerciseId: def.exerciseId,
        recommended: { weight: nextWeight, reps: nextReps, sets: nextSets },
        reason,
        meta: { increment: inc, rounding, failureStreak: 0, lastAvgRPE: null },
      };
    }
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

  // Special handling: Push-ups variants should be AMRAP (1 set) with suggested reps
  // equal to the highest recent total; display with a plus sign in UI.
  const isPushupVariant =
    /pushups?/i.test(def.exerciseId || "") ||
    def.exerciseId === "diamondPushUp" ||
    def.exerciseId === "diamondPushups";
  if (isPushupVariant) {
    // Find max reps achieved in the last N sessions (e.g., 10)
    let maxReps = 0;
    const lookback = Math.min(history.length, 10);
    for (let i = history.length - lookback; i < history.length; i++) {
      if (i < 0) continue;
      const sess = history[i];
      const sets = (sess?.sets || (sess?.exercises?.[0]?.sets) || []);
      for (const s of sets) {
        const r = Number(s.reps) || 0;
        if (r > maxReps) maxReps = r;
      }
      if ((!sets || sets.length === 0) && sess?.target?.reps) {
        const r = Number(sess.target.reps) || 0;
        if (r > maxReps) maxReps = r;
      }
    }
    nextSets = 1;
    // Use at least scheme/min target as baseline
    const baseline =
      (scheme?.type === "range" ? scheme.minReps : scheme?.targetReps) ?? 10;
    nextReps = Math.max(maxReps, baseline);
    // Force bodyweight
    nextWeight = 0;
    reason = `AMRAP — aim for ${nextReps}+ reps (based on recent best).`;
    return {
      exerciseId: def.exerciseId,
      recommended: { weight: nextWeight, reps: nextReps, sets: nextSets },
      reason,
      meta: { increment: inc, rounding, failureStreak, lastAvgRPE: summary.avgRPE ?? null },
    };
  }

  if (summary.metTarget) {
    // Success path
    if (scheme.type === "fixed") {
      // Unified per-hand cap progression for dumbbell movements
      const isDumbbellMovement =
        def?.modality === "dumbbell" || /dumbbell/i.test(def?.name || "");
      const perHandCap = 90; // user's max per hand
      if (isDumbbellMovement) {
        const lastTargetReps =
          Number(last?.target?.reps) || scheme.targetReps || 5;
        const lastTargetSets = Number(last?.target?.sets) || 1;
        const lastTargetWeight =
          Number(summary.lastTargetWeight) || nextWeight || 0;

        // propose standard weight increase
        let proposed = roundTo(lastTargetWeight + inc, rounding);
        // If we are already above the cap (from prior logic) or proposal exceeds cap,
        // clamp to cap and progress via reps/sets.
        if (lastTargetWeight >= perHandCap || proposed > perHandCap) {
          nextWeight = perHandCap;
          if (lastTargetSets < 4) {
            if (lastTargetReps < 10) {
              nextReps = lastTargetReps + 1;
              nextSets = lastTargetSets;
              reason = `At cap ${perHandCap} lb/hand — increase reps to ${nextReps}.`;
            } else {
              nextSets = lastTargetSets + 1;
              nextReps = 5;
              reason = `At cap ${perHandCap} lb/hand — add set (to ${nextSets}) and reset reps to 5.`;
            }
          } else {
            if (lastTargetReps < 12) {
              nextReps = lastTargetReps + 1;
              nextSets = 4;
              reason = `At cap ${perHandCap} lb/hand — increase reps to ${nextReps} (4 sets).`;
            } else {
              nextReps = 12;
              nextSets = 4;
              reason = `At cap ${perHandCap} lb/hand — maintain 4×12.`;
            }
          }
          return {
            exerciseId: def.exerciseId,
            recommended: { weight: nextWeight, reps: nextReps, sets: nextSets },
            reason,
            meta: {
              increment: inc,
              rounding,
              failureStreak,
              lastAvgRPE: summary.avgRPE ?? null,
            },
          };
        } else {
          // Not at cap yet: normal weight progression
          nextWeight = proposed;
          reason = `Progress +${roundTo(inc, rounding)} lb/hand.`;
          nextReps = scheme.targetReps || lastTargetReps || 5;
          nextSets = scheme.sets || lastTargetSets || 1;
          return {
            exerciseId: def.exerciseId,
            recommended: { weight: nextWeight, reps: nextReps, sets: nextSets },
            reason,
            meta: {
              increment: inc,
              rounding,
              failureStreak,
              lastAvgRPE: summary.avgRPE ?? null,
            },
          };
        }
      }

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
    } else if (scheme.type === "range") {
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
    } else if (scheme.type === "custom" && Array.isArray(scheme.reps)) {
      // For custom sequences (e.g., 8/5/12), keep base (first rep prescription) the same or nudge by increment.
      // We'll keep the base recommendation stable unless explicitly topped-out logic is added per exercise.
      reason = `Custom rep sequence. Using base weight for ${scheme.reps[0]} reps.`;
      nextReps = scheme.reps[0];
      nextSets = scheme.sets ?? scheme.reps.length;
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
    } else if (scheme.type === "range") {
      nextReps = scheme.minReps;
    } else if (scheme.type === "custom" && Array.isArray(scheme.reps)) {
      nextReps = scheme.reps[0];
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
