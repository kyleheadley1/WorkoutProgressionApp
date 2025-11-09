import React from 'react';
import './Controls.css';

export default function Controls({ onDeal, onStay, onHit }) {
  return (
    <div className='controls'>
      <button onClick={onDeal}>Deal</button>
      <button onClick={onHit}>Hit</button>
      <button onClick={onStay}>Stay</button>
    </div>
  );
}
