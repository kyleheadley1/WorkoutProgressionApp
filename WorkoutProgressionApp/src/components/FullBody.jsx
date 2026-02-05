// src/components/FullBody.jsx
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
    startWeight: 135,
    repScheme: { type: 'fixed', targetReps: 5, sets: 1 }, // 1 working set (3 warmups added separately)
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    hasWarmups: true,
    warmupPercentages: [0.5, 0.65, 0.85], // 3 warmup sets
    rest: '3 min',
  },
  {
    exerciseId: 'dumbbellRDL',
    name: 'Dumbbell RDL',
    increment: 5,
    rounding: 2.5,
    startWeight: 45,
    repScheme: { type: 'fixed', targetReps: 8, sets: 2 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
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
    exerciseId: 'chinUps',
    name: 'Chin-ups',
    increment: 0,
    rounding: 0,
    startWeight: 0,
    repScheme: { type: 'fixed', targetReps: 10, sets: 2 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'bodyweight',
    rest: '2 min',
  },
  {
    exerciseId: 'gobletSquats',
    name: 'Goblet Squats',
    increment: 5,
    rounding: 2.5,
    startWeight: 60,
    repScheme: { type: 'fixed', targetReps: 12, sets: 5 }, // 2 warmups + 3 working
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    hasWarmups: true,
    warmupPercentages: [0.5, 0.7], // 2 warmup sets
    rest: '2 min',
  },
  {
    exerciseId: 'singleArmDumbbellRow',
    name: 'Single Arm DB Row',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 30,
    repScheme: { type: 'fixed', targetReps: 12, sets: 4 }, // 2 warmups + 2 working
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'dumbbell',
    hasWarmups: true,
    warmupPercentages: [0.5, 0.7], // 2 warmup sets
    rest: '2 min',
  },
  {
    exerciseId: 'diamondPushups',
    name: 'Diamond Push-ups',
    increment: 0,
    rounding: 0,
    startWeight: 0,
    repScheme: { type: 'amrap', sets: 1 }, // AMRAP = As Many Reps As Possible
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
    modality: 'bodyweight',
    rest: '1 min',
  },
];

export default function FullBody({ userId = 'demoUser', onViewHistory, onWorkoutSaved }) {
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
      type: 'full',
      dayType: 'full',
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
    <div className='full-body-workout'>
      <h3>Full Body</h3>
      <div className='exercise-list'>
        {loading ? (
          <p>Loading...</p>
        ) : (
          items.map((rec, idx) => (
            <ExerciseCard
              key={defs[idx].exerciseId}
              userId={userId}
              dayType='full'
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

