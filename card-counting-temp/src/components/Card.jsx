import React from 'react';
import './Card.css';

export default function Card({ label, suit }) {
  return (
    <div className='card'>
      <span className='card-label'>{label}</span>
      <span className='card-suit'>{suit}</span>
    </div>
  );
}
