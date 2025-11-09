import React from 'react';

const Push = () => {
  const pushExercises = [
    {
      name: 'Dumbbell Bench Press',
      warmupSets: [
        { percentage: 40, reps: 8 },
        { percentage: 60, reps: 5 },
        { percentage: 75, reps: 3 },
      ],
      sets: 1,
      reps: '3-5',
    },
    { name: 'Larsen Press', sets: 2, reps: '10' },
    {
      name: 'Standing Arnold Press',
      warmupSets: [
        { percentage: 50, reps: 10 },
        { percentage: 70, reps: 5 },
      ],
      sets: 3,
      reps: '8-10',
    },
    {
      name: 'Deficit Push-ups',
      warmupSets: [{ percentage: 60, reps: 9 }],
      sets: 3,
      reps: '12-15',
    },
    {
      name: 'Lateral Raises',
      warmupSets: [{ percentage: 60, reps: 9 }],
      sets: 3,
      reps: '12-15',
    },
    { name: 'Skull-crushers', sets: 3, reps: '15' },
    { name: 'Single-arm Tricep kickback', sets: 2, reps: '12' },
  ];

  return (
    <div className='push-workout'>
      <h3>Push Day Workout</h3>
      <div className='exercise-list'>
        {pushExercises.map((exercise, index) => (
          <div key={index} className='exercise-item'>
            <h4>{exercise.name}</h4>
            {exercise.warmupSets && (
              <div className='warmup-sets'>
                <p>Warm-up sets:</p>
                {exercise.warmupSets.map((warmup, idx) => (
                  <p key={idx}>
                    {warmup.percentage}% × {warmup.reps} reps
                  </p>
                ))}
              </div>
            )}
            <p>
              Working sets: {exercise.sets} sets × {exercise.reps} reps
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Push;
