// Compact "next best action" capsule with Start button.
// Uses today-capsule.css, independent of FocusContext for now.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { track } from '../../utils/telemetry';

export default function TodayCapsule() {
  const nav = useNavigate();

  function start() {
    try { track('today_capsule_action_started', { source: 'home_capsule' }); } catch {}
    nav('/projects'); // send user somewhere productive
  }

  return (
    <section className="today-capsule">
      <div className="today-left">
        <div className="tc-eyebrow">Next best action</div>
        <h3 className="tc-title">Pick your next outcome</h3>
        <p className="tc-sub">Small wins compound. Grab the smallest outcome that moves a project.</p>
      </div>
      <div className="today-right">
        <button className="tc-start" onClick={start} aria-label="Start focus">
          ▶ Start
        </button>
      </div>
    </section>
  );
}