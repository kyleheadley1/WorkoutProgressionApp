// src/lib/scheduler.js
import { getSessionsBetween } from './storage';

function startOfDay(d) {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

export function startOfWeekSunday(d = new Date()) {
  const t = startOfDay(d);
  const day = t.getDay(); // 0 = Sunday
  const diff = day; // days since Sunday
  const s = new Date(t);
  s.setDate(t.getDate() - diff);
  return s;
}

export function endOfDay(d) {
  const t = new Date(d);
  t.setHours(23, 59, 59, 999);
  return t;
}

function countByDayType(sessions) {
  const counts = new Map();
  for (const s of sessions) {
    const types = (s.exercises || []).length ? [s.dayType] : [s.dayType];
    for (const t of types) {
      if (!t) continue;
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  return counts;
}

function coverageFromSessions(sessions) {
  const counts = countByDayType(sessions);
  const pushish =
    (counts.get('push') || 0) +
    (counts.get('upper') || 0) +
    (counts.get('full') || 0);
  const pullish =
    (counts.get('pull') || 0) +
    (counts.get('upper') || 0) +
    (counts.get('full') || 0);
  const legs =
    (counts.get('legs') || 0) +
    (counts.get('lower') || 0) +
    (counts.get('full') || 0);
  const hasUpper = (counts.get('upper') || 0) > 0;
  return { pushish, pullish, legs, hasUpper };
}

/**
 * Decide which day-type to present today.
 * scheduleType: 'ppl5x' = PPL 5x (Mon Push, Tue Pull, Wed Legs, Thu Rest, Fri Upper, Sat Lower/Full).
 * Rules for PPL 5x:
 * - Sunday always Rest. Also week resets on Sunday.
 * - Mon/Tue/Wed fixed: Push, Pull, Legs (even if earlier days missed).
 * - Thu Rest.
 * - Fri Upper.
 * - Sat Lower by default; switch to Full if we still need broad coverage (any region < 2) or if Upper was missed.
 */
export function recommendDayType(
  userId,
  now = new Date(),
  scheduleType = 'ppl5x',
) {
  if (scheduleType === 'ppl5x') return ppl5xRecommend(userId, now);
  return ppl5xRecommend(userId, now);
}

function ppl5xRecommend(userId, now) {
  const wkStart = startOfWeekSunday(now);
  const today = startOfDay(now);
  const sessions = getSessionsBetween(userId, wkStart, endOfDay(now));

  const weekday = today.getDay(); // 0 Sun ... 6 Sat
  if (weekday === 0) return 'rest'; // Sunday

  if (weekday === 1) return 'push'; // Monday
  if (weekday === 2) return 'pull'; // Tuesday
  if (weekday === 3) return 'legs'; // Wednesday
  if (weekday === 4) return 'rest'; // Thursday

  if (weekday === 5) return 'upper'; // Friday by plan

  // Saturday logic:
  const cov = coverageFromSessions(sessions);
  const needsPushish = cov.pushish < 2;
  const needsPullish = cov.pullish < 2;
  const needsLegs = cov.legs < 2;
  // If Upper was missed so far, or any region still needs coverage, go Full
  if (!cov.hasUpper || needsPushish || needsPullish || needsLegs) {
    return 'full';
  }
  return 'lower'; // otherwise Lower
}
