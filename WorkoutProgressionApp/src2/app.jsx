
// src/app.jsx
import React, { useEffect, useMemo, useState } from "react";
import Pull from "./components/Pull";
import Push from "./components/Push";
import Legs from "./components/Legs";
import "./components/workout.css";
import { seedExample } from "./lib/storage";

export default function App() {
  const [currentDay, setCurrentDay] = useState(null);
  const userId = "demoUser";

  useEffect(() => {
    // Seed example data once for demo
    seedExample(userId);
    const day = new Date().getDay();
    setCurrentDay(day);
  }, []);

  function renderByDay(day) {
    switch (day) {
      case 1: return <Push userId={userId} />; // Monday
      case 2: return <Pull userId={userId} />; // Tuesday
      case 3: return <Legs userId={userId} />; // Wednesday
      case 4: return <Push userId={userId} />; // Thursday
      case 5: return <Pull userId={userId} />; // Friday
      case 6: return <Legs userId={userId} />; // Saturday
      default: return <div className="rest-day">Rest Day 😴</div>;
    }
  }

  return (
    <div className="app">
      <h1>Workout App</h1>
      <div className="workout-container">
        <div className="current-workout-container">
          <h2>Today's Workout (Day: {currentDay})</h2>
          {currentDay === null ? <div>Loading...</div> : renderByDay(currentDay)}
        </div>
        <div className="relevant-stats-container">
          <h2>Stats</h2>
          <p>Progression is computed from your recent entries. Swap localStorage for a real DB anytime.</p>
        </div>
      </div>
    </div>
  );
}
