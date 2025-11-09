import React, { useState, useEffect } from 'react';
import Pull from './components/Pull.jsx';
import Push from './components/Push.jsx';
import Legs from './components/Legs.jsx';
import './components/workout.css'; // Create this file for styles

export default function App() {
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [currentDay, setCurrentDay] = useState(null);

  useEffect(() => {
    const getWorkoutForDay = () => {
      const day = new Date().getDay();
      console.log('Current day:', day);
      setCurrentDay(day);

      switch (day) {
        case 1:
          return <Push />; // Monday
        case 2:
          return <Pull />; // Tuesday
        case 3:
          return <Legs />; // Wednesday
        case 4:
          return <Push />; // Thursday
        case 5:
          return <Pull />; // Friday
        case 6:
          return <Legs />; // Saturday
        default:
          return <div className='rest-day'>Rest Day 😴</div>;
      }
    };

    console.log('Running useEffect');
    setCurrentWorkout(getWorkoutForDay());
  }, []); // End useEffect

  return (
    <div className='app'>
      <h1>Workout App</h1>
      <div className='workout-container'>
        <div className='current-workout-container'>
          <h2>Today's Workout (Day: {currentDay})</h2>
          {currentWorkout || <div>Loading workout...</div>}
        </div>
        <div className='relevant-stats-container'>
          <h2>Stats</h2>
        </div>
      </div>
    </div>
  );
} // End App component
