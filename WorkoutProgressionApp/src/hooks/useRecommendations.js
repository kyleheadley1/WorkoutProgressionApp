
// src/hooks/useRecommendations.js
import { useEffect, useMemo, useState } from "react";
import { computeNextTargetFromHistory } from "../lib/progressionEngineStandalone";
import { getHistoryForExercise } from "../lib/storage";

/**
 * useRecommendations
 * @param {string} userId
 * @param {Array} exerciseDefs list of exercise definitions
 * @returns { {items, loading} }
 */
export function useRecommendations(userId, exerciseDefs) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const res = exerciseDefs.map(def => {
      const hist = getHistoryForExercise(userId, def.exerciseId);
      return computeNextTargetFromHistory(def, hist);
    });
    setItems(res);
    setLoading(false);
  }, [userId, JSON.stringify(exerciseDefs)]);

  return { items, loading };
}
