import { ToastProvider } from './components/ToastProvider.jsx';
import { ProfileProvider, useProfile } from './contexts/ProfileContext.jsx';
import Progress from './components/progress/Progress.jsx';
import History from './components/History.jsx';
import ExerciseHistory from './components/ExerciseHistory.jsx';
import { syncLocalToServer } from './lib/sync';
import React, { useEffect, useState } from 'react';
import Pull from './components/Pull';
import Push from './components/Push';
import Legs from './components/Legs';
import Upper from './components/Upper';
import Lower from './components/Lower';
import FullBody from './components/FullBody';
import './components/workout.css';
import { seedExample } from './lib/storage';
import { recommendDayType } from './lib/scheduler';

function Rest() {
  return <div className='rest-day'>Rest Day 😴</div>;
}

function AppContent() {
  const [override, setOverride] = useState(null);
  const [dayType, setDayType] = useState(null);
  const [view, setView] = useState('today');
  const [exerciseHistory, setExerciseHistory] = useState(null);
  const { profile, setProfile } = useProfile();
  const userId = 'demoUser';

  const handleViewHistory = (exerciseId, exerciseName) => {
    setExerciseHistory({ exerciseId, name: exerciseName });
  };

  const handleBackFromExerciseHistory = () => {
    setExerciseHistory(null);
    setView('today');
  };

  useEffect(() => {
    seedExample(userId);
    const rec = recommendDayType(userId, new Date());
    setDayType(rec);
  }, []);

  function renderByType(t) {
    switch (t) {
      case 'push':
        return <Push userId={userId} onViewHistory={handleViewHistory} />;
      case 'pull':
        return <Pull userId={userId} onViewHistory={handleViewHistory} />;
      case 'legs':
        return <Legs userId={userId} onViewHistory={handleViewHistory} />;
      case 'upper':
        return <Upper userId={userId} onViewHistory={handleViewHistory} />;
      case 'lower':
        return <Lower userId={userId} onViewHistory={handleViewHistory} />;
      case 'full':
        return <FullBody userId={userId} onViewHistory={handleViewHistory} />;
      case 'rest':
      default:
        return <Rest />;
    }
  }
  const dayTypeUsed = override ?? dayType;

  return (
    <ToastProvider>
      <div className='app'>
        <div className='app-header'>
          <h1 className='app-title'>Workout App</h1>
          <div className='app-header-right'>
            <label className='weight-unit-toggle'>
              <span className='weight-unit-label'>Weight:</span>
              <select
                value={profile.weightUnit}
                onChange={(e) => setProfile({ weightUnit: e.target.value })}
                className='weight-unit-select'
                aria-label='Weight unit'
              >
                <option value='lb'>lb</option>
                <option value='kg'>kg (2.5)</option>
              </select>
            </label>
            <div className='view-nav'>
              <button
                className={`nav-btn ${view === 'today' && !exerciseHistory ? 'active' : ''}`}
                onClick={() => {
                  setExerciseHistory(null);
                  setView('today');
                }}
              >
                Today
              </button>
              <button
                className={`nav-btn ${view === 'history' && !exerciseHistory ? 'active' : ''}`}
                onClick={() => {
                  setExerciseHistory(null);
                  setView('history');
                }}
              >
                History
              </button>
              <button
                className={`nav-btn ${view === 'progress' && !exerciseHistory ? 'active' : ''}`}
                onClick={() => {
                  setExerciseHistory(null);
                  setView('progress');
                }}
              >
                Progress
              </button>
            </div>
          </div>
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
        {exerciseHistory ? (
          <ExerciseHistory
            exerciseId={exerciseHistory.exerciseId}
            exerciseName={exerciseHistory.name}
            userId={userId}
            onBack={handleBackFromExerciseHistory}
          />
        ) : view === 'today' ? (
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
            <History
              onViewExerciseHistory={(exerciseId, name) =>
                setExerciseHistory({ exerciseId, name })
              }
            />
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

export default function App() {
  return (
    <ProfileProvider>
      <AppContent />
    </ProfileProvider>
  );
}
