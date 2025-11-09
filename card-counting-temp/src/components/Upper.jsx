import React from 'react';

const Upper = () => {
  const upperExercises = [
    { name: 'Bench Press', sets: 4, reps: '8-12' },
    { name: 'Overhead Press', sets: 4, reps: '8-12' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12' },
    { name: 'Lateral Raises', sets: 3, reps: '12-15' },
    { name: 'Tricep Pushdowns', sets: 3, reps: '12-15' },
    { name: 'Dips', sets: 3, reps: '8-12' },
  ];

  return (
    <div className='upper-workout'>
      <h3>Upper Workout</h3>
      <div className='exercise-list'>
        {upperExercises.map((exercise, index) => (
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

export default Upper;
