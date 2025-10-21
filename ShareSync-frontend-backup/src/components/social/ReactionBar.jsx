import React, { useState } from 'react';
import { track } from '../../utils/telemetry';

const EMOJIS = ['👏','👍','🔥'];

export default function ReactionBar({ subjectId }) {
  const [counts, setCounts] = useState({ '👏': 0, '👍': 0, '🔥': 0 });

  function react(e) {
    const k = e.currentTarget.dataset.k;
    setCounts(c => ({ ...c, [k]: c[k] + 1 }));
    try { track('reaction_clicked', { subjectId, reaction: k }); } catch {}
  }

  return (
    <div className="reaction-bar">
      {EMOJIS.map(k => (
        <button key={k} className="reaction-pill" data-k={k} onClick={react}>
          <span aria-hidden>{k}</span>
          <span className="count">{counts[k]}</span>
        </button>
      ))}
    </div>
  );
}
