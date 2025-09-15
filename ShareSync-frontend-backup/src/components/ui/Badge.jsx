import React from "react";

/**
 * Badge
 * Tiny reusable gradient/solid badge used across feed/KPI/status chips.
 *
 * Props:
 *  - tone: "indigo" | "emerald" | "amber" | "sky" | "slate" | "grad-blue" | "grad-purple" | "grad-emerald"
 *  - size: "sm" | "md" (default "sm")
 *  - className
 */
export default function Badge({ tone = "indigo", size = "sm", className = "", children }) {
  // solid badge tokens (feed.css)
  const solid = new Set(["indigo", "emerald", "amber", "sky", "slate"]);
  // gradient badge tokens (gradients.css)
  const grads = {
    "grad-blue": "badge--grad badge--grad-blue",
    "grad-purple": "badge--grad badge--grad-purple",
    "grad-emerald": "badge--grad badge--grad-emerald",
  };

  const base = "badge";
  const toneCls = solid.has(tone) ? `badge--${tone}` : grads[tone] || "badge--slate";
  const sizeCls = size === "md" ? "text-sm py-1 px-2.5" : "text-xs py-0.5 px-2";

  return (
    <span className={[base, toneCls, sizeCls, className].join(" ")}>
      {children}
    </span>
  );
}
