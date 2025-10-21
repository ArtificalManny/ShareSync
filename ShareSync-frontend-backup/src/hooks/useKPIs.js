// Stand-in KPIs (replace with real API later).
// Keeps values stable across reloads via localStorage so it "feels" real.

import { useEffect, useMemo, useState } from 'react';

function pick(name, min, max, fallback) {
  try {
    const key = `kpi.${name}`;
    const prev = localStorage.getItem(key);
    if (prev) return JSON.parse(prev);
    const v = Number((Math.random() * (max - min) + min).toFixed(2));
    localStorage.setItem(key, JSON.stringify(v));
    return v;
  } catch {
    return fallback;
  }
}

export default function useKPIs() {
  const [tick, setTick] = useState(0);

  // initialize once
  const base = useMemo(() => ({
    velocity: pick('velocity', 0.4, 1.8, 1.0),
    onTime: pick('onTime', 48, 96, 73),
    streak: Math.round(pick('streak', 0, 9, 0)),
  }), []);

  // tiny micro-variation to make ticker feel alive
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 8000);
    return () => clearInterval(id);
  }, []);

  const velocity = Math.max(0, base.velocity + (tick % 2 ? 0.02 : -0.01));
  const onTime   = Math.min(100, Math.max(0, base.onTime + (tick % 3 === 0 ? 1 : 0)));
  const streak   = base.streak;

  return { velocity, onTime, streak };
}