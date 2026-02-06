// src/components/Push.jsx
import React, { useState } from 'react';
import ExerciseCard from './ExerciseCard';
import { useRecommendations } from '../hooks/useRecommendations';
import { saveSession } from '../lib/storage';
import { api } from '../lib/api';
import { enqueueSession } from '../lib/offlineQueue';
import { useToast } from './ToastProvider';
import '../components/workout.css';

// Prefer rear delts only on pull days per user's preference, so no rear delts here.
const defaultDefs = [
  {
    exerciseId: 'dumbbellBenchPress',
    name: 'Dumbbell Bench Press',
    increment: 5,
    rounding: 2.5,
    startWeight: 50,
    repScheme: { type: 'fixed', targetReps: 5, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'larsenPress',
    name: 'Larsen Press',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 45,
    repScheme: { type: 'fixed', targetReps: 10, sets: 2 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'standingArnoldPress',
    name: 'Standing Arnold Press',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 25,
    repScheme: { type: 'range', minReps: 8, maxReps: 10, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'deficitPushups',
    name: 'Deficit Push-ups',
    increment: 5,
    rounding: 2.5,
    startWeight: 0,
    repScheme: { type: 'range', minReps: 12, maxReps: 15, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'lateralRaises',
    name: 'Lateral Raises',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 10,
    repScheme: { type: 'range', minReps: 12, maxReps: 15, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'skullCrushers',
    name: 'Skull-crushers',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 20,
    repScheme: { type: 'fixed', targetReps: 15, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'tricepKickback',
    name: 'Single-arm Tricep Kickback',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 15,
    repScheme: { type: 'fixed', targetReps: 12, sets: 2 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
];

export default function Push({
  userId = 'demoUser',
  onViewHistory,
  defs: defsProp,
}) {
  const defs = defsProp ?? defaultDefs;
  const { items, loading } = useRecommendations(userId, defs);
  const [exerciseData, setExerciseData] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleDataChange = (exerciseId, data) => {
    setExerciseData((prev) => ({ ...prev, [exerciseId]: data }));
  };

  const handleSaveEntireWorkout = async () => {
    if (saving) return;
    setSaving(true);
    const exercises = Object.values(exerciseData)
      .filter(
        (data) =>
          data?.sets?.length > 0 && data.sets.some((s) => Number(s.reps) > 0),
      )
      .map((data) => ({
        exerciseId: data.exerciseId,
        target: data.target,
        sets: data.sets,
      }));
    if (exercises.length === 0) {
      toast.error('Fill in at least one set with reps to save.');
      setSaving(false);
      return;
    }
    const session = {
      userId,
      type: 'push',
      dayType: 'push',
      date: new Date().toISOString(),
      exercises,
    };
    try {
      saveSession(session);
    } catch (e) {
      console.error('Failed to save locally:', e);
    }
    try {
      await api.createWorkout(session);
      toast.success('Workout saved to history ✅');
      setExerciseData({});
    } catch {
      enqueueSession(session);
      toast.error('Saved locally — will sync when online.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='push-workout'>
      <h3>Push Day</h3>
      <div className='exercise-list'>
        {loading ? (
          <p>Loading...</p>
        ) : (
          items.map((rec, idx) => (
            <ExerciseCard
              key={defs[idx].exerciseId}
              userId={userId}
              dayType='push'
              def={defs[idx]}
              recommendation={rec}
              onViewHistory={onViewHistory}
              onDataChange={handleDataChange}
            />
          ))
        )}
      </div>
      <div className='workout-save-container'>
        <button
          onClick={handleSaveEntireWorkout}
          disabled={saving}
          className='save-entire-workout-btn'
        >
          {saving ? 'Saving...' : 'Save Workout to History'}
        </button>
      </div>
    </div>
  );
}
