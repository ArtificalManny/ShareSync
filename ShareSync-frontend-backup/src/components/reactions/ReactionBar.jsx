// src/components/reactions/ReactionBar.jsx
import React, { useEffect, useState } from 'react';
import { getReactions, toggleReaction, hasReacted } from '../../utils/reactions';
import { track } from '../../utils/telemetry';
import { addNotification } from '../../state/notifications';

const DEFAULTS = ['👍','✨','🔥'];

export default function ReactionBar({
  targetId,                 // string id for this entity
  ownerId = null,           // user id of the owner (for bell stub)
  meId = 'me',              // current user id
  emojis = DEFAULTS,
  size = 'sm',              // 'sm' | 'md'
  label = '',               // optional label for notification text
}) {
  const [counts, setCounts] = useState(getReactions(targetId));
  const [mine, setMine] = useState(() => Object.fromEntries(emojis.map(e => [e, hasReacted(targetId, e, meId)])));

  useEffect(() => { setCounts(getReactions(targetId)); }, [targetId]);

  const onToggle = async (e) => {
    const res = await toggleReaction(targetId, e, { meId, tryApi: true });
    setCounts(res.counts);
    setMine((m) => ({ ...m, [e]: res.reacted }));
    try { track(res.reacted ? 'reaction_added' : 'reaction_removed', { targetId, emoji: e }); } catch {}

    // Notifications stub: ping the owner (for MVP we’ll notify even on self)
    if (ownerId && label) {
      addNotification({ text: `👍 on your ${label}` });
    }
  };

  return (
    <div className={`mt-2 flex items-center gap-1 ${size === 'md' ? 'text-base' : 'text-sm'}`}>
      {emojis.map((e) => {
        const c = counts[e] || 0;
        const active = mine[e];
        return (
          <button
            key={e}
            type="button"
            onClick={() => onToggle(e)}
            className={`px-2 py-0.5 rounded-lg border border-border hover:bg-surface ${active ? 'ring-1 ring-indigo-400' : ''}`}
            title={`${e} ${c}`}
          >
            <span aria-hidden>{e}</span>{c ? <span className="ml-1 text-xs num">{c}</span> : null}
          </button>
        );
      })}
      <details>
        <summary className="list-none px-2 py-0.5 rounded-lg border border-border hover:bg-surface cursor-pointer">+</summary>
        {/* simple picker (static for MVP) */}
        <div className="mt-1 p-1 rounded-xl border border-border bg-surface shadow">
          {['💯','👏','❤️','🚀'].map((e) => (
            <button key={e} onClick={() => onToggle(e)} className="px-2 py-1 text-base hover:bg-surface rounded-lg">{e}</button>
          ))}
        </div>
      </details>
    </div>
  );
}
