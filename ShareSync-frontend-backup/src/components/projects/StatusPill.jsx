import React, { useMemo } from "react";

/**
 * StatusPill
 * - Colorful, compact pill for project status.
 * - Props:
 *    status: string ("Not Started" | "In Progress" | "Completed" | "Blocked" | "Risk" | "Paused" | ...)
 *    size: "sm" | "md" (default "sm")
 *    className?: string
 */
export default function StatusPill({ status, size = "sm", className = "" }) {
  const label = String(status || "").trim() || "In Progress";

  const { pillCls, dotCls, text } = useMemo(() => {
    const s = label.toLowerCase();

    if (s.includes("complete") || s.includes("done")) {
      return {
        pillCls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        dotCls: "bg-emerald-500",
        text: "Completed",
      };
    }
    if (s.includes("blocked") || s.includes("risk")) {
      return {
        pillCls: "bg-amber-50 text-amber-700 border border-amber-200",
        dotCls: "bg-amber-500",
        text: "At Risk",
      };
    }
    if (s.includes("paused")) {
      return {
        pillCls: "bg-slate-100 text-slate-700 border border-slate-200",
        dotCls: "bg-slate-400",
        text: "Paused",
      };
    }
    if (s.includes("not") && s.includes("start")) {
      return {
        pillCls: "bg-sky-50 text-sky-700 border border-sky-200",
        dotCls: "bg-sky-500",
        text: "Not Started",
      };
    }
    // default: in progress / active
    return {
      pillCls: "bg-blue-50 text-blue-700 border border-blue-200",
      dotCls: "bg-blue-500",
      text: "In Progress",
    };
  }, [label]);

  const sizeCls =
    size === "md"
      ? "px-2.5 py-1 text-xs"
      : "px-2 py-0.5 text-xs";

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full font-medium",
        pillCls,
        sizeCls,
        className,
      ].join(" ")}
      title={text}
      aria-label={`Status: ${text}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotCls}`} aria-hidden="true" />
      {label}
    </span>
  );
}
