
// src/lib/storage.js
// Simple client-side storage with localStorage. Swap with real API later.

const KEY = "wp_sessions_v1";

function readAll() {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeAll(list) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(KEY, JSON.stringify(list));
    }
  } catch {}
}

export function saveSession(session) {
  const list = readAll();
  list.push(session);
  writeAll(list);
  return session;
}

export function getHistoryForExercise(userId, exerciseId, limit = 10) {
  const list = readAll();
  // newest last
  const filtered = list.filter(s => s.userId === userId).flatMap(s => (s.exercises || []).filter(e => e.exerciseId === exerciseId));
  return filtered.slice(-limit);
}

export function getLastWeight(userId, exerciseId) {
  const hist = getHistoryForExercise(userId, exerciseId, 1);
  if (!hist.length) return null;
  return hist[0]?.target?.weight ?? null;
}

// For demo purposes: seed some sessions
export function seedExample(userId) {
  const list = readAll();
  if (list.length) return; // don't overwrite existing
  const date = new Date().toISOString();
  writeAll([
    {
      userId, date, dayType: 'push',
      exercises: [{
        exerciseId: 'dumbbellBenchPress',
        target: { weight: 70, reps: 5, sets: 3 },
        sets: [
          { setNumber: 1, weight: 70, reps: 5, rpe: 8.5 },
          { setNumber: 2, weight: 70, reps: 5, rpe: 9.0 },
          { setNumber: 3, weight: 70, reps: 5, rpe: 9.0 },
        ]
      }]
    }
  ]);
}
