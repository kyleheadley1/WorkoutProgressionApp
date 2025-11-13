
// src/app.jsx
import React, { useEffect, useState } from "react";
import Pull from "./components/Pull";
import Push from "./components/Push";
import Legs from "./components/Legs";
import "./components/workout.css";
import { seedExample } from "./lib/storage";
import { recommendDayType } from "./lib/scheduler";

function Rest() {
  return <div className="rest-day">Rest Day 😴</div>;
}

export default function App() {
  const [dayType, setDayType] = useState(null);
  const userId = "demoUser";

  useEffect(() => {
    seedExample(userId);
    const rec = recommendDayType(userId, new Date());
    setDayType(rec);
  }, []);

  function renderByType(t) {
    switch (t) {
      case "push": return <Push userId={userId} />;
      case "pull": return <Pull userId={userId} />;
      case "legs": return <Legs userId={userId} />;
      case "upper": return <div><h3>Upper Day</h3><p>Program upper-body compounds + accessories.</p></div>;
      case "lower": return <div><h3>Lower Day</h3><p>Program squats/hinge + accessories.</p></div>;
      case "full":  return <div><h3>Full Body</h3><p>Blend push, pull, and legs; prioritize weak links.</p></div>;
      case "rest":
      default: return <Rest />;
    }
  }

  return (
    <div className="app">
      <h1>Workout App</h1>
      <div className="workout-container">
        <div className="current-workout-container">
          <h2>Today's Workout</h2>
          {dayType === null ? <div>Loading...</div> : renderByType(dayType)}
        </div>
        <div className="relevant-stats-container">
          <h2>Schedule Logic</h2>
          <p>Sun = Rest (week resets). Mon/Tue/Wed = Push/Pull/Legs. Thu = Rest. Fri = Upper. Sat = Lower, unless Upper was missed or coverage &lt; 2 → Full.</p>
        </div>
      </div>
    </div>
  );
}
