// src/components/ExerciseCard.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { saveSession } from '../lib/storage';
import { canonicalizeExerciseId } from '../lib/aliases';
import { api } from '../lib/api';
import { enqueueSession } from '../lib/offlineQueue';
import { useToast } from './ToastProvider';
import { useProfile } from '../contexts/ProfileContext';
import {
  convertToLbs,
  convertFromLbs,
  roundForDisplay,
  getWeightStep,
  getWeightUnitLabel,
} from '../lib/weightUtils';

/** Map client dayType → server enum */
function mapDayTypeToServer(dayType) {
  switch ((dayType || '').toLowerCase()) {
    case 'push':
    case 'pull':
    case 'legs':
      return dayType.toLowerCase();
    case 'upper':
    case 'upper body':
      return 'Upper Body';
    case 'lower':
    case 'lower body':
      return 'Lower Body';
    case 'full':
    case 'full body':
      return 'Full Body';
    default:
      return 'Full Body';
  }
}

/** Epley 1RM estimate for charts (weight, reps) */
export function est1RM(weight, reps) {
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return null;
  return Math.round(weight * (1 + reps / 30));
}

/** Round to nearest step (e.g., 2.5) */
function roundToStep(value, step = 2.5) {
  if (!isFinite(value)) return 0;
  return Math.round(value / step) * step;
}

/**
 * Get 1RM percentage based on rep count
 * Based on standard 1RM percentage table
 */
function get1RMPercentage(reps) {
  const repToPercentage = {
    1: 1.0, // 100%
    2: 0.97, // 97%
    3: 0.94, // 94%
    4: 0.92, // 92%
    5: 0.89, // 89%
    6: 0.86, // 86%
    7: 0.83, // 83%
    8: 0.81, // 81%
    9: 0.78, // 78%
    10: 0.75, // 75%
    11: 0.73, // 73%
    12: 0.71, // 71%
    13: 0.7, // 70%
    14: 0.68, // 68%
    15: 0.67, // 67%
  };

  // For reps > 15, use 67% (same as 15 reps)
  // For reps < 1, use 100%
  if (reps >= 15) return 0.67;
  if (reps < 1) return 1.0;

  return repToPercentage[Math.round(reps)] || 0.67;
}

/**
 * Calculate weight for a given rep count based on a reference weight and rep count
 * @param {number} referenceWeight - Weight used for reference rep count
 * @param {number} referenceReps - Rep count for reference weight
 * @param {number} targetReps - Rep count to calculate weight for
 * @returns {number} Calculated weight for target reps
 */
function calculateWeightFrom1RM(referenceWeight, referenceReps, targetReps) {
  if (
    !Number.isFinite(referenceWeight) ||
    !Number.isFinite(referenceReps) ||
    !Number.isFinite(targetReps)
  ) {
    return referenceWeight;
  }

  const referencePercentage = get1RMPercentage(referenceReps);
  const targetPercentage = get1RMPercentage(targetReps);

  // Calculate 1RM from reference
  const estimated1RM = referenceWeight / referencePercentage;

  // Calculate weight for target reps
  return estimated1RM * targetPercentage;
}

/** Row UI for a single set. value.weight is always stored in lbs. */
function SetRow({
  idx,
  value,
  onChange,
  isWarmup = false,
  weightUnit = 'lb',
  weightLabel = null,
}) {
  const onReps = (e) =>
    onChange(idx, { ...value, reps: Number(e.target.value) || 0 });
  const displayWeight =
    weightUnit === 'kg'
      ? roundForDisplay(convertFromLbs(value.weight, 'kg'), 'kg')
      : value.weight;
  const onWeight = (e) => {
    const inputVal = Number(e.target.value) || 0;
    const lbs = convertToLbs(inputVal, weightUnit);
    onChange(idx, { ...value, weight: lbs });
  };

  const label = weightLabel ?? `Weight (${getWeightUnitLabel(weightUnit)})`;

  return (
    <div className={`set-row ${isWarmup ? 'warmup-set' : ''}`}>
      <div className='set-idx'>
        {idx + 1}
        {isWarmup && <span className='warmup-badge'>W</span>}
      </div>
      <div className='set-cell'>
        <label>Reps</label>
        <input
          type='number'
          min='0'
          step='1'
          value={value.reps}
          onChange={onReps}
        />
      </div>
      <div className='set-cell'>
        <label>{label}</label>
        <input
          type='number'
          min='0'
          step={getWeightStep(weightUnit)}
          value={displayWeight}
          onChange={onWeight}
        />
      </div>
      <div className='set-cell e1rm'>
        <label>est-1RM</label>
        <div className='ghost'>
          {est1RM(value.weight, value.reps) != null
            ? `${Math.round(est1RM(value.weight, value.reps))} lb`
            : '—'}
        </div>
      </div>
    </div>
  );
}

