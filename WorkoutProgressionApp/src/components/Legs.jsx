import React, { useState, useEffect } from 'react';

const Legs = () => {
  const [weights, setWeights] = useState({
    bulgarianSplitSquats: {
      current: null,
      previous: null,
      lastUpdated: null,
    },
    bulgarianSplitSquatsPause: {
      current: null,
      previous: null,
      lastUpdated: null,
    },
    romanianDeadlifts: {
      current: null,
      previous: null,
      lastUpdated: null,
    },
    legPress: {
      current: null,
      previous: null,
      lastUpdated: null,
    },
    calfRaises: {
      current: null,
      previous: null,
      lastUpdated: null,
    },
    legExtensions: {
      current: null,
      previous: null,
      lastUpdated: null,
    },
    legCurls: {
      current: null,
      previous: null,
      lastUpdated: null,
    },
  });

  const calculatePauseWeight = (baseWeight) => baseWeight * 0.75;

  useEffect(() => {
    const fetchPreviousWeights = async () => {
      try {
        const response = await fetch('/api/weights/last');
        const data = await response.json();

        if (data) {
          setWeights((prevWeights) => ({
            ...prevWeights,
            ...Object.keys(data).reduce(
              (acc, exerciseId) => ({
                ...acc,
                [exerciseId]: {
                  ...prevWeights[exerciseId],
                  previous: data[exerciseId].weight,
                },
              }),
              {}
            ),
          }));
        }
      } catch (error) {
        console.error('Error fetching weights:', error);
      }
    };

    fetchPreviousWeights();
  }, []);

  const getDisplayWeight = (exerciseId) => {
    const exerciseWeights = weights[exerciseId];
    if (exerciseWeights?.current) return exerciseWeights.current;
    if (exerciseWeights?.previous) return exerciseWeights.previous;
    return '';
  };

  const legExercises = [
    {
      id: 'bulgarianSplitSquats',
      name: 'Bulgarian Split Squats',
      sets: 4,
      reps: '4',
      rest: '3 mins',
      onWeightUpdate: (actualWeight) => {
        setWeights((prev) => ({
          ...prev,
          bulgarianSplitSquats: {
            ...prev.bulgarianSplitSquats,
            current: actualWeight,
            lastUpdated: new Date(),
          },
        }));
      },
    },
    {
      id: 'bulgarianSplitSquatsPause',
      name: 'Bulgarian Split Squats (Pause)',
      sets: 2,
      reps: '5',
      rest: '3 mins',
      getWeight: () => {
        const baseWeight = getDisplayWeight('bulgarianSplitSquats');
        return baseWeight ? calculatePauseWeight(baseWeight) : '';
      },
      onWeightUpdate: (actualWeight) => {
        setWeights((prev) => ({
          ...prev,
          bulgarianSplitSquatsPause: {
            ...prev.bulgarianSplitSquatsPause,
            current: actualWeight,
            lastUpdated: new Date(),
          },
        }));
      },
    },
    {
      id: 'romanianDeadlifts',
      name: 'Romanian Deadlifts',
      sets: 3,
      reps: '10',
      rest: '2 mins',
      onWeightUpdate: (actualWeight) => {
        setWeights((prev) => ({
          ...prev,
          romanianDeadlifts: {
            ...prev.romanianDeadlifts,
            current: actualWeight,
            lastUpdated: new Date(),
          },
        }));
      },
    },
    {
      id: 'legPress',
      name: 'Leg Press',
      sets: 3,
      reps: '10-12',
      onWeightUpdate: (actualWeight) => {
        setWeights((prev) => ({
          ...prev,
          legPress: {
            ...prev.legPress,
            current: actualWeight,
            lastUpdated: new Date(),
          },
        }));
      },
    },
    {
      id: 'calfRaises',
      name: 'Calf Raises',
      sets: 3,
      reps: '15-20',
      onWeightUpdate: (actualWeight) => {
        setWeights((prev) => ({
          ...prev,
          calfRaises: {
            ...prev.calfRaises,
            current: actualWeight,
            lastUpdated: new Date(),
          },
        }));
      },
    },
    {
      id: 'legExtensions',
      name: 'Leg Extensions',
      sets: 3,
      reps: '12-15',
      onWeightUpdate: (actualWeight) => {
        setWeights((prev) => ({
          ...prev,
          legExtensions: {
            ...prev.legExtensions,
            current: actualWeight,
            lastUpdated: new Date(),
          },
        }));
      },
    },
    {
      id: 'legCurls',
      name: 'Leg Curls',
      sets: 3,
      reps: '12-15',
      onWeightUpdate: (actualWeight) => {
        setWeights((prev) => ({
          ...prev,
          legCurls: {
            ...prev.legCurls,
            current: actualWeight,
            lastUpdated: new Date(),
          },
        }));
      },
    },
  ];

  return (
    <div className='legs-workout'>
      <h3>Leg Day</h3>
      <div className='exercise-list'>
        {legExercises.map((exercise, index) => (
          <div key={index} className='exercise-item'>
            <h4>{exercise.name}</h4>
            <p>
              {exercise.sets} sets x {exercise.reps} reps
              {exercise.getWeight
                ? ` @ ${exercise.getWeight()} lbs`
                : getDisplayWeight(exercise.id)
                ? ` @ ${getDisplayWeight(exercise.id)} lbs`
                : ''}
              {exercise.rest && ` (Rest: ${exercise.rest})`}
            </p>
            <input
              type='number'
              step='2.5'
              min='0'
              value={
                exercise.getWeight
                  ? exercise.getWeight()
                  : getDisplayWeight(exercise.id)
              }
              onChange={(e) => exercise.onWeightUpdate(Number(e.target.value))}
              placeholder='Enter weight'
              className='weight-input'
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legs;
