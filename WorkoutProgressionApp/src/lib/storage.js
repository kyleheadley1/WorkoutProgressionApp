// src/lib/storage.js
const KEY = 'wp_sessions_v1';
const USER_EXERCISES_KEY = 'wp_userExercises_v1';
import { canonicalizeExerciseId } from './aliases';

function normalizeSession(session) {
  if (!session) return session;
  const cloned = { ...session };
  if (Array.isArray(cloned.exercises)) {
    cloned.exercises = cloned.exercises.map((ex) => {
      const exerciseId = canonicalizeExerciseId(ex.exerciseId);
      return { ...ex, exerciseId };
    });
  }
  return cloned;
}

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
  const normalized = normalizeSession(session);
  list.push(normalized);
  writeAll(list);
  return normalized;
}

export function getHistoryForExercise(userId, exerciseId, limit = 10) {
  const list = readAll();
  const canonical = canonicalizeExerciseId(exerciseId);
  const filtered = list
    .filter((s) => s.userId === userId)
    .flatMap((s) =>
      (s.exercises || []).filter(
        (e) => canonicalizeExerciseId(e.exerciseId) === canonical,
      ),
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
  const hist = getHistoryForExercise(
    userId,
    canonicalizeExerciseId(exerciseId),
    1,
  );
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

export function readSessions(userId) {
  const list = readAll();
  return userId ? list.filter((s) => s.userId === userId) : list;
}

export function deleteExerciseSession(userId, exerciseId, dateKey) {
  const list = readAll();
  const targetKey = dateKey;
  const next = [];
  list.forEach((session) => {
    if (session.userId !== userId) {
      next.push(session);
      return;
    }
    const sessionDate = new Date(session.date);
    const sessionKey = Number.isNaN(sessionDate.getTime())
      ? null
      : sessionDate.toISOString().slice(0, 10);
    if (sessionKey !== targetKey) {
      next.push(session);
      return;
    }
    const remainingExercises = (session.exercises || []).filter(
      (ex) => ex.exerciseId !== exerciseId,
    );
    if (remainingExercises.length) {
      next.push({ ...session, exercises: remainingExercises });
    }
    // Otherwise drop the session entirely.
  });
  writeAll(next);
}

/** User-added exercise names for dropdown/suggestions when adding past workouts. */
export function getSavedUserExercises() {
  try {
    const raw =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(USER_EXERCISES_KEY)
        : null;
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addSavedUserExercise(exerciseId, name) {
  if (!exerciseId || !name) return;
  const list = getSavedUserExercises();
  const canon = canonicalizeExerciseId(exerciseId);
  const existing = list.find(
    (e) => canonicalizeExerciseId(e.exerciseId) === canon,
  );
  if (existing) {
    existing.name = name;
  } else {
    list.push({ exerciseId: canon, name: name.trim() });
  }
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_EXERCISES_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.error('Error saving user exercise:', err);
  }
}

/** Delete an entire workout session from local storage by date and day type. */
export function deleteSession(userId, date, dayType) {
  const list = readAll();
  const dateKey = new Date(date).toISOString().slice(0, 10);
  const next = list.filter((session) => {
    if (session.userId !== userId) return true;
    const sessionDate = new Date(session.date);
    const sessionKey = Number.isNaN(sessionDate.getTime())
      ? ''
      : sessionDate.toISOString().slice(0, 10);
    return !(
      sessionKey === dateKey && (session.dayType || session.type) === dayType
    );
  });
  writeAll(next);
}
