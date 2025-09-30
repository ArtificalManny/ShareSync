import React from "react";

/**
 * UnreadBadge
 * Small pill for counts (99+ capped).
 *
 * Props:
 * - count: number
 * - className?: string
 * - title?: string
 */
export default function UnreadBadge({ count = 0, className = "", title }) {
  if (!count || count <= 0) return null;
  const text = count > 99 ? "99+" : String(count);
  const tooltip = title || `${count} unread`;

  return (
    <span
      className={`inline-flex min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] leading-[18px] text-center ${className}`}
      aria-label={tooltip}
      title={tooltip}
    >
      {text}
    </span>
  );
}
