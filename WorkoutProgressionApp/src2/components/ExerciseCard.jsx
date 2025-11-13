
// src/components/ExerciseCard.jsx
import React, { useMemo, useState } from "react";
import { saveSession } from "../lib/storage";

export default function ExerciseCard({ userId, dayType, def, recommendation, onSaved }) {
  const { exerciseId, name } = def;
  const { recommended, reason, meta } = recommendation;
  const [weight, setWeight] = useState(recommended?.weight ?? 0);
  const [repsCsv, setRepsCsv] = useState(Array(recommended?.sets || def.repScheme.sets).fill(recommended?.reps ?? (def.repScheme.minReps || def.repScheme.targetReps)).join(","));
  const [rpeCsv, setRpeCsv] = useState("");

  const setsCount = recommended?.sets || def.repScheme.sets;

  function handleSave() {
    // Build one-exercise session for simplicity; parent can aggregate if desired.
    const sets = repsCsv.split(",").map((s, idx) => ({
      setNumber: idx + 1,
      weight: Number(weight),
      reps: Number((s || "").trim() || 0),
      rpe: rpeCsv ? Number((rpeCsv.split(",")[idx] || "").trim() || NaN) : undefined,
    }));

    const session = {
      userId,
      date: new Date().toISOString(),
      dayType,
      exercises: [{
        exerciseId,
        target: { weight: Number(weight), reps: recommendation?.recommended?.reps ?? def.repScheme.targetReps ?? def.repScheme.minReps, sets: setsCount },
        sets
      }]
    };

    saveSession(session);
    if (onSaved) onSaved(session);
  }

  return (
    <div className="exercise-item">
      <h4>{name}</h4>
      <p>
        Target: {setsCount}×{recommendation?.recommended?.reps ?? (def.repScheme.targetReps || `${def.repScheme.minReps}-${def.repScheme.maxReps}`)} @ {weight}
      </p>
      <p className="hint">{reason}</p>
      <div style={{ display: "grid", gap: "6px", marginTop: "8px" }}>
        <label>
          Weight used
          <input type="number" step="2.5" min="0" value={weight} onChange={e => setWeight(Number(e.target.value))} />
        </label>
        <label>
          Reps per set (CSV)
          <input type="text" value={repsCsv} onChange={e => setRepsCsv(e.target.value)} />
        </label>
        <label>
          RPE per set (CSV, optional)
          <input type="text" value={rpeCsv} onChange={e => setRpeCsv(e.target.value)} placeholder="e.g., 8.5,9,9" />
        </label>
        <button onClick={handleSave}>Save Sets</button>
      </div>
    </div>
  );
}
