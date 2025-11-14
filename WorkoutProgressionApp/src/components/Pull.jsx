// src/components/Pull.jsx
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
    exerciseId: 'pullUp',
    name: 'Pull Up',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 0,
    repScheme: { type: 'fixed', targetReps: 10, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'bodyweight',
    rest: '3 min',
  },
  {
    exerciseId: 'dumbbellBentOverRow',
    name: 'Dumbbell Bent Over Row',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 45,
    repScheme: { type: 'fixed', targetReps: 12, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    rest: '2 min',
  },
  {
    exerciseId: 'dumbbellRearDeltRaise',
    name: 'Dumbbell Rear Delt Raise',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 17.5,
    repScheme: { type: 'fixed', targetReps: 15, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    rest: '1 min',
  },
  {
    exerciseId: 'bicepCurls',
    name: 'Bicep Curls',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 30,
    repScheme: { type: 'fixed', targetReps: 8, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    rest: '1 min',
  },
  {
    exerciseId: 'concentrationCurl',
    name: 'Concentration Curl',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 22.5,
    repScheme: { type: 'fixed', targetReps: 12, sets: 2 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    rest: '1 min',
  },
];

export default function Pull({ userId = 'demoUser', onViewHistory, onWorkoutSaved }) {
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
      type: 'pull',
      dayType: 'pull',
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
    <div className='pull-workout'>
      <h3>Pull Day Workout</h3>
      <div className='exercise-list'>
        {loading ? (
          <p>Loading...</p>
        ) : (
          items.map((rec, idx) => (
            <ExerciseCard
              key={defs[idx].exerciseId}
              userId={userId}
              dayType='pull'
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
