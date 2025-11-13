// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx';
import './components/workout.css';

// (optional) queue init — safe to keep
import { api } from './lib/api';
import { initQueueSync } from './lib/offlineQueue';
initQueueSync(api, { intervalMs: 0 });

// Temporary global logging so we see errors instead of a silent blank
window.addEventListener('error', (e) => {
  console.error('window error:', e.error || e.message || e);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('unhandledrejection:', e.reason || e);
});
console.log('[boot] main.jsx running');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
