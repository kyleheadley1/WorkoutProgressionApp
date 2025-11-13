// src/lib/sync.js
// One-time/whenever-you-want sync: push any localStorage sessions up to the server.

import { api } from './api';
import { readSessions } from './storage';

/**
 * Upload locally saved sessions to the server.
 * - If your storage is per-user, pass userId (optional).
 * - Returns a count of successfully uploaded items.
 */
export async function syncLocalToServer(userId) {
  // Handle both signatures: readSessions(userId) or readSessions()
  let local = [];
  try {
    local = readSessions.length >= 1 ? readSessions(userId) : readSessions();
  } catch {
    local = [];
  }

  if (!Array.isArray(local) || local.length === 0) return 0;

  let uploaded = 0;
  for (const s of local) {
    try {
      // If a caller passed userId, ensure it's set on each payload
      const payload = userId ? { userId, ...s } : s;
      await api.createWorkout(payload);
      uploaded++;
    } catch (e) {
      // Non-fatal: we just skip failed ones
      console.warn('sync failed for session', s?.date, e?.message ?? e);
    }
  }
  return uploaded;
}
