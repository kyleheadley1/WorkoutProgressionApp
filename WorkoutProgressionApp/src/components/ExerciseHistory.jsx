// src/components/ExerciseHistory.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  readSessions,
  saveSession,
  deleteExerciseSession,
} from '../lib/storage';
import { api } from '../lib/api';
import { est1RM } from './ExerciseCard';
import { getStrengthLevelComparison } from '../lib/strengthStandards';

const PROFILE_KEY = 'wp_profile_v1';

const BODYWEIGHT_EXERCISES = new Set(['pushUps', 'deficitPushups']);
const PER_HAND_EXERCISES = new Set(['dumbbellBenchPress', 'trapBarDeadlift']);

export default function ExerciseHistory({
  exerciseId,
  exerciseName,
  onBack,
  userId = 'demoUser',
}) {
  const [workouts, setWorkouts] = useState([]);
  const [view, setView] = useState('trends'); // 'results' | 'trends' - default to trends when opened from history button
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [profile, setProfile] = useState(() => {
    if (typeof window === 'undefined') {
      return { gender: 'male', bodyweight: 180 };
    }
    try {
      const raw = window.localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          (parsed.gender === 'male' || parsed.gender === 'female') &&
          Number.isFinite(parsed.bodyweight)
        ) {
          return parsed;
        }
      }
    } catch {}
    return { gender: 'male', bodyweight: 180 };
  });
  const isBodyweightExercise = BODYWEIGHT_EXERCISES.has(exerciseId);
  const isPerHandExercise = PER_HAND_EXERCISES.has(exerciseId);
  const [form, setForm] = useState(() => ({
    date: new Date().toISOString().slice(0, 10),
    sets: [{ weight: '', reps: '' }], // Array of sets with individual weight/reps
  }));

  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const allLocal = readSessions(userId);
      const localFiltered = allLocal
        .map((w) => ({
          ...w,
          origin: 'local',
          exercises: (w.exercises || []).filter(
            (e) => e.exerciseId === exerciseId
          ),
        }))
        .filter((w) => w.exercises.length > 0);

      let combined = [...localFiltered];

      try {
        const serverData = await api.listWorkouts();
        if (serverData?.length) {
          const serverFiltered = serverData
            .map((w) => ({
              ...w,
              origin: 'server',
              exercises: (w.exercises || []).filter(
                (e) => e.exerciseId === exerciseId
              ),
            }))
            .filter((w) => w.exercises.length > 0);
          combined = [...serverFiltered, ...combined];
        }
      } catch (e) {
        console.warn('Failed to load from server:', e.message);
      }

      const seen = new Map();
      combined.forEach((w) => {
        const key = `${new Date(w.date).toISOString().slice(0, 10)}::${
          w.exercises?.[0]?.exerciseId || ''
        }`;
        if (!seen.has(key) || w.origin === 'local') {
          seen.set(key, w);
        }
      });

      const deduped = Array.from(seen.values()).sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setWorkouts(deduped);
    } finally {
      setLoading(false);
    }
  }, [userId, exerciseId]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      } catch {}
    }
  }, [profile]);

  // Group workouts by date and separate warmup/working sets
  const groupedWorkouts = useMemo(() => {
    const grouped = new Map();
    workouts.forEach((w) => {
      const date = new Date(w.date);
      const dateKey = date.toISOString().slice(0, 10);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date,
          dateKey,
          warmupSets: [],
          workingSets: [],
          exercise: w.exercises?.[0],
          sources: [],
        });
      }
      const entry = grouped.get(dateKey);
      entry.sources.push({ origin: w.origin || 'unknown', session: w });
      if (!entry.exercise && w.exercises?.[0]) {
        entry.exercise = w.exercises[0];
      }
      const sets = w.exercises?.[0]?.sets || [];

      // For dumbbell bench press, first 3 sets are warmups if there are 4+ sets total
      // Otherwise, assume all sets are working sets
      const isDumbbellBenchPress = exerciseId === 'dumbbellBenchPress';
      const hasWarmups = isDumbbellBenchPress && sets.length >= 4;

      sets.forEach((set) => {
        const isWarmup = hasWarmups && set.setNumber <= 3;
        if (isWarmup) {
          entry.warmupSets.push(set);
        } else {
          entry.workingSets.push(set);
        }
      });
    });
    return Array.from(grouped.values()).sort((a, b) => b.date - a.date);
  }, [workouts, exerciseId]);

  // Calculate trend data
  const trendData = useMemo(() => {
    const data = [];
    groupedWorkouts.forEach((entry) => {
      if (entry.workingSets.length > 0) {
        const maxWeight = Math.max(
          ...entry.workingSets.map((s) => s.weight || 0)
        );
        const maxWeightSet = entry.workingSets.find(
          (s) => s.weight === maxWeight
        );
        const topReps = Math.max(
          ...entry.workingSets.map((s) => s.reps || 0),
          0
        );
        if (maxWeightSet) {
          const e1rm = est1RM(maxWeightSet.weight, maxWeightSet.reps);
          const population = getStrengthLevelComparison(
            exerciseId,
            {
              weight: maxWeightSet.weight,
              reps: topReps,
            },
            profile
          );
          data.push({
            date: entry.dateKey,
            dateObj: entry.date,
            weight: maxWeightSet.weight,
            e1rm,
            reps: topReps,
            population,
          });
        }
      }
    });
    return data.sort((a, b) => a.date.localeCompare(b.date));
  }, [groupedWorkouts, exerciseId, profile]);

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: field === 'bodyweight' ? Number(value) || 0 : value,
    }));
  };

  const handleFormChange = (field, value) => {
    if (field === 'date') {
      setForm((prev) => ({
        ...prev,
        date: value,
      }));
    }
  };

  const handleSetChange = (setIndex, field, value) => {
    setForm((prev) => {
      const newSets = [...prev.sets];
      newSets[setIndex] = {
        ...newSets[setIndex],
        [field]: value,
      };
      return {
        ...prev,
        sets: newSets,
      };
    });
  };

  const addSet = () => {
    setForm((prev) => ({
      ...prev,
      sets: [...prev.sets, { weight: '', reps: '' }],
    }));
  };

  const removeSet = (index) => {
    if (form.sets.length > 1) {
      setForm((prev) => ({
        ...prev,
        sets: prev.sets.filter((_, i) => i !== index),
      }));
    }
  };

  const handleAddManual = async (event) => {
    event.preventDefault();
    setFormError('');
    setActionMessage('');

    const date = new Date(`${form.date}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
      setFormError('Please provide a valid date.');
      return;
    }

    // Validate all sets
    const setsArray = form.sets
      .map((set, idx) => {
        const reps = Number(set.reps);
        const weight = isBodyweightExercise ? 0 : Number(set.weight);

        if (!Number.isFinite(reps) || reps <= 0) {
          setFormError(`Set ${idx + 1}: Reps must be a positive number.`);
          return null;
        }
        if (!isBodyweightExercise && (!Number.isFinite(weight) || weight <= 0)) {
          setFormError(`Set ${idx + 1}: Weight must be a positive number.`);
          return null;
        }

        return {
          setNumber: idx + 1,
          weight,
          reps,
        };
      })
      .filter(Boolean);

    if (setsArray.length === 0) {
      setFormError('Please enter at least one set.');
      return;
    }

    // Calculate target weight/reps
    // For exercises with <=5 sets: use top set (max weight)
    // For exercises with >5 sets: use max weight and corresponding reps
    const maxWeightSet = setsArray.reduce((max, set) =>
      set.weight > max.weight ? set : max
    );
    const targetWeight = maxWeightSet.weight;
    // For <=5 sets, use top set reps; for >5 sets, use the reps from max weight set
    const targetReps = maxWeightSet.reps;

    const isoDate = date.toISOString();
    const session = {
      userId,
      date: isoDate,
      type: 'manual',
      dayType: 'manual',
      exercises: [
        {
          exerciseId,
          target: {
            weight: targetWeight,
            reps: targetReps,
            sets: setsArray.length,
          },
          sets: setsArray,
        },
      ],
    };

    saveSession(session);

    // Try to sync to server
    try {
      await api.createWorkout(session);
      setActionMessage('Workout saved and synced to server ✅');
    } catch (e) {
      const { enqueueSession } = await import('../lib/offlineQueue');
      enqueueSession(session);
      setActionMessage('Workout saved locally — will sync when online.');
    }

    setForm({
      date: new Date().toISOString().slice(0, 10),
      sets: [{ weight: '', reps: '' }],
    });
    await loadWorkouts();
    setView('results');
  };

  const handleRemoveEntry = async (entry) => {
    const hasLocal = entry.sources?.some((src) => src.origin === 'local');
    if (!hasLocal) {
      setActionMessage(
        'This record originates from the server and cannot be removed locally.'
      );
      return;
    }
    deleteExerciseSession(userId, exerciseId, entry.dateKey);
    setActionMessage('Entry removed from local history.');
    await loadWorkouts();
  };

  return (
    <div className='exercise-history'>
      <div className='exercise-history-header'>
        <button className='back-btn' onClick={onBack}>
          ←
        </button>
        <h1 className='exercise-history-title'>{exerciseName}</h1>
        <div style={{ width: 40 }} /> {/* Spacer for centering */}
      </div>

      <div className='view-toggle'>
        <button
          className={`toggle-btn ${view === 'results' ? 'active' : ''}`}
          onClick={() => setView('results')}
        >
          Results
        </button>
        <button
          className={`toggle-btn ${view === 'trends' ? 'active' : ''}`}
          onClick={() => setView('trends')}
        >
          Trends
        </button>
      </div>

      <div className='history-controls'>
        <div className='profile-controls'>
          <label>
            Gender
            <select
              value={profile.gender}
              onChange={(e) => handleProfileChange('gender', e.target.value)}
            >
              <option value='male'>Male</option>
              <option value='female'>Female</option>
            </select>
          </label>
          <label>
            Bodyweight (lb)
            <input
              type='number'
              min='60'
              max='400'
              step='1'
              value={profile.bodyweight}
              onChange={(e) =>
                handleProfileChange('bodyweight', e.target.value)
              }
            />
          </label>
        </div>

        <form className='add-session-form' onSubmit={handleAddManual}>
          <div className='form-row'>
            <label>
              Date
              <input
                type='date'
                value={form.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
                required
              />
            </label>
          </div>
          
          <div className='sets-input-section'>
            <div className='sets-input-header'>
              <h4>Sets</h4>
              <button
                type='button'
                onClick={addSet}
                className='add-set-btn'
              >
                + Add Set
              </button>
            </div>
            {form.sets.map((set, idx) => (
              <div
                key={idx}
                className={`set-input-row ${isBodyweightExercise ? 'bodyweight-set' : ''}`}
              >
                <div className='set-input-number'>Set {idx + 1}</div>
                {!isBodyweightExercise && (
                  <label>
                    Weight ({isPerHandExercise ? 'lb per dumbbell' : 'lb'})
                    <input
                      type='number'
                      min='0'
                      step='2.5'
                      value={set.weight}
                      onChange={(e) =>
                        handleSetChange(idx, 'weight', e.target.value)
                      }
                      placeholder='e.g. 130'
                      required={!isBodyweightExercise}
                    />
                  </label>
                )}
                <label>
                  Reps
                  <input
                    type='number'
                    min='1'
                    step='1'
                    value={set.reps}
                    onChange={(e) =>
                      handleSetChange(idx, 'reps', e.target.value)
                    }
                    placeholder='e.g. 8'
                    required
                  />
                </label>
                {form.sets.length > 1 && (
                  <button
                    type='button'
                    onClick={() => removeSet(idx)}
                    className='remove-set-btn'
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button type='submit' className='primary-btn'>
            Add to history
          </button>
        </form>
        {(formError || actionMessage) && (
          <div className='form-status'>
            {formError && <span className='form-error'>{formError}</span>}
            {actionMessage && !formError && (
              <span className='form-success'>{actionMessage}</span>
            )}
          </div>
        )}
      </div>

      {loading && <div className='loading-banner'>Refreshing history…</div>}

      {view === 'results' ? (
        <div className='results-view'>
          {groupedWorkouts.length === 0 ? (
            <div className='empty-state'>
              No workouts logged yet for this exercise.
            </div>
          ) : (
            groupedWorkouts.map((entry, idx) => {
              const maxE1RM = entry.workingSets.reduce((max, set) => {
                const e1rm = est1RM(set.weight, set.reps);
                return e1rm > max ? e1rm : max;
              }, 0);
              const canDelete = entry.sources?.some(
                (src) => src.origin === 'local'
              );

              return (
                <div key={idx} className='workout-entry'>
                  <div className='workout-date-header'>
                    <h2>
                      {entry.date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </h2>
                    {canDelete && (
                      <button
                        className='remove-entry-btn'
                        type='button'
                        onClick={() => handleRemoveEntry(entry)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {entry.warmupSets.length > 0 && (
                    <div className='sets-section'>
                      <h3 className='sets-section-title'>Warm-up</h3>
                      <div className='sets-list'>
                        {entry.warmupSets.map((set, i) => (
                          <div key={i} className='set-item'>
                            <div className='set-number'>{set.setNumber}</div>
                            <div className='set-details'>
                              {set.reps} reps x {set.weight} lb
                              {isPerHandExercise && (
                                <span className='per-hand-indicator'>
                                  {' '}
                                  per dumbbell
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.workingSets.length > 0 && (
                    <div className='sets-section'>
                      <h3 className='sets-section-title'>Working sets</h3>
                      <div className='sets-list'>
                        {entry.workingSets.map((set, i) => (
                          <div key={i} className='set-item'>
                            <div className='set-number'>{set.setNumber}</div>
                            <div className='set-details'>
                              {set.reps} reps x {set.weight} lb
                              {isPerHandExercise && (
                                <span className='per-hand-indicator'>
                                  {' '}
                                  per dumbbell
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {maxE1RM > 0 && (
                    <div className='e1rm-section'>
                      <div className='e1rm-icon'>⚡</div>
                      <div className='e1rm-text'>
                        <span className='e1rm-label'>Est. 1 Rep Max</span>
                        <span className='e1rm-value'>
                          {maxE1RM.toFixed(1)} lb in 1 Rep
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className='trends-view'>
          <TrendsCharts data={trendData} isPerHand={isPerHandExercise} />
        </div>
      )}
    </div>
  );
}

function TrendsCharts({ data, isPerHand }) {
  const [Charts, setCharts] = useState(null);

  useEffect(() => {
    import('recharts').then((recharts) => {
      setCharts({
        LineChart: recharts.LineChart,
        Line: recharts.Line,
        CartesianGrid: recharts.CartesianGrid,
        XAxis: recharts.XAxis,
        YAxis: recharts.YAxis,
        Tooltip: recharts.Tooltip,
        ResponsiveContainer: recharts.ResponsiveContainer,
        Legend: recharts.Legend,
      });
    });
  }, []);

  if (!Charts || data.length === 0) {
    return (
      <div className='empty-state'>
        {!Charts ? 'Loading charts...' : 'No trend data available yet.'}
      </div>
    );
  }

  const {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
  } = Charts;

  // Format dates for display
  const formattedData = data.map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  // Calculate Y-axis ranges
  const e1rmValues = data.map((d) => d.e1rm).filter(Boolean);
  const weightValues = data.map((d) => d.weight).filter(Boolean);
  const e1rmMin = Math.min(...e1rmValues);
  const e1rmMax = Math.max(...e1rmValues);
  const weightMin = Math.min(...weightValues);
  const weightMax = Math.max(...weightValues);
  const latest = data[data.length - 1] || {};
  const comparison = latest.population;

  return (
    <div className='trends-charts'>
      <div className='trend-card'>
        <div className='trend-header'>
          <div>
            <h3>Est. 1 Rep Max</h3>
            <div className='trend-value'>
              {data[data.length - 1]?.e1rm?.toFixed(1) || '—'} lbs in 1 rep
            </div>
            <div className='trend-timestamp'>
              Logged {getTimeAgo(data[data.length - 1]?.dateObj)}
            </div>
          </div>
          <div className='trend-arrow'>→</div>
        </div>
        <div className='trend-chart'>
          <ResponsiveContainer width='100%' height={200}>
            <LineChart data={formattedData}>
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='rgba(255,255,255,0.1)'
              />
              <XAxis
                dataKey='dateLabel'
                stroke='rgba(255,255,255,0.6)'
                style={{ fontSize: '12px' }}
              />
              <YAxis
                domain={[Math.floor(e1rmMin - 5), Math.ceil(e1rmMax + 5)]}
                stroke='rgba(255,255,255,0.6)'
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1d29',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                }}
              />
              <Line
                type='monotone'
                dataKey='e1rm'
                stroke='#ff4d61'
                strokeWidth={2}
                dot={{ fill: '#ff4d61', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {comparison && (
        <div className='trend-card population-card'>
          <div className='trend-header'>
            <div>
              <h3>Population Percentile</h3>
              <div className='trend-value'>{comparison.percentile}%</div>
              <div className='trend-timestamp'>
                {comparison.label} ·{' '}
                {comparison.gender === 'female' ? 'Female' : 'Male'} lifters at{' '}
                {comparison.bodyweight} lb{isPerHand && ' (per dumbbell)'}
              </div>
            </div>
            <div className='trend-arrow'>↗︎</div>
          </div>
          <div className='population-detail'>
            <span className='population-note'>
              Based on Strength Level data
            </span>
            <a
              className='source-link'
              href={comparison.source}
              target='_blank'
              rel='noreferrer'
            >
              strengthlevel.com
            </a>
          </div>
          {isPerHand && Number.isFinite(latest.weight) && (
            <div className='per-hand-note'>
              Weight shown is per dumbbell (already split for Strength Level
              comparison).
            </div>
          )}
        </div>
      )}

      <div className='trend-card'>
        <div className='trend-header'>
          <div>
            <h3>Weight</h3>
            <div className='trend-value'>
              {data[data.length - 1]?.weight || '—'} lbs
              {isPerHand && ' per dumbbell'} in 1 set
            </div>
            <div className='trend-timestamp'>
              Logged {getTimeAgo(data[data.length - 1]?.dateObj)}
            </div>
          </div>
          <div className='trend-arrow'>→</div>
        </div>
        <div className='trend-chart'>
          <ResponsiveContainer width='100%' height={200}>
            <LineChart data={formattedData}>
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='rgba(255,255,255,0.1)'
              />
              <XAxis
                dataKey='dateLabel'
                stroke='rgba(255,255,255,0.6)'
                style={{ fontSize: '12px' }}
              />
              <YAxis
                domain={[Math.floor(weightMin - 5), Math.ceil(weightMax + 5)]}
                stroke='rgba(255,255,255,0.6)'
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1d29',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                }}
              />
              <Line
                type='monotone'
                dataKey='weight'
                stroke='#ff4d61'
                strokeWidth={2}
                dot={{ fill: '#ff4d61', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date) {
  if (!date) return 'recently';
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}
