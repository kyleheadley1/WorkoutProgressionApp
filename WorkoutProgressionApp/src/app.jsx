import { ToastProvider } from './components/ToastProvider.jsx';
// top
import Progress from './components/progress/Progress.jsx';
import History from './components/History.jsx';
// state near top of App()

import { syncLocalToServer } from './lib/sync'; // we created this earlier

// src/app.jsx
import React, { useEffect, useState } from 'react';
import Pull from './components/Pull';
import Push from './components/Push';
import Legs from './components/Legs';
import './components/workout.css';
import { seedExample } from './lib/storage';
import { recommendDayType } from './lib/scheduler';

function Rest() {
  return <div className='rest-day'>Rest Day 😴</div>;
}

export default function App() {
  const [override, setOverride] = useState(null); // 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full' | null
  const [dayType, setDayType] = useState(null);
  const [view, setView] = useState('today'); // 'today' | 'history' | 'progress'

  const userId = 'demoUser';

  useEffect(() => {
    seedExample(userId);
    const rec = recommendDayType(userId, new Date());
    setDayType(rec);
  }, []);

  function renderByType(t) {
    switch (t) {
      case 'push':
        return <Push userId={userId} />;
      case 'pull':
        return <Pull userId={userId} />;
      case 'legs':
        return <Legs userId={userId} />;
      case 'upper':
        return (
          <div>
            <h3>Upper Day</h3>
            <p>Program upper-body compounds + accessories.</p>
          </div>
        );
      case 'lower':
        return (
          <div>
            <h3>Lower Day</h3>
            <p>Program squats/hinge + accessories.</p>
          </div>
        );
      case 'full':
        return (
          <div>
            <h3>Full Body</h3>
            <p>Blend push, pull, and legs; prioritize weak links.</p>
          </div>
        );
      case 'rest':
      default:
        return <Rest />;
    }
  }
  const dayTypeUsed = override ?? dayType;

  return (
    <ToastProvider>
      <div className='app'>
        <h1>Workout App</h1>
        {/* View switcher */}+{' '}
        <div style={{ display: 'flex', gap: 8, margin: '8px 0 12px' }}>
          + <button onClick={() => setView('today')}>Today</button>+{' '}
          <button onClick={() => setView('history')}>History</button>+{' '}
          <button onClick={() => setView('progress')}>Progress</button>+{' '}
        </div>
        {/* ✅ INSERT THE DEV PANEL RIGHT BELOW THIS LINE */}
        <div
          style={{
            margin: '12px 0',
            padding: '10px',
            background: '#f6f7f8',
            borderRadius: 10,
          }}
        >
          <strong>Dev panel</strong>{' '}
          <select
            value={override ?? ''}
            onChange={(e) => setOverride(e.target.value || null)}
            style={{ marginLeft: 8 }}
          >
            <option value=''>Auto</option>
            <option value='push'>Push</option>
            <option value='pull'>Pull</option>
            <option value='legs'>Legs</option>
            <option value='upper'>Upper</option>
            <option value='lower'>Lower</option>
            <option value='full'>Full</option>
            <option value='rest'>Rest</option>
          </select>
          <button
            style={{ marginLeft: 8 }}
            onClick={() => {
              seedExample(userId);
              alert('Seeded a few local sessions.');
            }}
          >
            Seed local
          </button>
          <button
            style={{ marginLeft: 8 }}
            onClick={async () => {
              const n = await syncLocalToServer();
              alert(`Synced ${n} local sessions to server.`);
            }}
          >
            Sync to server
          </button>
        </div>
        {/* ✅ END DEV PANEL */}
        <div style={{ display: 'flex', gap: 8, margin: '8px 0 12px' }}>
          <button onClick={() => setView('today')}>Today</button>
          <button onClick={() => setView('history')}>History</button>
          <button onClick={() => setView('progress')}>Progress</button>
        </div>
        {view === 'today' ? (
          <div className='workout-container'>
            <div className='current-workout-container'>
              <h2>Today's Workout</h2>
              {dayType === null ? (
                <div>Loading...</div>
              ) : (
                renderByType(dayTypeUsed)
              )}
            </div>
            <div className='relevant-stats-container'>
              <h2>Schedule Logic</h2>
              <p>
                Sun = Rest (week resets). Mon/Tue/Wed = Push/Pull/Legs. Thu =
                Rest. Fri = Upper. Sat = Lower, unless Upper was missed or
                coverage &lt; 2 → Full.
              </p>
            </div>
          </div>
        ) : view === 'history' ? (
          <div
            className='history-container'
            style={{ background: '#f3f4f5', padding: 24, borderRadius: 16 }}
          >
            <History />
          </div>
        ) : (
          <div
            className='history-container'
            style={{ background: '#f3f4f5', padding: 24, borderRadius: 16 }}
          >
            <Progress />
          </div>
        )}
      </div>
    </ToastProvider>
  );
}
