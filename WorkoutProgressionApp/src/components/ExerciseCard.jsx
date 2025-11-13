// src/components/ExerciseCard.jsx
import React, { useMemo, useState } from 'react';
import { saveSession } from '../lib/storage';
import { api } from '../lib/api';
import { enqueueSession } from '../lib/offlineQueue';
import { useToast } from './ToastProvider';

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

/** Row UI for a single set */
function SetRow({ idx, value, onChange }) {
  const onReps = (e) =>
    onChange(idx, { ...value, reps: Number(e.target.value) || 0 });
  const onWeight = (e) =>
    onChange(idx, { ...value, weight: Number(e.target.value) || 0 });
  const onRpe = (e) =>
    onChange(idx, {
      ...value,
      rpe: e.target.value === '' ? undefined : Number(e.target.value),
    });

  return (
    <div className='set-row'>
      <div className='set-idx'>{idx + 1}</div>
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
        <label>Weight</label>
        <input
          type='number'
          min='0'
          step='0.5'
          value={value.weight}
          onChange={onWeight}
        />
      </div>
      <div className='set-cell'>
        <label>RPE</label>
        <input
          type='number'
          min='0'
          max='10'
          step='0.5'
          value={value.rpe ?? ''}
          onChange={onRpe}
          placeholder='—'
        />
      </div>
      <div className='set-cell e1rm'>
        <label>est-1RM</label>
        <div className='ghost'>{est1RM(value.weight, value.reps) ?? '—'}</div>
      </div>
    </div>
  );
}

export default function ExerciseCard({
  userId,
  dayType, // 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full'
  def, // { exerciseId, name, repScheme, startWeight, modality? }
  recommendation, // { recommended: { weight, sets }, reason }
  onSaved,
}) {
  const toast = useToast();
  const { exerciseId, name, repScheme } = def;
  const { recommended } = recommendation || {};

  const setsCount = recommended?.sets || repScheme?.sets || 3;
  const targetReps = repScheme?.targetReps ?? repScheme?.minReps ?? 10;

  // Derive “per-hand” display if this is a dumbbell movement
  const isDumbbell =
    def?.modality === 'dumbbell' ||
    /dumbbell/i.test(name) ||
    /db\b/i.test(name);

  const recTotal = Number.isFinite(recommended?.weight)
    ? recommended.weight
    : def.startWeight ?? 0;
  const perHand = isDumbbell ? Math.max(0, recTotal / 2) : recTotal;

  // Actual logging rows (what the user performs)
  const [sets, setSets] = useState(
    Array.from({ length: setsCount }, () => ({
      reps: targetReps,
      weight: recTotal,
      rpe: undefined,
    }))
  );
  const [saving, setSaving] = useState(false);
  const serverType = useMemo(() => mapDayTypeToServer(dayType), [dayType]);

  const updateSet = (i, v) => {
    setSets((old) => {
      const next = old.slice();
      next[i] = v;
      return next;
    });
  };
  const addSet = () =>
    setSets((s) => [...s, { reps: targetReps, weight: recTotal }]);
  const removeLast = () => setSets((s) => (s.length > 1 ? s.slice(0, -1) : s));

  async function handleSave() {
    if (saving) return;
    setSaving(true);

    const payloadSets = sets.map((s, i) => ({
      setNumber: i + 1,
      reps: Number(s.reps) || 0,
      weight: Number(s.weight) || 0,
      ...(Number.isFinite(s.rpe) ? { rpe: s.rpe } : {}),
    }));

    const session = {
      userId: userId ?? undefined,
      type: serverType,
      date: new Date().toISOString(),
      exercises: [
        {
          exerciseId,
          target: { weight: recTotal, reps: targetReps, sets: sets.length },
          sets: payloadSets,
        },
      ],
    };

    try {
      saveSession(session);
    } catch {}

    try {
      const created = await api.createWorkout(session);
      toast.success('Workout saved ✅');
      onSaved?.(created);
      // Optional: reset rows to default after save
      setSets(
        Array.from({ length: setsCount }, () => ({
          reps: targetReps,
          weight: recTotal,
        }))
      );
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
        <div className='title'>{name}</div>
        <div className='howto'>How-To ▶</div>
      </div>

      {/* Recommended panel */}
      <div className='recommend-strip'>
        <div className='pill'>Type: {serverType}</div>
        <div className='pill'>
          Recommended:{' '}
          <b>{isDumbbell ? `${perHand} lb / hand` : `${recTotal} lb`}</b>
        </div>
        <div className='pill'>
          Sets: <b>{setsCount}</b>
        </div>
        <div className='reason'>{recommended?.reason}</div>
      </div>

      {/* Set list (what you actually did) */}
      <div className='setlist'>
        {sets.map((s, i) => (
          <SetRow key={i} idx={i} value={s} onChange={updateSet} />
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
