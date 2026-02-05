// src/components/Pull.jsx
import React from 'react';
import ExerciseCard from './ExerciseCard';
import { useRecommendations } from '../hooks/useRecommendations';
import './workout.css';

// User prefers rear delt raises instead of face pulls.
const defs = [
  {
    exerciseId: 'pullUps',
    name: 'Pull-ups',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 0,
    repScheme: { type: 'fixed', targetReps: 10, sets: 4 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'rearDeltRaises',
    name: 'Rear Delt Raises',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 10,
    repScheme: { type: 'range', minReps: 12, maxReps: 15, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'latPulldowns',
    name: 'Lat Pulldowns',
    increment: 5,
    rounding: 2.5,
    startWeight: 80,
    repScheme: { type: 'range', minReps: 10, maxReps: 12, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'hammerCurls',
    name: 'Hammer Curls',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 20,
    repScheme: { type: 'range', minReps: 10, maxReps: 12, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
  {
    exerciseId: 'preacherCurls',
    name: 'Preacher Curls',
    increment: 2.5,
    rounding: 2.5,
    startWeight: 25,
    repScheme: { type: 'range', minReps: 10, maxReps: 12, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 },
  },
];

export default function Pull({ userId = 'demoUser', onViewHistory }) {
  const { items, loading } = useRecommendations(userId, defs);

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
            />
          ))
        )}
      </div>
    </div>
  );
}
