import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { canonicalizeExerciseId } from '../../lib/aliases';
import { est1RM } from '../ExerciseCard'; // reuse estimator

function flatten(workouts) {
  const rows = [];
  for (const w of workouts) {
    for (const ex of w.exercises || []) {
      for (const set of ex.sets || []) {
        rows.push({
          date: new Date(w.date),
          exerciseId: canonicalizeExerciseId(ex.exerciseId),
          reps: set.reps,
          weight: set.weight,
        });
      }
    }
  }
  return rows;
}

export default function ExerciseProgress({ exerciseId, title }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let ok = true;
    (async () => {
      const data = await api.listWorkouts();
      if (!ok) return;
      const canon = canonicalizeExerciseId(exerciseId);
      const flat = flatten(data).filter((r) => r.exerciseId === canon);
      // per day: pick top set weight (heaviest)
      const byDay = new Map();
      for (const r of flat) {
        const day = r.date.toISOString().slice(0, 10);
        const cur = byDay.get(day);
        if (!cur || r.weight > cur.weight) byDay.set(day, r);
      }
      const series = Array.from(byDay.entries())
        .map(([d, r]) => ({
          date: d,
          weight: r.weight,
          e1rm: est1RM(r.weight, r.reps) || null,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setRows(series);
    })();
    return () => {
      ok = false;
    };
  }, [exerciseId]);

  const data = rows;

  // Lazy load recharts to avoid blocking initial load
  const [Charts, setCharts] = useState(null);
  useEffect(() => {
    let ok = true;
    import('recharts').then((recharts) => {
      if (!ok) return;
      setCharts({
        LineChart: recharts.LineChart,
        Line: recharts.Line,
        CartesianGrid: recharts.CartesianGrid,
        XAxis: recharts.XAxis,
        YAxis: recharts.YAxis,
        Tooltip: recharts.Tooltip,
        ResponsiveContainer: recharts.ResponsiveContainer,
        Legend: recharts.Legend,
      });
    });
    return () => {
      ok = false;
    };
  }, []);

  if (!Charts) {
    return (
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 3px 14px rgba(0,0,0,.06)',
        }}
      >
        <h3 style={{ margin: '0 0 10px' }}>{title}</h3>
        <div style={{ padding: 20, color: '#666' }}>Loading charts…</div>
      </div>
    );
  }
  const { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } = Charts;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 3px 14px rgba(0,0,0,.06)',
      }}
    >
      <h3 style={{ margin: '0 0 10px' }}>{title}</h3>

      <div style={{ height: 260, marginBottom: 16 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='date' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type='monotone' dataKey='weight' name='Top-set (lb)' dot />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='date' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type='monotone' dataKey='e1rm' name='est-1RM (lb)' dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
