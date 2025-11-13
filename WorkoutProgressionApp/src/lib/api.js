// src/lib/api.js
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function http(path, { method = 'GET', json } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: json ? { 'Content-Type': 'application/json' } : undefined,
    body: json ? JSON.stringify(json) : undefined,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => 'error');
    throw new Error(`API ${method} ${path} failed: ${res.status} ${msg}`);
  }
  return res.headers.get('content-type')?.includes('application/json')
    ? res.json()
    : res.text();
}

export const api = {
  health: () => http('/health'),
  listWorkouts: ({ from, to } = {}) => {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return http(`/workouts${qs}`);
  },
  createWorkout: (doc) => http('/workouts', { method: 'POST', json: doc }),
  getWorkout: (id) => http(`/workouts/${id}`),
  updateWorkout: (id, patch) =>
    http(`/workouts/${id}`, { method: 'PATCH', json: patch }),
  deleteWorkout: (id) => http(`/workouts/${id}`, { method: 'DELETE' }),
};
