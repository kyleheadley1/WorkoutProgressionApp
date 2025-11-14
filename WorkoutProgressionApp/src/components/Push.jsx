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

const defs = [
  {
    exerciseId: 'dumbbellBenchPress',
    name: 'Dumbbell Bench Press',
    increment: 5,
    rounding: 2.5,
    startWeight: 50,
    repScheme: { type: 'fixed', targetReps: 5, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    rest: '3 min',
  },
  {
    exerciseId: 'larsenPress',
    name: 'Larsen Press',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 45,
    repScheme: { type: 'fixed', targetReps: 10, sets: 2 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    rest: '3 min',
  },
  {
    exerciseId: 'standingArnoldPress',
    name: 'Standing Arnold Press',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 25,
    repScheme: { type: 'range', minReps: 8, maxReps: 10, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    rest: '2 min',
  },
  {
    exerciseId: 'deficitPushups',
    name: 'Deficit Push-ups',
    increment: 5,
    rounding: 2.5,
    startWeight: 0,
    repScheme: { type: 'range', minReps: 12, maxReps: 15, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    rest: '30 sec',
  },
  {
    exerciseId: 'lateralRaises',
    name: 'Lateral Raises',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 10,
    repScheme: { type: 'range', minReps: 12, maxReps: 15, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    rest: '1 min',
  },
  {
    exerciseId: 'skullCrushers',
    name: 'Skull-crushers',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 20,
    repScheme: { type: 'fixed', targetReps: 15, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    rest: '1 min',
  },
  {
    exerciseId: 'overheadTricepExtension',
    name: 'Overhead Tricep Extension',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 15,
    repScheme: { type: 'fixed', targetReps: 12, sets: 2 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    rest: '1 min',
  },
];

export default function Push({
  userId = 'demoUser',
  onViewHistory,
  onWorkoutSaved,
}) {
  const { items, loading } = useRecommendations(userId, defs);
  const [exerciseData, setExerciseData] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleDataChange = (exerciseId, data) => {
    setExerciseData((prev) => ({
      ...prev,
      [exerciseId]: data,
    }));
  };

  const handleSaveEntireWorkout = async () => {
    if (saving) return;
    setSaving(true);

    // Collect all exercise data
    const exercises = Object.values(exerciseData)
      .filter((data) => data && data.sets && data.sets.length > 0)
      .map((data) => ({
        exerciseId: data.exerciseId,
        target: data.target,
        sets: data.sets,
      }));

    if (exercises.length === 0) {
      toast.error(
        'No exercises to save. Please fill in at least one exercise.'
      );
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
      const created = await api.createWorkout(session);
      toast.success('Entire workout saved ✅');
      onWorkoutSaved?.(created);
      // Reset exercise data
      setExerciseData({});
    } catch (e) {
      enqueueSession(session);
      toast.error('Offline? Saved locally — will sync automatically.');
      onWorkoutSaved?.({ error: e.message });
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
          {saving ? 'Saving...' : 'Save Entire Workout'}
        </button>
      </div>
    </div>
  );
}
