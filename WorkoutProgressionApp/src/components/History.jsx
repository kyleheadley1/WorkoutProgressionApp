// src/components/History.jsx
import React, { useEffect, useState } from 'react';
import { getFriendlyName } from '../lib/aliases';
import { readSessions } from '../lib/storage';
import { api } from '../lib/api';

export default function History({ userId = 'demoUser' }) {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    let local = readSessions(userId);
    setWorkouts(local);

    (async () => {
      try {
        const serverData = await api.listWorkouts();
        if (serverData?.length) {
          const combined = [...serverData, ...local];
          const seen = new Set();
          const unique = combined.filter((w) => {
            const key = w.date + w.dayType;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          unique.sort((a, b) => new Date(b.date) - new Date(a.date));
          setWorkouts(unique);
        }
      } catch (e) {
        console.warn('Failed to load from server:', e.message);
      }
    })();
  }, [userId]);

  if (!workouts.length) {
    return (
      <div className='history-content'>
        <h2 className='history-page-title'>Workout History</h2>
        <div className='empty-state'>No workouts logged yet.</div>
      </div>
    );
  }

  return (
    <div className='history-content'>
      <h2 className='history-page-title'>Workout History</h2>
      <div className='workout-history-list'>
        {workouts.map((w, i) => (
          <div key={i} className='workout-entry history-workout-card'>
            <div className='workout-date-header'>
              <h2 className='history-workout-day'>
                {w.dayType?.toUpperCase() || 'Unknown'} —{' '}
                {new Date(w.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h2>
            </div>
            <div className='history-exercises'>
              {w.exercises?.map((ex, j) => (
                <div key={j} className='history-exercise-block'>
                  <strong className='history-exercise-name'>
                    {getFriendlyName(ex.exerciseId)}
                  </strong>
                  <div className='history-sets-summary'>
                    {ex.sets
                      ?.map(
                        (s) =>
                          `Set ${s.setNumber}: ${s.reps} reps @ ${s.weight} lb`,
                      )
                      .join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
