import React, { useMemo } from "react";
import Badge from "../ui/Badge";

/**
 * StatusPill
 * Gradient/solid badge for project status.
 *
 * Props:
 *  - status: string
 *  - size: "sm" | "md" (default "sm")
 *  - className?: string
 */
export default function StatusPill({ status, size = "sm", className = "" }) {
  const label = String(status || "").trim() || "In Progress";

  const { tone, text } = useMemo(() => {
    const s = label.toLowerCase();

    if (s.includes("complete") || s.includes("done")) {
      return { tone: "emerald", text: "Completed" };
    }
    if (s.includes("blocked") || s.includes("risk")) {
      return { tone: "amber", text: "At Risk" };
    }
    if (s.includes("paused")) {
      return { tone: "slate", text: "Paused" };
    }
    if (s.includes("not") && s.includes("start")) {
      return { tone: "sky", text: "Not Started" };
    }
    // default: in progress / active
    return { tone: "indigo", text: "In Progress" };
  }, [label]);

  return (
    <Badge tone={tone} size={size} className={className} aria-label={`Status: ${text}`}>
      {/* tiny dot */}
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: "currentColor", opacity: 0.8 }}
      />
      <span className="ml-1">{label}</span>
    </Badge>
  );
}
