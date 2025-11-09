import React from 'react';
import './Pull.css';

const Pull = () => {
  const pullExercises = [
    { name: 'Pull-ups', sets: 4, reps: '10' },
    { name: 'Face Pulls', sets: 3, reps: '15' },
    { name: 'Lat Pulldowns', sets: 3, reps: '10-12' },
    { name: 'Hammer Curls', sets: 3, reps: '10-12' },
    { name: 'Preacher Curls', sets: 3, reps: '10-12' },
  ];

  return (
    <div className='pull-workout'>
      <h3>Pull Day Workout</h3>
      <div className='exercise-list'>
        {pullExercises.map((exercise, index) => (
          <div key={index} className='exercise-item'>
            <h4>{exercise.name}</h4>
            <p>
              {exercise.sets} sets x {exercise.reps} reps
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pull;
