// src/components/History.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getFriendlyName } from '../lib/aliases';
import { readSessions, saveSession } from '../lib/storage';
import { api } from '../lib/api';
import { enqueueSession } from '../lib/offlineQueue';

const DAY_TYPES = [
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'legs', label: 'Legs' },
  { value: 'upper', label: 'Upper' },
  { value: 'lower', label: 'Lower' },
  { value: 'full', label: 'Full Body' },
];

export default function History({ userId = 'demoUser' }) {
  const [workouts, setWorkouts] = useState([]);
  const [addDate, setAddDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [addDayType, setAddDayType] = useState('push');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  const loadWorkouts = useCallback(() => {
    const local = readSessions(userId);
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

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const handleAddPastWorkout = async (e) => {
    e.preventDefault();
    setMessage('');
    const date = new Date(`${addDate}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      setMessage('Please choose a valid date.');
      return;
    }
    setAdding(true);
    const session = {
      userId,
      date: date.toISOString(),
      dayType: addDayType,
      type: addDayType,
      exercises: [],
    };
    try {
      saveSession(session);
    } catch (err) {
      console.error('Failed to save locally:', err);
    }
    try {
      await api.createWorkout(session);
      setMessage('Past workout added.');
      setAddDate(new Date().toISOString().slice(0, 10));
      loadWorkouts();
    } catch {
      enqueueSession(session);
      setMessage('Saved locally — will sync when online.');
      loadWorkouts();
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className='history-content'>
      <h2 className='history-page-title'>Workout History</h2>

      <form className='add-past-workout-form' onSubmit={handleAddPastWorkout}>
        <h3 className='add-past-workout-title'>Add past workout</h3>
        <div className='add-past-workout-fields'>
          <label>
            <span className='add-past-workout-label'>Date</span>
            <input
              type='date'
              value={addDate}
              onChange={(e) => setAddDate(e.target.value)}
              className='add-past-workout-input'
              required
            />
          </label>
          <label>
            <span className='add-past-workout-label'>Workout type</span>
            <select
              value={addDayType}
              onChange={(e) => setAddDayType(e.target.value)}
              className='add-past-workout-select'
            >
              {DAY_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type='submit'
            disabled={adding}
            className='primary-btn add-past-workout-btn'
          >
            {adding ? 'Adding…' : 'Add workout'}
          </button>
        </div>
        {message && <div className='add-past-workout-message'>{message}</div>}
      </form>

      {!workouts.length ? (
        <div className='empty-state'>No workouts logged yet.</div>
      ) : (
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
                {w.exercises?.length ? (
                  w.exercises.map((ex, j) => (
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
                  ))
                ) : (
                  <div className='history-no-exercises'>
                    No exercises logged for this day.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
