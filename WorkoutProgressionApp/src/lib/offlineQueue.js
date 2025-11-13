// src/lib/offlineQueue.js

/**
 * Super-simple offline/failed-request queue stored in localStorage.
 * - enqueue(payload): add a session to the queue
 * - processQueue(api): try to flush to the server, with incremental attempts
 * - initQueueSync(api): sets up 'online' listener + one-time run on load
 */

const KEY = 'wp_sync_queue_v1';

function readQ() {
  try {
    const raw =
      typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : '[]';
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQ(list) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(KEY, JSON.stringify(list));
    }
  } catch {
    // swallow
  }
}

/**
 * Enqueue a workout session for later sync.
 * Adds metadata like attempt counter, lastError.
 */
export function enqueueSession(session) {
  const q = readQ();
  q.push({
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    payload: session,
    attempts: 0,
    lastError: null,
    enqueuedAt: Date.now(),
  });
  writeQ(q);
  return q.length;
}

/**
 * Process the queue sequentially.
 * - On success: remove item
 * - On failure: increment attempts, store lastError, keep item for later
 * Returns { processed, succeeded, failed }
 */
export async function processQueue(api) {
  const q = readQ();
  if (!q.length) return { processed: 0, succeeded: 0, failed: 0 };

  let processed = 0,
    succeeded = 0,
    failed = 0;
  const next = [];

  for (const item of q) {
    processed++;
    try {
      await api.createWorkout(item.payload);
      succeeded++;
      // success: do not re-add
    } catch (e) {
      failed++;
      next.push({
        ...item,
        attempts: (item.attempts || 0) + 1,
        lastError: e?.message || String(e),
      });
    }
  }

  writeQ(next);
  return { processed, succeeded, failed };
}

/**
 * Initialize syncing:
 * - Process once on init
 * - Re-process whenever browser goes online
 * - Optional interval retry (disabled by default)
 */
let _initialized = false;
export function initQueueSync(api, { intervalMs = 0 } = {}) {
  if (_initialized) return;
  _initialized = true;

  // Kick once on load
  processQueue(api).catch(() => {});

  // Re-run when network comes back
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      processQueue(api).catch(() => {});
    });
  }

  // Optional periodic retry
  if (intervalMs > 0 && typeof window !== 'undefined') {
    setInterval(() => {
      processQueue(api).catch(() => {});
    }, intervalMs);
  }
}
