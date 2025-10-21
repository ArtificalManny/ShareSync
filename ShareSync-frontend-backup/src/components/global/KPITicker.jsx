// Minimal KPI ticker pill for the navbar.
// Shows Velocity, On-time %, Streak. Uses kpi-ticker.css.

import React, { useEffect } from 'react';
import useKPIs from '../../hooks/useKPIs';
import { track } from '../../utils/telemetry';

export default function KPITicker() {
  const { velocity, onTime, streak } = useKPIs();

  useEffect(() => {
    try { track('kpi_ticker_opened', { velocity, onTime, streak }); } catch {}
  }, []);

  return (
    <div className="kpi-ticker" role="region" aria-label="Your key stats">
      <div className="kpi-pill" title="Velocity">
        <span className="kpi-label">Velocity</span>
        <span className="kpi-value">{velocity.toFixed(1)}x</span>
      </div>
      <div className="kpi-pill" title="On-time completion">
        <span className="kpi-label">On-time</span>
        <span className="kpi-value">{Math.round(onTime)}%</span>
      </div>
      <div className="kpi-pill" title="Daily streak">
        <span className="kpi-label">Streak</span>
        <span className="kpi-value">{streak}d</span>
      </div>
    </div>
  );
}