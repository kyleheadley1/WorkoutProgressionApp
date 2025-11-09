import React from 'react';
import Card from './card';
import './DeckDisplay.css';

export default function DeckDisplay({ deck }) {
  return (
    <div className='deck-display'>
      {deck.map((card, index) => (
        <Card key={index} label={card.label} suit={card.suit} />
      ))}
    </div>
  );
}
