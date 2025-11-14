import { ToastProvider } from './components/ToastProvider.jsx';
// top
import Progress from './components/progress/Progress.jsx';
import ExerciseHistory from './components/ExerciseHistory.jsx';

import { syncLocalToServer } from './lib/sync'; // we created this earlier

// src/app.jsx
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

export default function App() {
  const [override, setOverride] = useState(null); // 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full' | null
  const [dayType, setDayType] = useState(null);
  const [view, setView] = useState('today'); // 'today' | 'progress'
  const [exerciseHistory, setExerciseHistory] = useState(null); // { exerciseId, name } | null

  const userId = 'demoUser';

  useEffect(() => {
    seedExample(userId);
    const rec = recommendDayType(userId, new Date());
    setDayType(rec);
  }, []);

  const handleWorkoutSaved = () => {
    // Refresh the schedule logic after workout is saved
    const rec = recommendDayType(userId, new Date());
    setDayType(rec);
  };

  function renderByType(t) {
    switch (t) {
      case 'push':
        return (
          <Push
            userId={userId}
            onViewHistory={(id, name) =>
              setExerciseHistory({ exerciseId: id, name })
            }
            onWorkoutSaved={handleWorkoutSaved}
          />
        );
      case 'pull':
        return (
          <Pull
            userId={userId}
            onViewHistory={(id, name) =>
              setExerciseHistory({ exerciseId: id, name })
            }
            onWorkoutSaved={handleWorkoutSaved}
          />
        );
      case 'legs':
        return (
          <Legs
            userId={userId}
            onViewHistory={(id, name) =>
              setExerciseHistory({ exerciseId: id, name })
            }
            onWorkoutSaved={handleWorkoutSaved}
          />
        );
      case 'upper':
        return (
          <Upper
            userId={userId}
            onViewHistory={(id, name) =>
              setExerciseHistory({ exerciseId: id, name })
            }
            onWorkoutSaved={handleWorkoutSaved}
          />
        );
      case 'lower':
        return (
          <Lower
            userId={userId}
            onViewHistory={(id, name) =>
              setExerciseHistory({ exerciseId: id, name })
            }
            onWorkoutSaved={handleWorkoutSaved}
          />
        );
      case 'full':
        return (
          <FullBody
            userId={userId}
            onViewHistory={(id, name) =>
              setExerciseHistory({ exerciseId: id, name })
            }
            onWorkoutSaved={handleWorkoutSaved}
          />
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
        <header className='app-header'>
          <h1 className='app-title'>Workout Progression</h1>
          <nav className='view-nav'>
            <button
              className={`nav-btn ${view === 'today' ? 'active' : ''}`}
              onClick={() => {
                setView('today');
                setExerciseHistory(null);
              }}
            >
              Today
            </button>
            <button
              className={`nav-btn ${view === 'progress' ? 'active' : ''}`}
              onClick={() => {
                setView('progress');
                setExerciseHistory(null);
              }}
            >
              Progress
            </button>
          </nav>
        </header>
        {/* Dev panel */}
        <div className='dev-panel'>
          <strong>Dev panel</strong>
          <select
            value={override ?? ''}
            onChange={(e) => setOverride(e.target.value || null)}
            className='dev-select'
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
            className='dev-btn'
            onClick={() => {
              seedExample(userId);
              alert('Seeded a few local sessions.');
            }}
          >
            Seed local
          </button>
          <button
            className='dev-btn'
            onClick={async () => {
              const n = await syncLocalToServer();
              alert(`Synced ${n} local sessions to server.`);
            }}
          >
            Sync to server
          </button>
        </div>
        {exerciseHistory ? (
          <ExerciseHistory
            exerciseId={exerciseHistory.exerciseId}
            exerciseName={exerciseHistory.name}
            userId={userId}
            onBack={() => {
              setExerciseHistory(null);
              setView('today');
            }}
          />
        ) : view === 'progress' ? (
          <div className='history-container'>
            <Progress />
          </div>
        ) : (
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
        )}
      </div>
    </ToastProvider>
  );
}
