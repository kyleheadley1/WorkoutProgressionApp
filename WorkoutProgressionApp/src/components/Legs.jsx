// src/components/Legs.jsx
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
    exerciseId: 'bulgarianSplitSquats',
    name: 'Bulgarian Split Squats',
    increment: 5,
    rounding: 2.5,
    startWeight: 30,
    repScheme: { type: 'fixed', targetReps: 4, sets: 4 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'bulgarianSplitSquatsPause',
    name: 'Bulgarian Split Squats (Pause)',
    increment: 5,
    rounding: 2.5,
    startWeight: 20,
    repScheme: { type: 'fixed', targetReps: 5, sets: 2 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'romanianDeadlifts',
    name: 'Romanian Deadlifts',
    increment: 5,
    rounding: 2.5,
    startWeight: 95,
    repScheme: { type: 'fixed', targetReps: 10, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'dumbbellGobletSquat',
    name: 'Dumbbell Goblet Squat',
    increment: 5,
    rounding: 2.5,
    startWeight: 60,
    repScheme: { type: 'range', minReps: 10, maxReps: 12, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'calfRaises',
    name: 'Calf Raises',
    increment: 5,
    rounding: 2.5,
    startWeight: 50,
    repScheme: { type: 'range', minReps: 15, maxReps: 20, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'weightedCrunches',
    name: 'Weighted Crunches',
    increment: 5,
    rounding: 2.5,
    startWeight: 20,
    repScheme: { type: 'range', minReps: 12, maxReps: 20, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
  },
];

export default function Legs({
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
      type: 'legs',
      dayType: 'legs',
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
    <div className='legs-workout'>
      <h3>Leg Day</h3>
      <div className='exercise-list'>
        {loading ? (
          <p>Loading...</p>
        ) : (
          items.map((rec, idx) => (
            <ExerciseCard
              key={defs[idx].exerciseId}
              userId={userId}
              dayType='legs'
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
