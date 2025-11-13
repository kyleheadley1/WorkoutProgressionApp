import React, { useState } from 'react';
import ExerciseProgress from './ExerciseProgress';

/** Add any exercises you want charted */
const EX_CHOICES = [
  { id: 'dumbbellBenchPress', label: 'DB Bench Press' },
  { id: 'pullUps', label: 'Pull-ups' },
  { id: 'romanianDeadlifts', label: 'Romanian Deadlifts' },
];

export default function Progress() {
  const [ex, setEx] = useState(EX_CHOICES[0].id);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Progress</h2>
        <select value={ex} onChange={(e) => setEx(e.target.value)}>
          {EX_CHOICES.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <ExerciseProgress
        exerciseId={ex}
        title={EX_CHOICES.find((x) => x.id === ex)?.label || ex}
      />
    </div>
  );
}
