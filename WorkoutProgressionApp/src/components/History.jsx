// src/components/History.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getFriendlyName, canonicalizeExerciseId } from '../lib/aliases';
import { readSessions, saveSession, deleteSession } from '../lib/storage';
import { api } from '../lib/api';
import { enqueueSession } from '../lib/offlineQueue';
import {
  getAllExerciseDefs,
  getDefByExerciseId,
  findExactExercise,
  findSimilarExercise,
  filterExercisesByQuery,
} from '../lib/workoutDefinitions';

const DAY_TYPES = [
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'legs', label: 'Legs' },
  { value: 'upper', label: 'Upper' },
  { value: 'lower', label: 'Lower' },
  { value: 'full', label: 'Full Body' },
];

const PER_HAND_EXERCISES = new Set(['dumbbellBenchPress', 'trapBarDeadlift']);

const ALL_STORED_DEFS = getAllExerciseDefs();

const CUSTOM_PREFIX = 'custom-';

function slugify(s) {
  const slug = (s || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return slug || 'unknown';
}

function makeCustomDef(displayName) {
  const name = displayName.trim();
  return {
    exerciseId: CUSTOM_PREFIX + slugify(name),
    name,
    modality: undefined,
    repScheme: { sets: 1 },
  };
}

function getDefaultSetsForDef(def) {
  const scheme = def?.repScheme || {};
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
  const [addedExercises, setAddedExercises] = useState([]); // [{ exerciseId, name, modality, sets: [{ weight, reps }] }]
  const [addExerciseQuery, setAddExerciseQuery] = useState('');
  const [similarSuggestion, setSimilarSuggestion] = useState(null); // { exerciseId, name } when user typed something similar
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteConfirmingKey, setDeleteConfirmingKey] = useState(null);

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

  const goToExercises = (e) => {
    e.preventDefault();
    setMessage('');
    setSimilarSuggestion(null);
    const date = new Date(`${addDate}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      setMessage('Please choose a valid date.');
      return;
    }
    setAddedExercises([]);
    setAddExerciseQuery('');
    setAddStep('exercises');
  };

  const addExerciseByDef = (def) => {
    if (!def) return;
    const already = addedExercises.some((e) => e.exerciseId === def.exerciseId);
    if (already) return;
    setAddedExercises((prev) => [
      ...prev,
      {
        exerciseId: def.exerciseId,
        name: def.name,
        modality: def.modality,
        sets: getDefaultSetsForDef(def),
      },
    ]);
    setAddExerciseQuery('');
    setSimilarSuggestion(null);
    setMessage('');
  };

  const removeExercise = (exerciseId) => {
    setAddedExercises((prev) =>
      prev.filter((e) => e.exerciseId !== exerciseId),
    );
  };

  const updateSet = (exerciseId, setIndex, field, value) => {
    setAddedExercises((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? {
              ...e,
              sets: e.sets.map((s, i) =>
                i === setIndex ? { ...s, [field]: value } : s,
              ),
            }
          : e,
      ),
    );
  };

  const addSet = (exerciseId) => {
    setAddedExercises((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, sets: [...e.sets, { weight: '', reps: '' }] }
          : e,
      ),
    );
  };

  const removeSet = (exerciseId, setIndex) => {
    setAddedExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId || e.sets.length <= 1) return e;
        return {
          ...e,
          sets: e.sets.filter((_, i) => i !== setIndex),
        };
      }),
    );
  };

  const predictiveMatches = filterExercisesByQuery(
    addExerciseQuery,
    ALL_STORED_DEFS,
    8,
  );

  const handleAddByQuery = () => {
    const query = addExerciseQuery.trim();
    if (!query) return;
    setMessage('');
    setSimilarSuggestion(null);
    const exact = findExactExercise(query, ALL_STORED_DEFS);
    if (exact) {
      addExerciseByDef(exact);
      return;
    }
    const similar = findSimilarExercise(query, ALL_STORED_DEFS);
    if (similar) {
      setSimilarSuggestion({
        exerciseId: similar.exerciseId,
        name: similar.name,
      });
      setMessage(
        `"${query}" looks like an existing exercise. Use the match below so this appears in your exercise history and trends.`,
      );
      return;
    }
    // New exercise: add it so it can be saved to the workout/database
    addExerciseByDef(makeCustomDef(query));
    setMessage('');
  };

  const handleDeleteWorkout = async (w) => {
    deleteSession(userId, w.date, w.dayType || w.type);
    if (w._id) {
      try {
        await api.deleteWorkout(w._id);
      } catch {
        // Server may not support delete or be offline
      }
    }
    setDeleteConfirmingKey(null);
    loadWorkouts();
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
    for (const ex of addedExercises) {
      const isBodyweight = ex.modality === 'bodyweight';
      const setsArray = ex.sets
        .map((s, i) => {
          const reps = Number(s.reps);
          const weight = isBodyweight ? 0 : Number(s.weight);
          if (!Number.isFinite(reps) || reps <= 0) return null;
          if (!isBodyweight && (!Number.isFinite(weight) || weight < 0))
            return null;
          return { setNumber: i + 1, reps, weight };
        })
        .filter(Boolean);

      if (setsArray.length === 0) continue;

      const maxWeightSet = setsArray.reduce((max, s) =>
        s.weight > max.weight ? s : max,
      );
      const payload = {
        exerciseId: canonicalizeExerciseId(ex.exerciseId),
        target: {
          weight: maxWeightSet.weight,
          reps: maxWeightSet.reps,
          sets: setsArray.length,
        },
        sets: setsArray,
      };
      if (ex.exerciseId.startsWith(CUSTOM_PREFIX)) {
        payload.name = ex.name;
      }
      exercises.push(payload);
    }

    if (exercises.length === 0) {
      setMessage('Add at least one exercise with at least one set (reps).');
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
      setAddedExercises([]);
      setSimilarSuggestion(null);
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
            <div
              className={`add-past-workout-message ${message.includes('Saved') || message.includes('synced') ? '' : 'add-past-workout-message--error'}`}
            >
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
              Add exercises from the dropdown, search for existing ones, or type
              a new exercise name to add it—new exercises are saved with the
              workout.
            </p>
          </div>

          <form onSubmit={handleSavePastWorkout}>
            <div className='add-exercise-row'>
              <label className='add-exercise-dropdown-wrap'>
                <span className='add-past-workout-label'>Add from list</span>
                <select
                  value=''
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    const def = getDefByExerciseId(id);
                    addExerciseByDef(def);
                    e.target.value = '';
                  }}
                  className='add-past-workout-select add-exercise-select'
                >
                  <option value=''>Choose an exercise…</option>
                  {ALL_STORED_DEFS.map((d) => (
                    <option key={d.exerciseId} value={d.exerciseId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className='add-exercise-search-wrap'>
                <label className='add-exercise-search-label'>
                  <span className='add-past-workout-label'>Or search</span>
                  <input
                    type='text'
                    value={addExerciseQuery}
                    onChange={(e) => {
                      setAddExerciseQuery(e.target.value);
                      setSimilarSuggestion(null);
                      setMessage('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddByQuery();
                      }
                    }}
                    placeholder='Type exercise name…'
                    className='add-past-workout-input add-exercise-input'
                  />
                </label>
                {predictiveMatches.length > 0 && addExerciseQuery.trim() && (
                  <ul className='add-exercise-suggestions'>
                    {predictiveMatches.map((d) => (
                      <li key={d.exerciseId}>
                        <button
                          type='button'
                          className='add-exercise-suggestion-btn'
                          onClick={() => addExerciseByDef(d)}
                        >
                          {d.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type='button'
                  onClick={handleAddByQuery}
                  className='ghost-btn add-exercise-add-btn'
                >
                  Add
                </button>
              </div>
            </div>

            {similarSuggestion && (
              <div className='add-exercise-similar-banner'>
                <p className='add-exercise-similar-text'>
                  Use <strong>“{similarSuggestion.name}”</strong> so this
                  appears in your exercise history and trends.
                </p>
                <button
                  type='button'
                  onClick={() => {
                    const def = getDefByExerciseId(
                      similarSuggestion.exerciseId,
                    );
                    addExerciseByDef(def);
                  }}
                  className='primary-btn add-exercise-use-btn'
                >
                  Use “{similarSuggestion.name}”
                </button>
              </div>
            )}

            {message && addStep === 'exercises' && (
              <div
                className={`add-past-workout-message ${message.includes('No matching') ? 'add-past-workout-message--error' : ''}`}
              >
                {message}
              </div>
            )}

            <div className='add-past-workout-exercise-list'>
              {addedExercises.map((ex) => {
                const sets = ex.sets || [{ weight: '', reps: '' }];
                const isBodyweight = ex.modality === 'bodyweight';
                const isPerHand = PER_HAND_EXERCISES.has(ex.exerciseId);

                return (
                  <div
                    key={ex.exerciseId}
                    className='add-past-workout-exercise-block'
                  >
                    <div className='add-past-workout-exercise-block-header'>
                      <h4 className='add-past-workout-exercise-name'>
                        {ex.name}
                      </h4>
                      <button
                        type='button'
                        onClick={() => removeExercise(ex.exerciseId)}
                        className='history-delete-btn add-exercise-remove'
                        title='Remove exercise'
                      >
                        Remove
                      </button>
                    </div>
                    <div className='sets-input-section'>
                      <div className='sets-input-header'>
                        <h4>Sets</h4>
                        <button
                          type='button'
                          onClick={() => addSet(ex.exerciseId)}
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
                                    ex.exerciseId,
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
                                  ex.exerciseId,
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
                              onClick={() => removeSet(ex.exerciseId, idx)}
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
          {workouts.map((w, i) => {
            const deleteKey = `${w.date}-${w.dayType || w.type}`;
            const isConfirming = deleteConfirmingKey === deleteKey;
            return (
              <div key={i} className='workout-entry history-workout-card'>
                <div className='workout-date-header'>
                  <h2 className='history-workout-day'>
                    {(w.dayType || w.type)?.toUpperCase() || 'Unknown'} —{' '}
                    {new Date(w.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h2>
                  {!isConfirming ? (
                    <button
                      type='button'
                      onClick={() => setDeleteConfirmingKey(deleteKey)}
                      className='history-delete-btn'
                    >
                      Delete
                    </button>
                  ) : (
                    <div className='history-delete-confirm'>
                      <span className='history-delete-confirm-text'>
                        Delete this workout?
                      </span>
                      <button
                        type='button'
                        onClick={() => handleDeleteWorkout(w)}
                        className='history-delete-confirm-yes'
                      >
                        Yes
                      </button>
                      <button
                        type='button'
                        onClick={() => setDeleteConfirmingKey(null)}
                        className='ghost-btn'
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div className='history-exercises'>
                  {w.exercises?.length ? (
                    w.exercises.map((ex, j) => (
                      <div key={j} className='history-exercise-block'>
                        <strong className='history-exercise-name'>
                          {ex.name || getFriendlyName(ex.exerciseId)}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
