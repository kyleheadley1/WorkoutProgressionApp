// src/components/ExerciseHistory.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { readSessions } from '../lib/storage';
import { api } from '../lib/api';
import { est1RM } from './ExerciseCard';

export default function ExerciseHistory({
  exerciseId,
  exerciseName,
  onBack,
  userId = 'demoUser',
}) {
  const [workouts, setWorkouts] = useState([]);
  const [view, setView] = useState('results'); // 'results' | 'trends'

  useEffect(() => {
    // Load all local sessions
    const allLocal = readSessions(userId);
    const localFiltered = allLocal
      .map((w) => ({
        ...w,
        exercises: (w.exercises || []).filter(
          (e) => e.exerciseId === exerciseId
        ),
      }))
      .filter((w) => w.exercises.length > 0);

    setWorkouts(localFiltered);

    // Then fetch server data if available
    (async () => {
      try {
        const serverData = await api.listWorkouts();
        if (serverData?.length) {
          // Filter for this exercise
          const exerciseWorkouts = serverData
            .map((w) => ({
              ...w,
              exercises: (w.exercises || []).filter(
                (e) => e.exerciseId === exerciseId
              ),
            }))
            .filter((w) => w.exercises.length > 0);

          // Merge with local, dedupe by date
          const combined = [...exerciseWorkouts, ...localFiltered];
          const seen = new Set();
          const unique = combined.filter((w) => {
            const key = w.date + (w.exercises?.[0]?.exerciseId || '');
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
  }, [userId, exerciseId]);

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
        });
      }
      const entry = grouped.get(dateKey);
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
        // Find max weight from working sets
        const maxWeight = Math.max(
          ...entry.workingSets.map((s) => s.weight || 0)
        );
        const maxWeightSet = entry.workingSets.find(
          (s) => s.weight === maxWeight
        );
        if (maxWeightSet) {
          const e1rm = est1RM(maxWeightSet.weight, maxWeightSet.reps);
          data.push({
            date: entry.dateKey,
            dateObj: entry.date,
            weight: maxWeight,
            e1rm: e1rm,
          });
        }
      }
    });
    return data.sort((a, b) => a.date.localeCompare(b.date));
  }, [groupedWorkouts]);

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

      {view === 'results' ? (
        <div className='results-view'>
          {groupedWorkouts.length === 0 ? (
            <div className='empty-state'>
              No workouts logged yet for this exercise.
            </div>
          ) : (
            groupedWorkouts.map((entry, idx) => {
              const latestSet = entry.workingSets[entry.workingSets.length - 1];
              const maxE1RM = entry.workingSets.reduce((max, set) => {
                const e1rm = est1RM(set.weight, set.reps);
                return e1rm > max ? e1rm : max;
              }, 0);

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
          <TrendsCharts data={trendData} />
        </div>
      )}
    </div>
  );
}

function TrendsCharts({ data }) {
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

      <div className='trend-card'>
        <div className='trend-header'>
          <div>
            <h3>Weight</h3>
            <div className='trend-value'>
              {data[data.length - 1]?.weight || '—'} lbs in 1 set
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
