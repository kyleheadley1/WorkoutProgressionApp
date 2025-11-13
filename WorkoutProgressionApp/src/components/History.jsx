// src/components/History.jsx
import React, { useEffect, useState } from 'react';
import { readSessions } from '../lib/storage';
import { api } from '../lib/api';

export default function History({ userId = 'demoUser' }) {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    // Try loading local sessions first
    let local = readSessions(userId);
    setWorkouts(local);

    // Then fetch server data if available
    (async () => {
      try {
        const serverData = await api.listWorkouts();
        if (serverData?.length) {
          // Merge & dedupe by date
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
    return <div>No workouts logged yet.</div>;
  }

  return (
    <div style={{ padding: '10px' }}>
      <h2>Workout History</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {workouts.map((w, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,.08)',
            }}
          >
            <h3 style={{ marginBottom: 4 }}>
              {w.dayType?.toUpperCase() || 'Unknown'} —{' '}
              {new Date(w.date).toLocaleDateString()}
            </h3>
            {w.exercises?.map((ex, j) => (
              <div key={j} style={{ marginLeft: 12, marginBottom: 8 }}>
                <strong>{ex.exerciseId}</strong>
                <div style={{ fontSize: 13, color: '#555' }}>
                  {ex.sets
                    ?.map(
                      (s, k) =>
                        `Set ${s.setNumber}: ${s.reps} reps @ ${s.weight} lb${
                          s.rpe ? ` (RPE ${s.rpe})` : ''
                        }`
                    )
                    .join(' • ')}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
