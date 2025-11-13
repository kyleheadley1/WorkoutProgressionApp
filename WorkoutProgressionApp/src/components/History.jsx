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
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
        }}
      >
        No workouts logged yet. Start your first workout!
      </div>
    );
  }

  return (
    <div>
      <h2
        style={{
          marginBottom: '24px',
          fontSize: '22px',
          fontWeight: 700,
          color: '#1a1d29',
        }}
      >
        Workout History
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {workouts.map((w, i) => (
          <div
            key={i}
            className='history-card'
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,.08)',
              border: '1px solid rgba(0, 0, 0, 0.04)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.08)';
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#1a1d29',
                }}
              >
                {w.dayType?.toUpperCase() || w.type?.toUpperCase() || 'Unknown'}
              </h3>
              <span
                style={{
                  fontSize: '14px',
                  color: '#888',
                  fontWeight: 500,
                }}
              >
                {new Date(w.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            {w.exercises?.map((ex, j) => (
              <div
                key={j}
                style={{
                  marginBottom: '16px',
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '10px',
                }}
              >
                <strong
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '15px',
                    color: '#1a1d29',
                    fontWeight: 600,
                  }}
                >
                  {ex.exerciseId}
                </strong>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#666',
                    lineHeight: '1.6',
                  }}
                >
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
