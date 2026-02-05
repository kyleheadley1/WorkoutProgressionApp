// src/components/History.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getFriendlyName, canonicalizeExerciseId } from '../lib/aliases';
import { readSessions, saveSession } from '../lib/storage';
import { api } from '../lib/api';
import { enqueueSession } from '../lib/offlineQueue';
import { getDefsForDayType } from '../lib/workoutDefinitions';

const DAY_TYPES = [
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'legs', label: 'Legs' },
  { value: 'upper', label: 'Upper' },
  { value: 'lower', label: 'Lower' },
  { value: 'full', label: 'Full Body' },
];

const PER_HAND_EXERCISES = new Set(['dumbbellBenchPress', 'trapBarDeadlift']);

function getDefaultSetsForDef(def) {
  const scheme = def.repScheme || {};
  const count = scheme.sets ?? 3;
  return Array.from({ length: Math.max(1, count) }, () => ({
    weight: '',
    reps: '',
  }));
}

export default function History({ userId = 'demoUser' }) {
  const [workouts, setWorkouts] = useState([]);
  const [addStep, setAddStep] = useState('date'); // 'date' | 'exercises'
  const [addDate, setAddDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [addDayType, setAddDayType] = useState('push');
  const [exerciseData, setExerciseData] = useState({}); // { [exerciseId]: { sets: [{ weight, reps }] } }
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

  const defs = getDefsForDayType(addDayType);

  const goToExercises = (e) => {
    e.preventDefault();
    setMessage('');
    const date = new Date(`${addDate}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      setMessage('Please choose a valid date.');
      return;
    }
    const initial = {};
    defs.forEach((d) => {
      initial[d.exerciseId] = { sets: getDefaultSetsForDef(d) };
    });
    setExerciseData(initial);
    setAddStep('exercises');
  };

  const updateSet = (exerciseId, setIndex, field, value) => {
    setExerciseData((prev) => {
      const ex = prev[exerciseId];
      if (!ex) return prev;
      const newSets = ex.sets.slice();
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      return { ...prev, [exerciseId]: { ...ex, sets: newSets } };
    });
  };

  const addSet = (exerciseId) => {
    setExerciseData((prev) => {
      const ex = prev[exerciseId];
      if (!ex) return prev;
      return {
        ...prev,
        [exerciseId]: { ...ex, sets: [...ex.sets, { weight: '', reps: '' }] },
      };
    });
  };

  const removeSet = (exerciseId, setIndex) => {
    setExerciseData((prev) => {
      const ex = prev[exerciseId];
      if (!ex || ex.sets.length <= 1) return prev;
      const newSets = ex.sets.filter((_, i) => i !== setIndex);
      return { ...prev, [exerciseId]: { ...ex, sets: newSets } };
    });
  };

  const handleSavePastWorkout = async (e) => {
    e.preventDefault();
    setMessage('');
    const date = new Date(`${addDate}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      setMessage('Please choose a valid date.');
      return;
    }

    const exercises = [];
    const bodyweightIds = new Set(
      defs.filter((d) => d.modality === 'bodyweight').map((d) => d.exerciseId),
    );

    defs.forEach((def) => {
      const data = exerciseData[def.exerciseId];
      if (!data?.sets?.length) return;
      const isBodyweight = bodyweightIds.has(def.exerciseId);
      const setsArray = data.sets
        .map((s, i) => {
          const reps = Number(s.reps);
          const weight = isBodyweight ? 0 : Number(s.weight);
          if (!Number.isFinite(reps) || reps <= 0) return null;
          if (!isBodyweight && (!Number.isFinite(weight) || weight < 0))
            return null;
          return { setNumber: i + 1, reps, weight };
        })
        .filter(Boolean);

      if (setsArray.length === 0) return;

      const maxWeightSet = setsArray.reduce((max, s) =>
        s.weight > max.weight ? s : max,
      );
      exercises.push({
        exerciseId: canonicalizeExerciseId(def.exerciseId),
        target: {
          weight: maxWeightSet.weight,
          reps: maxWeightSet.reps,
          sets: setsArray.length,
        },
        sets: setsArray,
      });
    });

    if (exercises.length === 0) {
      setMessage('Add at least one set with reps for at least one exercise.');
      return;
    }

    setAdding(true);
    const session = {
      userId,
      date: date.toISOString(),
      dayType: addDayType,
      type: addDayType,
      exercises,
    };
    try {
      saveSession(session);
    } catch (err) {
      console.error('Failed to save locally:', err);
    }
    try {
      await api.createWorkout(session);
      setMessage(
        'Past workout saved. It will appear in each exercise’s history and trends.',
      );
      setAddStep('date');
      setExerciseData({});
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

      {addStep === 'date' ? (
        <form className='add-past-workout-form' onSubmit={goToExercises}>
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
            <button type='submit' className='primary-btn add-past-workout-btn'>
              Next — Add exercises & sets
            </button>
          </div>
          {message && (
            <div className='add-past-workout-message add-past-workout-message--error'>
              {message}
            </div>
          )}
        </form>
      ) : (
        <div className='add-past-workout-form add-past-workout-form--exercises'>
          <div className='add-past-workout-exercises-header'>
            <h3 className='add-past-workout-title'>
              {addDayType.toUpperCase()} — {addDate}
            </h3>
            <p className='add-past-workout-subtitle'>
              Enter sets and reps for each exercise. Leave blank or remove
              exercises you didn’t do.
            </p>
          </div>

          <form onSubmit={handleSavePastWorkout}>
            <div className='add-past-workout-exercise-list'>
              {defs.map((def) => {
                const data = exerciseData[def.exerciseId];
                const sets = data?.sets || [{ weight: '', reps: '' }];
                const isBodyweight = def.modality === 'bodyweight';
                const isPerHand = PER_HAND_EXERCISES.has(def.exerciseId);

                return (
                  <div
                    key={def.exerciseId}
                    className='add-past-workout-exercise-block'
                  >
                    <h4 className='add-past-workout-exercise-name'>
                      {def.name}
                    </h4>
                    <div className='sets-input-section'>
                      <div className='sets-input-header'>
                        <h4>Sets</h4>
                        <button
                          type='button'
                          onClick={() => addSet(def.exerciseId)}
                          className='add-set-btn'
                        >
                          + Add Set
                        </button>
                      </div>
                      {sets.map((set, idx) => (
                        <div
                          key={idx}
                          className={`set-input-row ${isBodyweight ? 'bodyweight-set' : ''}`}
                        >
                          <div className='set-input-number'>Set {idx + 1}</div>
                          {!isBodyweight && (
                            <label>
                              Weight ({isPerHand ? 'lb per dumbbell' : 'lb'})
                              <input
                                type='number'
                                min='0'
                                step='2.5'
                                value={set.weight}
                                onChange={(e) =>
                                  updateSet(
                                    def.exerciseId,
                                    idx,
                                    'weight',
                                    e.target.value,
                                  )
                                }
                                placeholder='e.g. 135'
                              />
                            </label>
                          )}
                          <label>
                            Reps
                            <input
                              type='number'
                              min='0'
                              step='1'
                              value={set.reps}
                              onChange={(e) =>
                                updateSet(
                                  def.exerciseId,
                                  idx,
                                  'reps',
                                  e.target.value,
                                )
                              }
                              placeholder='e.g. 8'
                            />
                          </label>
                          {sets.length > 1 && (
                            <button
                              type='button'
                              onClick={() => removeSet(def.exerciseId, idx)}
                              className='remove-set-btn'
                              title='Remove set'
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className='add-past-workout-actions'>
              <button
                type='button'
                onClick={() => {
                  setAddStep('date');
                  setMessage('');
                }}
                className='ghost-btn'
              >
                Back
              </button>
              <button
                type='submit'
                disabled={adding}
                className='primary-btn add-past-workout-btn'
              >
                {adding ? 'Saving…' : 'Save workout to history'}
              </button>
            </div>
            {message && (
              <div
                className={`add-past-workout-message ${message.includes('Saved') || message.includes('synced') ? '' : 'add-past-workout-message--error'}`}
              >
                {message}
              </div>
            )}
          </form>
        </div>
      )}

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
