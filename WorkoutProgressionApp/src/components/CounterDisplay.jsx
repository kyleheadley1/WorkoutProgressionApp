import React from 'react';
import './CounterDisplay.css';

export default function CounterDisplay({
  count,
  trueCount,
  playerScore,
  winPer,
  rounds,
}) {
  return (
    <div className='counter-display'>
      <h3>
        Running Count: <span>{count}</span>{' '}
      </h3>
      <h3>
        True Count:<span>{trueCount}</span>{' '}
      </h3>
      <h3>
        Player Score:<span>{playerScore}</span>{' '}
      </h3>
      <h3>
        Winning Percentage:<span>{winPer}%</span>{' '}
      </h3>
      <h3>
        Rounds:<span>{rounds}</span>{' '}
      </h3>
    </div>
  );
}
