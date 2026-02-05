
// src/components/Legs.jsx
import React from "react";
import ExerciseCard from "./ExerciseCard";
import { useRecommendations } from "../hooks/useRecommendations";

const defs = [
  { exerciseId: "bulgarianSplitSquats", name: "Bulgarian Split Squats",
    increment: 5, rounding: 2.5, startWeight: 30,
    repScheme: { type: "fixed", targetReps: 4, sets: 4 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 } },
  { exerciseId: "bulgarianSplitSquatsPause", name: "Bulgarian Split Squats (Pause)",
    increment: 5, rounding: 2.5, startWeight: 20,
    repScheme: { type: "fixed", targetReps: 5, sets: 2 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 } },
  { exerciseId: "romanianDeadlifts", name: "Romanian Deadlifts",
    increment: 5, rounding: 2.5, startWeight: 95,
    repScheme: { type: "fixed", targetReps: 10, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 } },
  { exerciseId: "dumbbellGobletSquat", name: "Dumbbell Goblet Squat",
    increment: 5, rounding: 2.5, startWeight: 60,
    repScheme: { type: "range", minReps: 10, maxReps: 12, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 } },
  { exerciseId: "calfRaises", name: "Calf Raises",
    increment: 5, rounding: 2.5, startWeight: 50,
    repScheme: { type: "range", minReps: 15, maxReps: 20, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 } },
  { exerciseId: "weightedCrunches", name: "Weighted Crunches",
    increment: 5, rounding: 2.5, startWeight: 20,
    repScheme: { type: "range", minReps: 12, maxReps: 20, sets: 3 },
    failurePolicy: { repeatFailures: 2, deloadPercent: 0.1 }, modality: "dumbbell" },
];

export default function Legs({ userId = "demoUser", onViewHistory }) {
  const { items, loading } = useRecommendations(userId, defs);

  return (
    <div className="legs-workout">
      <h3>Leg Day</h3>
      <div className="exercise-list">
        {loading ? <p>Loading...</p> :
          items.map((rec, idx) => (
            <ExerciseCard
              key={defs[idx].exerciseId}
              userId={userId}
              dayType="legs"
              def={defs[idx]}
              recommendation={rec}
              onViewHistory={onViewHistory}
            />
          ))}
      </div>
    </div>
  );
}
