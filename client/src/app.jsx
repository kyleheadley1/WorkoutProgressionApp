import React from 'react';
import Controls from './components/Controls';
import Hand from './components/hand';
import CounterDisplay from './components/CounterDisplay';
import './App.css';

export default function App() {
  return (
    <div className='app'>
      <h1>Can you Count</h1>
      <div className='game-area'>
        <div className='hand-container'>
          <h2>Dealer</h2>
          <Hand owner='dealer' />
        </div>
        <div className='hand-container'>
          <h2>Player</h2>
          <Hand owner='player' />
        </div>
      </div>
      <CounterDisplay />
      <Controls />
    </div>
  );
}
