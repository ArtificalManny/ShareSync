import React from "react";

/**
 * Simple inline reaction picker
 * Props: { onPick: (emoji) => void }
 */
const EMOJIS = ["👍","❤️","🎉","🔥","👏","😂","🤝","😮","😢","✅"];

export default function ReactionPicker({ onPick }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-1 shadow-sm inline-flex flex-wrap gap-1">
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onPick?.(e)}
          className="h-7 w-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-base"
          aria-label={`React ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
