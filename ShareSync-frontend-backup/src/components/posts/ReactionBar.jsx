import React, { useMemo, useState } from "react";
import { toggleReaction } from "../../api/posts";
import { trackPostReacted } from "../../utils/telemetry";

/**
 * ReactionBar
 * Props:
 *  - projectId
 *  - postId
 *  - reactions: { [emoji]: count }
 *  - myReactions?: string[] (emojis user has reacted with)
 *  - onChange?: (nextReactions, nextMy) => void
 */
const DEFAULT_EMOJIS = ["👍", "❤️", "🎉", "🚀"];

export default function ReactionBar({
  projectId,
  postId,
  reactions = {},
  myReactions = [],
  onChange,
  className = "",
  emojis = DEFAULT_EMOJIS,
}) {
  const [optim, setOptim] = useState(null);

  const state = useMemo(() => {
    if (optim) return optim;
    return { reactions, mine: new Set(myReactions) };
  }, [optim, reactions, myReactions]);

  const handleToggle = async (emoji) => {
    // optimistic update
    const mine = new Set(state.mine);
    const had = mine.has(emoji);
    const nextMine = new Set(mine);
    const nextCounts = { ...(state.reactions || {}) };

    if (had) {
      nextMine.delete(emoji);
      nextCounts[emoji] = Math.max(0, (nextCounts[emoji] || 1) - 1);
    } else {
      nextMine.add(emoji);
      nextCounts[emoji] = (nextCounts[emoji] || 0) + 1;
    }

    setOptim({ reactions: nextCounts, mine: nextMine });

    try {
      const res = await toggleReaction(projectId, postId, emoji);
      const serverCounts = res?.reactions || nextCounts;
      const serverMine = Array.isArray(res?.myReactions) ? new Set(res.myReactions) : nextMine;
      setOptim({ reactions: serverCounts, mine: serverMine });
      onChange?.(serverCounts, Array.from(serverMine));
      try { trackPostReacted?.({ projectId, postId, emoji, action: had ? "removed" : "added" }); } catch {}
    } catch {
      // rollback on failure
      setOptim(null);
    } finally {
      // clear optimistic after a tick so external props can resync
      setTimeout(() => setOptim(null), 300);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {emojis.map((e) => {
        const count = state.reactions?.[e] || 0;
        const mine = state.mine?.has(e);
        return (
          <button
            key={e}
            type="button"
            onClick={() => handleToggle(e)}
            className={[
              "px-2 py-1 rounded-lg border text-sm",
              mine ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-border hover:bg-surface"
            ].join(" ")}
            aria-pressed={mine ? "true" : "false"}
            aria-label={`React ${e}${count ? ` (${count})` : ""}`}
            title={`React ${e}`}
          >
            <span className="align-middle">{e}</span>
            {count ? <span className="ml-1 text-xs text-muted">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