export default function ExerciseCard({
  userId,
  dayType,
  def,
  recommendation,
  onSaved,
  onViewHistory,
  onDataChange,
}) {
  const toast = useToast();
  const { profile } = useProfile();
  const weightUnit = profile.weightUnit || 'lb';
  const { exerciseId, name, repScheme } = def;
  const { recommended } = recommendation || {};
  const restPeriod = def.rest ?? def.restPeriod ?? def.restTime ?? null;

  // Check for exercises that need warmup sets
  const hasWarmups = def?.hasWarmups || exerciseId === 'dumbbellBenchPress';
  const warmupPercentages = useMemo(() => {
    return (
      def?.warmupPercentages ||
      (exerciseId === 'dumbbellBenchPress' ? [0.45, 0.65, 0.85] : [])
    );
  }, [def?.warmupPercentages, exerciseId]);
  const numWarmups = warmupPercentages.length;

  const baseSetsCount = recommended?.sets || repScheme?.sets || 3;
  const workingSetsCount =
    repScheme?.type === 'custom'
      ? repScheme.reps?.length || repScheme.sets
      : baseSetsCount;
  const setsCount = hasWarmups ? numWarmups + workingSetsCount : baseSetsCount;

  // Handle special rep schemes
  const isCustomRepScheme =
    repScheme?.type === 'custom' && Array.isArray(repScheme.reps);
  const isAMRAP = repScheme?.type === 'amrap';
  const targetReps = isCustomRepScheme
    ? repScheme.reps[0] // Use first rep count as default
    : (repScheme?.targetReps ?? repScheme?.minReps ?? 10);

  // Derive "per-hand" display if this is a dumbbell movement
  const isDumbbell =
    def?.modality === 'dumbbell' ||
    /dumbbell/i.test(name) ||
    /db\b/i.test(name);

  const recTotal = Number.isFinite(recommended?.weight)
    ? recommended.weight
    : (def.startWeight ?? 0);
  // For dumbbell exercises, recTotal is already per-hand weight

  // Calculate warmup weights
  const rounding = def.rounding ?? 2.5;
  const warmupWeights = useMemo(() => {
    if (hasWarmups && warmupPercentages.length > 0) {
      return warmupPercentages.map((percent) =>
        roundToStep(recTotal * percent, rounding),
      );
    }
    return [];
  }, [hasWarmups, warmupPercentages, recTotal, rounding]);

  // Initialize sets with warmups if needed
  const initializeSets = useMemo(() => {
    if (hasWarmups && warmupWeights.length > 0) {
      const warmupSets = warmupWeights.map((weight) => ({
        reps: targetReps, // Warmups use same reps as working sets
        weight,
        isWarmup: true,
      }));

      // Add working sets
      if (isCustomRepScheme && repScheme.reps) {
        // Close grip incline: different reps per set
        // recTotal is the weight for the first rep count
        const firstReps = repScheme.reps[0];
        const workingSets = repScheme.reps.map((reps) => {
          // Calculate weight based on 1RM percentage table
          const calculatedWeight = calculateWeightFrom1RM(
            recTotal,
            firstReps,
            reps,
          );
          const weight = roundToStep(calculatedWeight, rounding);
          return {
            reps,
            weight,
            isWarmup: false,
          };
        });
        return [...warmupSets, ...workingSets];
      } else if (isAMRAP) {
        // AMRAP: just one set
        return [
          {
            reps: 0, // User will fill in actual reps
            weight: 0,
            isWarmup: false,
          },
        ];
      } else {
        // Regular working sets
        const workingSets = Array.from({ length: workingSetsCount }, () => ({
          reps: targetReps,
          weight: recTotal,
          isWarmup: false,
        }));
        return [...warmupSets, ...workingSets];
      }
    }

    // No warmups - regular sets
    if (isCustomRepScheme && repScheme.reps) {
      // recTotal is the weight for the first rep count
      const firstReps = repScheme.reps[0];
      return repScheme.reps.map((reps) => {
        // Calculate weight based on 1RM percentage table
        const calculatedWeight = calculateWeightFrom1RM(
          recTotal,
          firstReps,
          reps,
        );
        const weight = roundToStep(calculatedWeight, rounding);
        return {
          reps,
          weight,
          isWarmup: false,
        };
      });
    } else if (isAMRAP) {
      return [
        {
          reps: 0,
          weight: 0,
          isWarmup: false,
        },
      ];
    }

    return Array.from({ length: setsCount }, () => ({
      reps: targetReps,
      weight: recTotal,
      isWarmup: false,
    }));
  }, [
    hasWarmups,
    warmupWeights,
    workingSetsCount,
    targetReps,
    recTotal,
    setsCount,
    isCustomRepScheme,
    repScheme,
    rounding,
    isAMRAP,
  ]);

  // Actual logging rows (what the user performs)
  const [sets, setSets] = useState(initializeSets);

  // Update sets when recommendation changes
  useEffect(() => {
    setSets(initializeSets);
  }, [initializeSets]);

  // Expose current data to parent component
  useEffect(() => {
    if (onDataChange) {
      const exerciseData = {
        exerciseId,
        sets: sets.map((s, i) => ({
          setNumber: i + 1,
          reps: Number(s.reps) || 0,
          weight: Number(s.weight) || 0,
          isWarmup: s.isWarmup || false,
        })),
        target: {
          weight: recTotal,
          reps: targetReps,
          sets: sets.length,
        },
      };
      onDataChange(exerciseId, exerciseData);
    }
  }, [sets, exerciseId, recTotal, targetReps, onDataChange]);
  const [saving, setSaving] = useState(false);
  const serverType = useMemo(() => mapDayTypeToServer(dayType), [dayType]);

  const updateSet = (i, v) => {
    setSets((old) => {
      const next = old.slice();
      // Preserve isWarmup flag if not explicitly set
      next[i] = {
        ...v,
        isWarmup:
          v.isWarmup !== undefined ? v.isWarmup : old[i]?.isWarmup || false,
      };
      return next;
    });
  };
  const addSet = () =>
    setSets((s) => [
      ...s,
      { reps: targetReps, weight: recTotal, isWarmup: false },
    ]);
  const removeLast = () => setSets((s) => (s.length > 1 ? s.slice(0, -1) : s));

  async function handleSave() {
    if (saving) return;
    setSaving(true);

    const payloadSets = sets.map((s, i) => ({
      setNumber: i + 1,
      reps: Number(s.reps) || 0,
      weight: Number(s.weight) || 0,
    }));

    const session = {
      userId: userId ?? undefined,
      type: serverType,
      date: new Date().toISOString(),
      exercises: [
        {
          exerciseId: canonicalizeExerciseId(exerciseId),
          target: { weight: recTotal, reps: targetReps, sets: sets.length },
          sets: payloadSets,
        },
      ],
    };

    try {
      saveSession(session);
    } catch (e) {
      console.error('Failed to save locally:', e);
    }

    try {
      const created = await api.createWorkout(session);
      toast.success('Workout saved ✅');
      onSaved?.(created);
      // Optional: reset rows to default after save
      setSets(initializeSets);
    } catch (e) {
      enqueueSession(session);
      toast.error('Offline? Saved locally — will sync automatically.');
      onSaved?.({ error: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='strong-card'>
      <div className='strong-header'>
        <div className='title-group'>
          <div className='title'>{name}</div>
          {restPeriod && <div className='rest-pill'>Rest {restPeriod}</div>}
        </div>
        {onViewHistory && (
          <button
            className='history-btn'
            onClick={() => onViewHistory(exerciseId, name)}
            title='View history'
          >
            History
          </button>
        )}
      </div>

      {/* Recommended panel */}
      <div className='recommend-strip'>
        <div className='pill'>Type: {serverType}</div>
        <div className='pill'>
          Recommended:{' '}
          <b>
            {weightUnit === 'kg'
              ? isDumbbell
                ? `${roundForDisplay(convertFromLbs(recTotal, 'kg'), 'kg')} kg / hand`
                : `${roundForDisplay(convertFromLbs(recTotal, 'kg'), 'kg')} kg`
              : isDumbbell
                ? `${recTotal} lb / hand`
                : `${recTotal} lb`}
          </b>
        </div>
        <div className='pill'>
          Sets: <b>{setsCount}</b>
          {hasWarmups && numWarmups > 0 && (
            <span style={{ marginLeft: 4, opacity: 0.8 }}>
              ({numWarmups} warmup{numWarmups > 1 ? 's' : ''} +{' '}
              {workingSetsCount} working)
            </span>
          )}
        </div>
        {isAMRAP && (
          <div className='pill'>
            Target: <b>{targetReps}+</b>
          </div>
        )}
        <div className='reason'>{recommended?.reason}</div>
      </div>

      {/* Set list (what you actually did) */}
      <div className='setlist'>
        {sets.map((s, i) => (
          <SetRow
            key={i}
            idx={i}
            value={s}
            onChange={updateSet}
            isWarmup={s.isWarmup || false}
            weightUnit={weightUnit}
            weightLabel={
              isDumbbell
                ? `Weight (${getWeightUnitLabel(weightUnit)} / hand)`
                : null
            }
          />
        ))}
        <div className='setlist-actions'>
          <button onClick={addSet} className='ghost-btn'>
            + Add Set
          </button>
          <button onClick={removeLast} className='ghost-btn'>
            − Remove Last
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleSave}
            disabled={saving}
            className='primary-btn'
          >
            {saving ? 'Saving...' : 'Save Sets'}
          </button>
        </div>
      </div>
    </div>
  );
}
