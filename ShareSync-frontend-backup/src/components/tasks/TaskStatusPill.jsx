import React from "react";
import { Check, Clock, Circle } from "lucide-react";

/**
 * TaskStatusPill
 * Consistent, tiny status badge for tasks.
 *
 * Props:
 * - status: "Not Started" | "In Progress" | "Completed"
 * - size?: "sm" | "md" | "lg" (default "sm")
 * - withIcon?: boolean (default true)
 * - className?: string
 */
export default function TaskStatusPill({
  status = "Not Started",
  size = "sm",
  withIcon = true,
  className = "",
}) {
  const s = String(status || "").trim();

  const TONE = {
    "Not Started": {
      cls: "bg-slate-100 text-slate-700 border-slate-200",
      Icon: Circle,
      label: "Not Started",
    },
    "In Progress": {
      cls: "bg-amber-100 text-amber-800 border-amber-200",
      Icon: Clock,
      label: "In Progress",
    },
    Completed: {
      cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
      Icon: Check,
      label: "Completed",
    },
  };

  const SIZES = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  const tone = TONE[s] || TONE["Not Started"];
  const Icon = tone.Icon;

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border font-medium",
        tone.cls,
        SIZES[size] || SIZES.sm,
        className,
      ].join(" ")}
      title={tone.label}
    >
      {withIcon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
      <span>{tone.label}</span>
    </span>
  );
}
