// Fake ETA model: median of "similar" tasks from local heuristics.
// Replace with API later.

import { useMemo } from 'react';

export default function useETA(projectId) {
  const seed = (projectId || 'p').split('').reduce((a,c)=>a+c.charCodeAt(0), 0);
  const rand = (n) => (Math.sin(seed + n) + 1) / 2;

  const etaHours = useMemo(() => Math.max(1, Math.round(2 + rand(1)*10)), [projectId]);
  const confidence = useMemo(() => Math.round(60 + rand(2)*35), [projectId]);
  const reasons = useMemo(() => ([
    `Similar tasks complete in ~${etaHours}h median`,
    `${Math.round(20+rand(3)*50)}% tasks were small (<2h)`,
    `Complexity factor: ${['low','medium','medium','high'][Math.floor(rand(4)*4)]}`,
  ]), [projectId, etaHours]);

  return { etaHours, confidence, reasons };
}
