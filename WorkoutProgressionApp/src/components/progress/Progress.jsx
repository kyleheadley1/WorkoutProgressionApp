import React, { useMemo, useState } from 'react';
import ExerciseProgress from './ExerciseProgress';

/** All exercises in the app, with friendly labels */
const ALL_EXERCISES = [
  // Push
  { id: 'dumbbellBenchPress', label: 'Dumbbell Bench Press' },
  { id: 'larsenPress', label: 'Larsen Press' },
  { id: 'standingArnoldPress', label: 'Standing Arnold Press' },
  { id: 'deficitPushups', label: 'Deficit Push-ups' },
  { id: 'lateralRaises', label: 'Lateral Raises' },
  { id: 'skullCrushers', label: 'Skull-crushers' },
  { id: 'tricepKickback', label: 'Single-arm Tricep Kickback' },
  // Pull
  { id: 'pullUps', label: 'Pull-ups' },
  { id: 'pullUp', label: 'Pull-up' },
  { id: 'rearDeltRaises', label: 'Rear Delt Raises' },
  { id: 'latPulldowns', label: 'Lat Pulldowns' },
  { id: 'hammerCurls', label: 'Hammer Curls' },
  { id: 'preacherCurls', label: 'Preacher Curls' },
  // Upper
  { id: 'closeGripInclineDumbbellPress', label: 'Close Grip Incline DB Press' },
  { id: 'dumbbellRow', label: 'Dumbbell Row' },
  { id: 'dumbbellLateralRaise', label: 'Dumbbell Lateral Raise' },
  { id: 'dumbbellBicepCurl', label: 'Dumbbell Bicep Curl' },
  { id: 'diamondPushUp', label: 'Diamond Push-up' },
  // Lower
  { id: 'trapBarDeadlift', label: 'Trap Bar Deadlift' },
  { id: 'dumbbellRomanianDeadlift', label: 'Dumbbell Romanian Deadlift' },
  { id: 'romanianDeadlifts', label: 'Romanian Deadlifts (Barbell)' },
  { id: 'dumbbellGobletSquat', label: 'Dumbbell Goblet Squat' },
  { id: 'gobletSquats', label: 'Goblet Squats' },
  { id: 'dumbbellStepUp', label: 'Dumbbell Step-up' },
  { id: 'seatedDumbbellCalfRaise', label: 'Seated Dumbbell Calf Raise' },
  { id: 'hangingLegRaise', label: 'Hanging Leg Raise' },
  { id: 'legPress', label: 'Leg Press' },
  { id: 'calfRaises', label: 'Calf Raises' },
  { id: 'legExtensions', label: 'Leg Extensions' },
  { id: 'legCurls', label: 'Leg Curls' },
  { id: 'bulgarianSplitSquats', label: 'Bulgarian Split Squats' },
  { id: 'bulgarianSplitSquatsPause', label: 'Bulgarian Split Squats (Pause)' },
  // Full body & misc
  { id: 'dumbbellRDL', label: 'Dumbbell RDL' },
  { id: 'chinUps', label: 'Chin-ups' },
  { id: 'singleArmDumbbellRow', label: 'Single-arm DB Row' },
  { id: 'diamondPushups', label: 'Diamond Push-ups' },
];

export default function Progress() {
  // De-duplicate and sort by label
  const EX_CHOICES = useMemo(() => {
    const map = new Map();
    for (const e of ALL_EXERCISES) {
      if (!map.has(e.id)) map.set(e.id, e);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, []);
  const [ex, setEx] = useState(() => (EX_CHOICES[0] ? EX_CHOICES[0].id : ''));

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
