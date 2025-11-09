import React from 'react';
import Card from './card';
import './Hand.css';
import cardBackImage from '../assets/card-back-black.png';

export default function Hand({ owner, cards, showHoleCard }) {
  return (
    <div className='hand'>
      <h3>{owner === 'dealer' ? "Dealer's Hand:" : "Player's Hand:"}</h3>
      <div className='cards-container'>
        {cards.length > 0 ? (
          cards.map((card, index) =>
            owner === 'dealer' && index === 1 && !showHoleCard ? (
              <img
                className='card-back'
                key={index}
                src={cardBackImage}
                alt='Card Back'
              />
            ) : (
              <Card key={index} label={card.label} suit={card.suit} />
            )
          )
        ) : (
          <p>(Waiting for cards)</p> // Placeholder content
        )}
      </div>
    </div>
  );
}
