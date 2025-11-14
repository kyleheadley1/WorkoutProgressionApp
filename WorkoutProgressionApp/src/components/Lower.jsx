// src/components/Lower.jsx
import React, { useState } from 'react';
import ExerciseCard from './ExerciseCard';
import { useRecommendations } from '../hooks/useRecommendations';
import { saveSession } from '../lib/storage';
import { api } from '../lib/api';
import { enqueueSession } from '../lib/offlineQueue';
import { useToast } from './ToastProvider';
import './workout.css';

const defs = [
  {
    exerciseId: 'trapBarDeadlift',
    name: 'Dumbbell Deadlift',
    increment: 5,
    rounding: 2.5,
    startWeight: 120,
    repScheme: { type: 'fixed', targetReps: 5, sets: 4 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    rest: '3 min',
  },
  {
    exerciseId: 'dumbbellRomanianDeadlift',
    name: 'Dumbbell Romanian Deadlift',
    increment: 5,
    rounding: 2.5,
    startWeight: 50,
    repScheme: { type: 'fixed', targetReps: 8, sets: 2 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    rest: '3 min',
  },
  {
    exerciseId: 'dumbbellGobletSquat',
    name: 'Dumbbell Goblet Squat',
    increment: 5,
    rounding: 2.5,
    startWeight: 60,
    repScheme: { type: 'fixed', targetReps: 8, sets: 4 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    rest: '2 min',
  },
  {
    exerciseId: 'dumbbellStepUp',
    name: 'Dumbbell Step Up',
    increment: 5,
    rounding: 2.5,
    startWeight: 35,
    repScheme: { type: 'fixed', targetReps: 10, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    rest: '2 min',
  },
  {
    exerciseId: 'seatedDumbbellCalfRaise',
    name: 'Seated Dumbbell Calf Raise',
    increment: 5,
    rounding: 2.5,
    startWeight: 10,
    repScheme: { type: 'fixed', targetReps: 20, sets: 4 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    rest: '1 min',
  },
  {
    exerciseId: 'hangingLegRaise',
    name: 'Hanging Leg Raise',
    increment: 0,
    rounding: 0,
    startWeight: 0,
    repScheme: { type: 'fixed', targetReps: 8, sets: 5 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'bodyweight',
    rest: '1 min',
  },
];

export default function Lower({ userId = 'demoUser', onViewHistory, onWorkoutSaved }) {
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

    const exercises = Object.values(exerciseData)
      .filter((data) => data && data.sets && data.sets.length > 0)
      .map((data) => ({
        exerciseId: data.exerciseId,
        target: data.target,
        sets: data.sets,
      }));

    if (exercises.length === 0) {
      toast.error('No exercises to save. Please fill in at least one exercise.');
      setSaving(false);
      return;
    }

    const session = {
      userId,
      type: 'lower',
      dayType: 'lower',
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
    <div className='lower-workout'>
      <h3>Lower Day</h3>
      <div className='exercise-list'>
        {loading ? (
          <p>Loading...</p>
        ) : defs.length === 0 ? (
          <p>Lower workout exercises to be added based on attachment.</p>
        ) : (
          items.map((rec, idx) => (
            <ExerciseCard
              key={defs[idx].exerciseId}
              userId={userId}
              dayType='lower'
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

