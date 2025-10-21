// Small ETA card that shows an estimate + brief reasons.
// Uses eta-explainer.css and a stub hook.

import React, { useEffect } from 'react';
import useETA from '../../hooks/useETA';
import { track } from '../../utils/telemetry';

export default function ETAExplainer({ projectId }) {
  const { etaHours, confidence, reasons } = useETA(projectId);

  useEffect(() => {
    try { track('eta_explainer_opened', { projectId, etaHours, confidence }); } catch {}
  }, [projectId, etaHours, confidence]);

  return (
    <div className="eta-card" role="complementary">
      <div className="eta-main">
        <div className="eta-number">{etaHours}</div>
        <div className="eta-meta">
          <div className="eta-label">Estimated hours</div>
          <div className="eta-conf">Confidence: {confidence}%</div>
        </div>
      </div>
      <ul className="eta-why">
        {reasons.map((r, i) => (
          <li key={i}>
            <span className="eta-bullet" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
