// src/components/Upper.jsx
import React, { useState } from 'react';
import ExerciseCard from './ExerciseCard';
import { useRecommendations } from '../hooks/useRecommendations';
import { saveSession } from '../lib/storage';
import { api } from '../lib/api';
import { enqueueSession } from '../lib/offlineQueue';
import { useToast } from './ToastProvider';
import './workout.css';

const defaultDefs = [
  {
    exerciseId: 'pullUp',
    name: 'Pull Up',
    increment: 0,
    rounding: 0,
    startWeight: 0,
    repScheme: { type: 'fixed', targetReps: 10, sets: 2 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'bodyweight',
    rest: '3 min',
  },
  {
    exerciseId: 'closeGripInclineDumbbellPress',
    name: 'Close Grip Incline Dumbbell Press',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 40,
    // startWeight is for 8 reps (first set)
    // Weights for 5 reps and 12 reps will be calculated automatically using 1RM table
    repScheme: { type: 'custom', sets: 3, reps: [8, 5, 12] }, // Special: different reps per set
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    rest: '2 min',
  },
  {
    exerciseId: 'dumbbellRow',
    name: 'Dumbbell Row',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 45,
    repScheme: { type: 'fixed', targetReps: 12, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    rest: '2 min',
  },
  {
    exerciseId: 'dumbbellLateralRaise',
    name: 'Dumbbell Lateral Raise',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 25,
    repScheme: { type: 'fixed', targetReps: 12, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    rest: '1 min',
  },
  {
    exerciseId: 'dumbbellBicepCurl',
    name: 'Dumbbell Bicep Curl',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 25,
    repScheme: { type: 'fixed', targetReps: 12, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    rest: '1 min',
  },
  {
    exerciseId: 'diamondPushUp',
    name: 'Diamond Push Up',
    increment: 0,
    rounding: 0,
    startWeight: 0,
    repScheme: { type: 'fixed', targetReps: 25, sets: 1 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'bodyweight',
    rest: '1 min',
  },
];

export default function Upper({
  userId = 'demoUser',
  onViewHistory,
  onWorkoutSaved,
  defs: defsProp,
}) {
  const defs = defsProp ?? defaultDefs;
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
      toast.error(
        'No exercises to save. Please fill in at least one exercise.',
      );
      setSaving(false);
      return;
    }

    const session = {
      userId,
      type: 'upper',
      dayType: 'upper',
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
    <div className='upper-workout'>
      <h3>Upper Day</h3>
      <div className='exercise-list'>
        {loading ? (
          <p>Loading...</p>
        ) : defs.length === 0 ? (
          <p>Upper workout exercises to be added based on attachment.</p>
        ) : (
          items.map((rec, idx) => (
            <ExerciseCard
              key={defs[idx].exerciseId}
              userId={userId}
              dayType='upper'
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
