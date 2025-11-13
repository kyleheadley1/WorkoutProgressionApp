// src/lib/storage.js
const KEY = 'wp_sessions_v1';

function readAll() {
  try {
    const raw =
      typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
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
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

export function saveSession(session) {
  const list = readAll();
  list.push(session);
  writeAll(list);
  return session;
}

export function getHistoryForExercise(userId, exerciseId, limit = 10) {
  const list = readAll();
  const filtered = list
    .filter((s) => s.userId === userId)
    .flatMap((s) =>
      (s.exercises || []).filter((e) => e.exerciseId === exerciseId)
    );
  return filtered.slice(-limit);
}

export function getSessionsBetween(userId, start, end) {
  const list = readAll().filter((s) => s.userId === userId);
  const st = new Date(start).getTime();
  const en = new Date(end).getTime();
  return list.filter((s) => {
    const t = new Date(s.date).getTime();
    return t >= st && t <= en;
  });
}

export function getLastWeight(userId, exerciseId) {
  const hist = getHistoryForExercise(userId, exerciseId, 1);
  if (!hist.length) return null;
  return hist[0]?.target?.weight ?? null;
}

export function seedExample(userId) {
  const list = readAll();
  if (list.length) return;
  const now = new Date();
  const iso = now.toISOString();
  // Seed PPL early in the week
  writeAll([
    {
      userId,
      date: iso,
      dayType: 'push',
      exercises: [
        {
          exerciseId: 'dumbbellBenchPress',
          target: { weight: 70, reps: 5, sets: 3 },
          sets: [
            { setNumber: 1, weight: 70, reps: 5, rpe: 8.5 },
            { setNumber: 2, weight: 70, reps: 5, rpe: 9 },
            { setNumber: 3, weight: 70, reps: 5, rpe: 9 },
          ],
        },
      ],
    },
    {
      userId,
      date: iso,
      dayType: 'pull',
      exercises: [
        {
          exerciseId: 'pullUps',
          target: { weight: 0, reps: 10, sets: 4 },
          sets: [
            { setNumber: 1, weight: 0, reps: 10 },
            { setNumber: 2, weight: 0, reps: 10 },
            { setNumber: 3, weight: 0, reps: 10 },
            { setNumber: 4, weight: 0, reps: 9 },
          ],
        },
      ],
    },
    {
      userId,
      date: iso,
      dayType: 'legs',
      exercises: [
        {
          exerciseId: 'romanianDeadlifts',
          target: { weight: 95, reps: 10, sets: 3 },
          sets: [
            { setNumber: 1, weight: 95, reps: 10 },
            { setNumber: 2, weight: 95, reps: 10 },
            { setNumber: 3, weight: 95, reps: 10 },
          ],
        },
      ],
    },
  ]);
}
