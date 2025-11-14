
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

  // Check if weight is involved (not bodyweight exercise)
  const hasWeight = session?.target?.weight > 0 || weights.some(w => w > 0);
  const setsCount = session?.target?.sets || sets.length;
  const hasManySets = setsCount > 5;

  let metTarget = false;
  let toppedOut = false;
  let withinTolerance = false; // For high rep exercises, within 2 reps is acceptable
  
  if (repScheme.type === "fixed") {
    const need = repScheme.targetReps;
    const targetReps = need;
    const isHighRepExercise = targetReps > 5;
    const tolerance = targetReps === 15 ? 3 : 2; // 15 rep exercises: within 3, others: within 2
    
    if (hasWeight && hasManySets) {
      // For exercises with >5 sets: ALL sets must meet target
      metTarget = sets.length === setsCount && sets.every(s => (s.reps ?? 0) >= targetReps);
      
      // Check if all sets are within tolerance (for high rep exercises)
      if (isHighRepExercise && !metTarget) {
        const minAcceptable = targetReps - tolerance;
        withinTolerance = sets.length === setsCount && 
          sets.every(s => (s.reps ?? 0) >= minAcceptable);
      }
    } else {
      // For exercises with <=5 sets: Only top set needs to meet target
      if (reps.length > 0) {
        const topSetReps = Math.max(...reps);
        metTarget = topSetReps >= targetReps;
        
        // Check if top set is within tolerance (for high rep exercises)
        if (isHighRepExercise && !metTarget) {
          const minAcceptable = targetReps - tolerance;
          withinTolerance = topSetReps >= minAcceptable;
        }
      }
    }
    toppedOut = metTarget; // same concept for fixed
  } else { // range
    const minR = repScheme.minReps;
    const maxR = repScheme.maxReps;
    const isHighRepExercise = minR > 5;
    const tolerance = maxR === 15 ? 3 : 2;
    
    if (hasWeight && hasManySets) {
      // Must have all sets and each must meet minimum
      metTarget = sets.length === setsCount && sets.every(s => (s.reps ?? 0) >= minR);
      toppedOut = sets.length === setsCount && sets.every(s => (s.reps ?? 0) >= maxR);
      
      // Check if all sets are within tolerance (for high rep exercises)
      if (isHighRepExercise && !metTarget) {
        const minAcceptable = minR - tolerance;
        withinTolerance = sets.length === setsCount && 
          sets.every(s => (s.reps ?? 0) >= minAcceptable);
      }
    } else {
      // Only top set matters for <=5 sets
      if (reps.length > 0) {
        const topSetReps = Math.max(...reps);
        metTarget = topSetReps >= minR;
        toppedOut = topSetReps >= maxR;
        
        // Check if top set is within tolerance (for high rep exercises)
        if (isHighRepExercise && !metTarget) {
          const minAcceptable = minR - tolerance;
          withinTolerance = topSetReps >= minAcceptable;
        }
      }
    }
  }

  const lastTargetWeight = session?.target?.weight ?? (weights.length ? weights[0] : 0);

  return { metTarget, toppedOut, avgRPE, lastTargetWeight, withinTolerance };
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

  // Check max weight constraint even for initial recommendation
  const MAX_DUMBBELL_WEIGHT = 90;
  const isBodyweightExercise = def?.modality === 'bodyweight' || 
    /pull.?up|chin.?up|push.?up|hanging/i.test(def?.name || '');
  const isDumbbellExercise = !isBodyweightExercise;

  if (isDumbbellExercise && nextWeight > MAX_DUMBBELL_WEIGHT) {
    // Cap initial weight at max and adjust reps/sets if needed
    nextWeight = MAX_DUMBBELL_WEIGHT;
    // For initial recommendation, try to increase reps to maintain difficulty
    if (nextReps < 12) {
      // Get 1RM percentage for current reps
      function get1RMPercentage(reps) {
        const repToPercentage = {
          1: 1.0, 2: 0.97, 3: 0.94, 4: 0.92, 5: 0.89, 6: 0.86, 7: 0.83,
          8: 0.81, 9: 0.78, 10: 0.75, 11: 0.73, 12: 0.71, 13: 0.7, 14: 0.68, 15: 0.67
        };
        if (reps >= 15) return 0.67;
        if (reps < 1) return 1.0;
        return repToPercentage[Math.round(reps)] || 0.67;
      }
      
      const originalWeight = def.startWeight ?? 0;
      const originalReps = nextReps;
      const target1RM = originalWeight / get1RMPercentage(originalReps);
      const targetPercentage = MAX_DUMBBELL_WEIGHT / target1RM;
      
      // Find equivalent rep count
      let newReps = originalReps;
      for (let r = originalReps + 1; r <= 12; r++) {
        const repPct = get1RMPercentage(r);
        if (repPct >= targetPercentage) {
          newReps = r;
        } else {
          break;
        }
      }
      
      if (newReps > originalReps) {
        nextReps = newReps;
      } else {
        // Can't increase reps enough, add a set
        nextReps = Math.min(originalReps + 1, 12);
        nextSets = nextSets + 1;
      }
    } else {
      // Already at 12 reps, add a set
      nextSets = nextSets + 1;
    }
  }

  if (!last) {
    const reason = isDumbbellExercise && def.startWeight > MAX_DUMBBELL_WEIGHT
      ? `No history found. Starting weight capped at ${MAX_DUMBBELL_WEIGHT}lb (max per hand) with adjusted reps/sets.`
      : `No history found. Starting at ${nextWeight} with base scheme.`;
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
      // Special handling for pull-ups: add weight if all sets completed
      const isPullUp = /pull.?up|chin.?up/i.test(def?.name || '') || 
                       def?.exerciseId === 'pullUp' || 
                       def?.exerciseId === 'chinUps';
      
      if (isPullUp) {
        if (nextWeight === 0) {
          // Pull-ups start at bodyweight (0), add weight when all sets completed
          nextWeight = roundTo(inc, rounding); // Start with increment (e.g., 2.5 lbs)
          reason = `Hit all sets at target reps. Adding ${nextWeight}lb weight for progression.`;
        } else {
          // Already weighted, continue normal progression
          let delta = inc;
          if (typeof summary.avgRPE === "number") {
            if (summary.avgRPE >= 9.5) delta = inc * 0.5;
            else if (summary.avgRPE <= 7.5) delta = inc * 1.5;
          }
          nextWeight = roundTo(nextWeight + delta, rounding);
          reason = `Hit all sets at target reps last time${summary.avgRPE ? ` (avg RPE ${summary.avgRPE.toFixed(1)})` : ""}. +${roundTo(nextWeight - summary.lastTargetWeight, rounding)} progression.`;
        }
      } else {
        // RPE-aware adjustment for other exercises
        let delta = inc;
        if (typeof summary.avgRPE === "number") {
          if (summary.avgRPE >= 9.5) delta = inc * 0.5;
          else if (summary.avgRPE <= 7.5) delta = inc * 1.5;
        }
        nextWeight = roundTo(nextWeight + delta, rounding);
        reason = `Hit all sets at target reps last time${summary.avgRPE ? ` (avg RPE ${summary.avgRPE.toFixed(1)})` : ""}. +${roundTo(nextWeight - summary.lastTargetWeight, rounding)} progression.`;
      }
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
    // For high rep exercises (>5 reps), if within tolerance, don't decrease weight
    const targetReps = scheme.type === "fixed" ? scheme.targetReps : scheme.minReps;
    const isHighRepExercise = targetReps > 5;
    
    if (summary.withinTolerance && isHighRepExercise) {
      // Within tolerance (within 2 reps for most, within 3 for 15 rep exercises)
      // Don't decrease weight, just repeat
      reason = `Within acceptable range (${targetReps - (targetReps === 15 ? 3 : 2)}+ reps). Repeat the weight.`;
      nextWeight = summary.lastTargetWeight ?? nextWeight;
    } else if (failureStreak >= failPolicy.repeatFailures) {
      // Missed target too many times, deload
      nextWeight = roundTo(nextWeight * (1 - failPolicy.deloadPercent), rounding);
      reason = `Missed target ${failureStreak} times. Deload ${Math.round(failPolicy.deloadPercent*100)}%.`;
    } else {
      // Missed target but not enough times to deload, repeat weight
      reason = `Missed target. Repeat the weight.`;
    }

    if (scheme.type === "fixed") {
      nextReps = scheme.targetReps;
    } else {
      nextReps = scheme.minReps;
    }
    nextSets = scheme.sets;
  }

  // Handle maximum weight constraint for dumbbell exercises (90 lbs per hand)
  // All exercises are dumbbell exercises except bodyweight exercises (pull-ups, chin-ups, etc.)
  // Note: isBodyweightExercise and isDumbbellExercise are already defined above for initial recommendation

  if (isDumbbellExercise && nextWeight > MAX_DUMBBELL_WEIGHT) {
    const lastWeight = summary.lastTargetWeight ?? nextWeight;
    const lastReps = last?.target?.reps ?? nextReps;
    const lastSets = last?.target?.sets ?? nextSets;
    
    // Get 1RM percentage for current reps
    function get1RMPercentage(reps) {
      const repToPercentage = {
        1: 1.0, 2: 0.97, 3: 0.94, 4: 0.92, 5: 0.89, 6: 0.86, 7: 0.83,
        8: 0.81, 9: 0.78, 10: 0.75, 11: 0.73, 12: 0.71, 13: 0.7, 14: 0.68, 15: 0.67
      };
      if (reps >= 15) return 0.67;
      if (reps < 1) return 1.0;
      return repToPercentage[Math.round(reps)] || 0.67;
    }
    
    // Calculate the target 1RM from the would-be weight at current reps
    const target1RM = nextWeight / get1RMPercentage(lastReps);
    
    // Calculate equivalent rep increase: find reps where MAX_WEIGHT gives similar 1RM
    // We want: MAX_WEIGHT / get1RMPercentage(newReps) ≈ target1RM
    // So: get1RMPercentage(newReps) ≈ MAX_WEIGHT / target1RM
    const targetPercentage = MAX_DUMBBELL_WEIGHT / target1RM;
    
    // Try to increase reps first (up to 12 max)
    if (lastReps < 12) {
      // Find the rep count that gives equivalent difficulty at max weight
      let newReps = lastReps;
      for (let r = lastReps + 1; r <= 12; r++) {
        const repPct = get1RMPercentage(r);
        // If this rep count's percentage is >= target, it's a valid progression
        if (repPct >= targetPercentage) {
          newReps = r;
        } else {
          break; // Stop if we've gone too far
        }
      }
      
      if (newReps > lastReps) {
        // Can increase reps to maintain progression
        nextWeight = MAX_DUMBBELL_WEIGHT;
        nextReps = newReps;
        nextSets = lastSets;
        reason = `Weight would exceed ${MAX_DUMBBELL_WEIGHT}lb limit. Increasing reps to ${newReps} (at ${MAX_DUMBBELL_WEIGHT}lb) to maintain progression.`;
      } else {
        // Can't increase reps enough, add a set instead
        nextWeight = MAX_DUMBBELL_WEIGHT;
        nextReps = Math.min(lastReps + 1, 12); // Still try to add 1 rep if possible
        nextSets = lastSets + 1;
        reason = `Weight would exceed ${MAX_DUMBBELL_WEIGHT}lb limit. Increasing reps to ${nextReps} and adding a set (${nextSets} total) to maintain progression.`;
      }
    } else {
      // Already at 12 reps, add a set
      nextWeight = MAX_DUMBBELL_WEIGHT;
      nextReps = 12;
      nextSets = lastSets + 1;
      reason = `Weight would exceed ${MAX_DUMBBELL_WEIGHT}lb limit and reps at max (12). Adding a set (${nextSets} total) to maintain progression.`;
    }
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
