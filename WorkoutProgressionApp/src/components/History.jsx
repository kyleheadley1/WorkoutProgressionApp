// src/components/History.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getFriendlyName, canonicalizeExerciseId } from '../lib/aliases';
import {
  readSessions,
  saveSession,
  deleteSession,
  updateSession,
  getSavedUserExercises,
  addSavedUserExercise,
} from '../lib/storage';
import { api } from '../lib/api';
import { enqueueSession } from '../lib/offlineQueue';
import {
  getAllExerciseDefs,
  getDefByExerciseId,
  findExactExercise,
  findSimilarExercise,
  filterExercisesByQuery,
} from '../lib/workoutDefinitions';
import { useProfile } from '../contexts/ProfileContext';
import {
  convertToLbs,
  convertFromLbs,
  formatWeight,
  getWeightStep,
  getWeightUnitLabel,
  roundForDisplay,
} from '../lib/weightUtils';

const DAY_TYPES = [
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'legs', label: 'Legs' },
  { value: 'upper', label: 'Upper' },
  { value: 'lower', label: 'Lower' },
  { value: 'full', label: 'Full Body' },
];

const PER_HAND_EXERCISES = new Set(['dumbbellBenchPress', 'trapBarDeadlift']);

/** Convert display name to a normal exerciseId (camelCase), e.g. "Barbell Bench Press" -> "barbellBenchPress" */
function displayNameToExerciseId(displayName) {
  const words = (displayName || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'unknown';
  const first = words[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const rest = words
    .slice(1)
    .map(
      (w) =>
        w.charAt(0).toUpperCase() +
        w
          .slice(1)
          .toLowerCase()
          .replace(/[^a-z0-9]/gi, ''),
    )
    .join('');
  return first + rest || 'unknown';
}

function makeCustomDef(displayName) {
  const name = displayName.trim();
  return {
    exerciseId: displayNameToExerciseId(name),
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

export default function History({
  userId = 'demoUser',
  onViewExerciseHistory,
}) {
  const { profile } = useProfile();
  const weightUnit = profile.weightUnit || 'lb';
  const [workouts, setWorkouts] = useState([]);
  const [addStep, setAddStep] = useState('date');
  const [addDate, setAddDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [addDayType, setAddDayType] = useState('push');
  const [addedExercises, setAddedExercises] = useState([]);
  const [addExerciseQuery, setAddExerciseQuery] = useState('');
  const [similarSuggestion, setSimilarSuggestion] = useState(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteConfirmingKey, setDeleteConfirmingKey] = useState(null);
  const [userExercisesVersion, setUserExercisesVersion] = useState(0);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editExercises, setEditExercises] = useState([]);

  // Recompute when user adds a custom exercise so dropdown updates
  const allStoredDefs = React.useMemo(() => {
    const builtIn = getAllExerciseDefs();
    const ids = new Set(builtIn.map((d) => d.exerciseId));
    const user = getSavedUserExercises().filter(
      (d) => !ids.has(canonicalizeExerciseId(d.exerciseId)),
    );
    return [...builtIn, ...user];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- userExercisesVersion triggers refresh when custom exercise is saved
  }, [userExercisesVersion]);

  const getDefFromStored = useCallback(
    (exerciseId) =>
      allStoredDefs.find((d) => d.exerciseId === exerciseId) || null,
    [allStoredDefs],
  );

  /** Convert a saved workout to the edit form shape (weight in display unit). */
  const workoutToEditExercises = useCallback(
    (w) =>
      (w.exercises || []).map((ex) => {
        const sets = (ex.sets || []).map((s) => ({
          weight: String(
            roundForDisplay(convertFromLbs(s.weight, weightUnit), weightUnit),
          ),
          reps: s.reps != null ? String(s.reps) : '',
        }));
        return {
          exerciseId: ex.exerciseId,
          name: ex.name,
          modality: ex.modality,
          sets: sets.length ? sets : [{ weight: '', reps: '' }],
          manuallyEditedSetIndices: {},
        };
      }),
    [weightUnit],
  );

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

  // Backfill user exercises from history so legacy "custom-*" and past custom entries appear in dropdown
  useEffect(() => {
    if (!workouts.length) return;
    const builtInIds = new Set(getAllExerciseDefs().map((d) => d.exerciseId));
    const existingUser = getSavedUserExercises();
    const existingIds = new Set(
      existingUser.map((e) => canonicalizeExerciseId(e.exerciseId)),
    );
    let added = false;
    workouts.forEach((w) => {
      (w.exercises || []).forEach((ex) => {
        const canon = canonicalizeExerciseId(ex.exerciseId);
        const isLegacyCustom =
          (ex.exerciseId && ex.exerciseId.startsWith('custom-')) ||
          !builtInIds.has(canon);
        if (isLegacyCustom && !existingIds.has(canon)) {
          addSavedUserExercise(
            canon,
            ex.name || getFriendlyName(ex.exerciseId),
          );
          existingIds.add(canon);
          added = true;
        }
      });
    });
    if (added) setUserExercisesVersion((v) => v + 1);
  }, [workouts]);

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
    const target = editingWorkout ? editExercises : addedExercises;
    const already = target.some((e) => e.exerciseId === def.exerciseId);
    if (already) return;
    const next = [
      ...target,
      {
        exerciseId: def.exerciseId,
        name: def.name,
        modality: def.modality,
        sets: getDefaultSetsForDef(def),
        manuallyEditedSetIndices: {},
      },
    ];
    if (editingWorkout) setEditExercises(next);
    else setAddedExercises(next);
    setAddExerciseQuery('');
    setSimilarSuggestion(null);
    setMessage('');
  };

  const removeExercise = (exerciseId) => {
    const setter = editingWorkout ? setEditExercises : setAddedExercises;
    setter((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
  };

  const updateSet = (exerciseId, setIndex, field, value) => {
    const setter = editingWorkout ? setEditExercises : setAddedExercises;
    setter((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const edited = e.manuallyEditedSetIndices || {};
        const sets = e.sets.map((s, i) =>
          i === setIndex ? { ...s, [field]: value } : s,
        );
        const source = sets[setIndex];
        const newEdited = { ...edited, [setIndex]: true };
        const propagated = sets.map((s, i) => {
          if (i <= setIndex) return s;
          if (edited[i]) return s;
          return { ...s, weight: source.weight, reps: source.reps };
        });
        return { ...e, sets: propagated, manuallyEditedSetIndices: newEdited };
      }),
    );
  };

  const addSet = (exerciseId) => {
    const setter = editingWorkout ? setEditExercises : setAddedExercises;
    setter((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const sets = e.sets || [{ weight: '', reps: '' }];
        const last = sets[sets.length - 1];
        return {
          ...e,
          sets: [...sets, { weight: last.weight, reps: last.reps }],
        };
      }),
    );
  };

  const removeSet = (exerciseId, setIndex) => {
    const setter = editingWorkout ? setEditExercises : setAddedExercises;
    setter((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId || e.sets.length <= 1) return e;
        const edited = e.manuallyEditedSetIndices || {};
        const newEdited = {};
        Object.keys(edited).forEach((k) => {
          const i = Number(k);
          if (i < setIndex) newEdited[i] = true;
          else if (i > setIndex) newEdited[i - 1] = true;
        });
        return {
          ...e,
          sets: e.sets.filter((_, i) => i !== setIndex),
          manuallyEditedSetIndices: newEdited,
        };
      }),
    );
  };

  const predictiveMatches = filterExercisesByQuery(
    addExerciseQuery,
    allStoredDefs,
    8,
  );

  const handleAddByQuery = () => {
    const query = addExerciseQuery.trim();
    if (!query) return;
    setMessage('');
    setSimilarSuggestion(null);
    const exact = findExactExercise(query, allStoredDefs);
    if (exact) {
      addExerciseByDef(exact);
      return;
    }
    const similar = findSimilarExercise(query, allStoredDefs);
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

  const handleStartEdit = (w) => {
    setEditingWorkout(w);
    setEditExercises(workoutToEditExercises(w));
    setMessage('');
  };

  const handleCancelEdit = () => {
    setEditingWorkout(null);
    setEditExercises([]);
    setMessage('');
  };

  const buildSessionFromExercises = (exercisesList) => {
    const exercises = [];
    for (const ex of exercisesList) {
      const isBodyweight = ex.modality === 'bodyweight';
      const setsArray = ex.sets
        .map((s, i) => {
          const reps = Number(s.reps);
          const weightInput = Number(s.weight);
          const weight = isBodyweight
            ? 0
            : convertToLbs(weightInput, weightUnit);
          if (!Number.isFinite(reps) || reps <= 0) return null;
          if (
            !isBodyweight &&
            (!Number.isFinite(weightInput) || weightInput < 0)
          )
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
      if (ex.name) payload.name = ex.name;
      exercises.push(payload);
    }
    return exercises;
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setMessage('');
    const exercises = buildSessionFromExercises(editExercises);
    if (exercises.length === 0) {
      setMessage('Keep at least one exercise with at least one set (reps).');
      return;
    }
    const dayType = editingWorkout.dayType || editingWorkout.type;
    const session = {
      userId,
      date: editingWorkout.date,
      dayType,
      type: dayType,
      exercises,
    };
    if (editingWorkout._id) session._id = editingWorkout._id;
    setAdding(true);
    try {
      updateSession(userId, editingWorkout.date, dayType, session);
      if (editingWorkout._id) {
        await api.updateWorkout(editingWorkout._id, session);
      }
      setMessage(
        'Workout updated. Trends and history will reflect the changes.',
      );
      setEditingWorkout(null);
      setEditExercises([]);
      loadWorkouts();
    } catch (err) {
      setMessage(err?.message || 'Failed to save changes.');
    } finally {
      setAdding(false);
    }
  };

  const handleSavePastWorkout = async (e) => {
    e.preventDefault();
    setMessage('');
    const date = new Date(`${addDate}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      setMessage('Please choose a valid date.');
      return;
    }

    const exercises = buildSessionFromExercises(addedExercises);
    for (const ex of addedExercises) {
      if (!getDefByExerciseId(canonicalizeExerciseId(ex.exerciseId))) {
        addSavedUserExercise(
          canonicalizeExerciseId(ex.exerciseId),
          ex.name || getFriendlyName(ex.exerciseId),
        );
      }
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
      setUserExercisesVersion((v) => v + 1);
      loadWorkouts();
    } catch {
      enqueueSession(session);
      setMessage('Saved locally — will sync when online.');
      setUserExercisesVersion((v) => v + 1);
      loadWorkouts();
    } finally {
      setAdding(false);
    }
  };

  const formExercises = editingWorkout ? editExercises : addedExercises;

  return (
    <div className='history-content'>
      <h2 className='history-page-title'>Workout History</h2>

      {editingWorkout ? (
        <form
          className='add-past-workout-form add-past-workout-form--exercises'
          onSubmit={handleSaveEdit}
        >
          <div className='add-past-workout-exercises-header'>
            <h3 className='add-past-workout-title'>
              Edit workout —{' '}
              {(editingWorkout.dayType || editingWorkout.type)?.toUpperCase()} —{' '}
              {new Date(editingWorkout.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
            <p className='add-past-workout-subtitle'>
              Change sets, reps, and weight. Add or remove exercises. Save to
              update history and trends.
            </p>
          </div>
          <div className='add-exercise-row'>
            <label className='add-exercise-dropdown-wrap'>
              <span className='add-past-workout-label'>Add from list</span>
              <select
                value=''
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  const def = getDefFromStored(id);
                  addExerciseByDef(def);
                  e.target.value = '';
                }}
                className='add-past-workout-select add-exercise-select'
              >
                <option value=''>Choose an exercise…</option>
                {allStoredDefs.map((d) => (
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
                Use <strong>“{similarSuggestion.name}”</strong> so this appears
                in your exercise history and trends.
              </p>
              <button
                type='button'
                onClick={() => {
                  const def = getDefFromStored(similarSuggestion.exerciseId);
                  addExerciseByDef(def);
                }}
                className='primary-btn add-exercise-use-btn'
              >
                Use “{similarSuggestion.name}”
              </button>
            </div>
          )}
          <div className='add-past-workout-exercise-list'>
            {formExercises.map((ex) => {
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
                      {ex.name || getFriendlyName(ex.exerciseId)}
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
                            Weight (
                            {isPerHand
                              ? `${getWeightUnitLabel(weightUnit)} per dumbbell`
                              : getWeightUnitLabel(weightUnit)}
                            )
                            <input
                              type='number'
                              min='0'
                              step={getWeightStep(weightUnit)}
                              value={set.weight}
                              onChange={(e) =>
                                updateSet(
                                  ex.exerciseId,
                                  idx,
                                  'weight',
                                  e.target.value,
                                )
                              }
                              placeholder={
                                weightUnit === 'kg' ? 'e.g. 60' : 'e.g. 135'
                              }
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
              onClick={handleCancelEdit}
              className='ghost-btn'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={adding}
              className='primary-btn add-past-workout-btn'
            >
              {adding ? 'Saving…' : 'Save changes'}
            </button>
          </div>
          {message && (
            <div
              className={`add-past-workout-message ${message.includes('updated') || message.includes('reflect') ? '' : 'add-past-workout-message--error'}`}
            >
              {message}
            </div>
          )}
        </form>
      ) : addStep === 'date' ? (
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
                    const def = getDefFromStored(id);
                    addExerciseByDef(def);
                    e.target.value = '';
                  }}
                  className='add-past-workout-select add-exercise-select'
                >
                  <option value=''>Choose an exercise…</option>
                  {allStoredDefs.map((d) => (
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
                    const def = getDefFromStored(similarSuggestion.exerciseId);
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
                              Weight (
                              {isPerHand
                                ? `${getWeightUnitLabel(weightUnit)} per dumbbell`
                                : getWeightUnitLabel(weightUnit)}
                              )
                              <input
                                type='number'
                                min='0'
                                step={getWeightStep(weightUnit)}
                                value={set.weight}
                                onChange={(e) =>
                                  updateSet(
                                    ex.exerciseId,
                                    idx,
                                    'weight',
                                    e.target.value,
                                  )
                                }
                                placeholder={
                                  weightUnit === 'kg' ? 'e.g. 60' : 'e.g. 135'
                                }
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
                    <div className='history-card-actions'>
                      <button
                        type='button'
                        onClick={() => handleStartEdit(w)}
                        className='history-btn'
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        onClick={() => setDeleteConfirmingKey(deleteKey)}
                        className='history-delete-btn'
                      >
                        Delete
                      </button>
                    </div>
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
                        <div className='history-exercise-block-row'>
                          <strong className='history-exercise-name'>
                            {ex.name || getFriendlyName(ex.exerciseId)}
                          </strong>
                          {onViewExerciseHistory && (
                            <button
                              type='button'
                              onClick={() =>
                                onViewExerciseHistory(
                                  ex.exerciseId,
                                  ex.name || getFriendlyName(ex.exerciseId),
                                )
                              }
                              className='history-btn history-exercise-history-btn'
                            >
                              History
                            </button>
                          )}
                        </div>
                        <div className='history-sets-summary'>
                          {ex.sets
                            ?.map(
                              (s) =>
                                `Set ${s.setNumber}: ${s.reps} reps @ ${formatWeight(s.weight, weightUnit)}`,
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
