export const createDeck = () => {
  const suits = ['♠️', '♥️', '♦️', '♣️'];
  const values = [
    { label: '2', count: 1, score: 2 },
    { label: '3', count: 1, score: 3 },
    { label: '4', count: 1, score: 4 },
    { label: '5', count: 1, score: 5 },
    { label: '6', count: 1, score: 6 },
    { label: '7', count: 0, score: 7 },
    { label: '8', count: 0, score: 8 },
    { label: '9', count: 0, score: 9 },
    { label: '10', count: -1, score: 10 },
    { label: 'J', count: -1, score: 10 },
    { label: 'Q', count: -1, score: 10 },
    { label: 'K', count: -1, score: 10 },
    { label: 'A', count: -1, score: 11 },
  ];

  let deck = [];
  suits.forEach((suit) => {
    values.forEach(({ label, count, score }) => {
      //added score
      deck.push({ label, suit, count, score }); //added score
    });
  });

  return shuffle(deck);
};

const shuffle = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};
