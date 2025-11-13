// src/components/ExerciseCard.jsx
import React, { useMemo, useState } from 'react';
import { saveSession } from '../lib/storage';
import { api } from '../lib/api';
import { enqueueSession } from '../lib/offlineQueue';
import { useToast } from './ToastProvider';

/**
 * Map client dayType → server enum for Workout.type
 */
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

function parseCsvNumbers(csv, expectedLen) {
  if (!csv || !csv.trim()) return [];
  const nums = csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((v) => (v === '' ? null : Number(v)));
  if (Number.isFinite(expectedLen) && expectedLen > 0) {
    while (nums.length < expectedLen) nums.push(null);
    if (nums.length > expectedLen) nums.length = expectedLen;
  }
  return nums;
}

export default function ExerciseCard({
  userId,
  dayType,
  def,
  recommendation,
  onSaved,
}) {
  const toast = useToast();

  const { exerciseId, name, repScheme } = def;
  const { recommended } = recommendation || {};

  const setsCount = recommended?.sets || repScheme?.sets || 3;
  const defaultReps = repScheme?.targetReps ?? repScheme?.minReps ?? 8;

  const [weight, setWeight] = useState(
    Number.isFinite(recommended?.weight)
      ? recommended.weight
      : def.startWeight ?? 0
  );
  const [repsCsv, setRepsCsv] = useState(
    Array(setsCount).fill(defaultReps).join(',')
  );
  const [rpeCsv, setRpeCsv] = useState('');
  const [saving, setSaving] = useState(false);

  const serverType = useMemo(() => mapDayTypeToServer(dayType), [dayType]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);

    // Build sets payload
    const reps = parseCsvNumbers(repsCsv, setsCount);
    const rpes = parseCsvNumbers(rpeCsv, setsCount);
    const w = Number(weight);

    const sets = reps.map((r, i) => ({
      setNumber: i + 1,
      weight: Number.isFinite(w) ? w : 0,
      reps: Number.isFinite(r) ? r : defaultReps,
      ...(Number.isFinite(rpes[i]) ? { rpe: rpes[i] } : {}),
    }));

    const now = new Date();
    const session = {
      userId: userId ?? undefined,
      type: serverType,
      date: now.toISOString(),
      exercises: [
        {
          exerciseId,
          target: {
            weight: Number.isFinite(w) ? w : 0,
            reps: defaultReps,
            sets: setsCount,
          },
          sets,
        },
      ],
    };

    // Always save locally for offline continuity
    try {
      saveSession(session);
    } catch (e) {
      // Not fatal; still attempt server sync
      console.warn('Local save failed:', e);
    }

    try {
      const created = await api.createWorkout(session);

      // Success → toast + reset inputs to next default state (clean slate)
      toast.success('Workout saved ✅');
      if (typeof onSaved === 'function') onSaved(created);

      // Reset fields (common UX pattern after a submission)
      setRpeCsv('');
      setRepsCsv(Array(setsCount).fill(defaultReps).join(','));
      // leave weight as-is (likely user wants same weight on next exercise)
    } catch (e) {
      // Failure → enqueue for retry and notify the user
      enqueueSession(session);
      toast.error(
        'Couldn’t reach the server. Saved locally — I’ll retry automatically when you’re back online.'
      );
      if (typeof onSaved === 'function') onSaved({ error: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='exercise-card'>
      <div className='exercise-header'>
        <h3>{name}</h3>
        <div className='exercise-meta'>
          <span>Type: {serverType}</span>
          {recommended?.reason && (
            <em title={recommended.reason}> • {recommended.reason}</em>
          )}
        </div>
      </div>

      <div
        className='exercise-controls'
        style={{ display: 'grid', gap: 6, marginTop: 8 }}
      >
        <label>
          Weight
          <input
            type='number'
            step='0.5'
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
          />
        </label>

        <label>
          Reps per set (CSV)
          <input
            type='text'
            value={repsCsv}
            onChange={(e) => setRepsCsv(e.target.value)}
            placeholder={`e.g., ${Array(setsCount)
              .fill(defaultReps)
              .join(',')}`}
          />
        </label>

        <label>
          RPE per set (CSV, optional)
          <input
            type='text'
            value={rpeCsv}
            onChange={(e) => setRpeCsv(e.target.value)}
            placeholder={`e.g., ${Array(setsCount).fill(8).join(',')}`}
          />
        </label>

        <button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Sets'}
        </button>
      </div>
    </div>
  );
}
