import React from "react";

/**
 * TypingIndicator
 * Props:
 * - names: string[]  (display names of people typing)
 */
export default function TypingIndicator({ names = [] }) {
  if (!names.length) return null;
  const label = names.length === 1 ? `${names[0]} is typing…` : "Several people are typing…";
  return (
    <div className="px-3 py-1 text-[11px] text-muted" aria-live="polite">
      <span className="inline-flex items-center gap-2">
        <span className="relative inline-flex">
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-bounce ml-1" style={{ animationDelay: "120ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-bounce ml-1" style={{ animationDelay: "240ms" }} />
        </span>
        {label}
      </span>
    </div>
  );
}
