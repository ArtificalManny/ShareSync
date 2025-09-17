import React, { useMemo } from "react";
import Badge from "../ui/Badge";

/**
 * StatusPill
 * Gradient/solid badge for project status.
 *
 * Props:
 *  - status: string
 *  - size: "sm" | "md" (default "sm")
 *  - variant: "solid" | "gradient" (default "solid")
 *  - className?: string
 */
export default function StatusPill({ status, size = "sm", variant = "solid", className = "" }) {
  const label = String(status || "").trim() || "In Progress";

  const { tone, text, gradClass } = useMemo(() => {
    const s = label.toLowerCase();

    if (s.includes("complete") || s.includes("done")) {
      return { tone: "emerald", text: "Completed", gradClass: "bg-grad-emerald" };
    }
    if (s.includes("blocked") || s.includes("risk")) {
      return { tone: "amber", text: "At Risk", gradClass: "bg-grad-ig" };
    }
    if (s.includes("paused")) {
      return { tone: "slate", text: "Paused", gradClass: "" };
    }
    if (s.includes("not") && s.includes("start")) {
      return { tone: "sky", text: "Not Started", gradClass: "bg-grad-cnbc" };
    }
    // default: in progress / active
    return { tone: "indigo", text: "In Progress", gradClass: "bg-grad-pandora" };
  }, [label]);

  const gradientClasses =
    variant === "gradient" && gradClass
      ? `${gradClass} text-white border-transparent`
      : "";

  return (
    <Badge
      tone={tone}
      size={size}
      className={[gradientClasses, className].filter(Boolean).join(" ")}
      aria-label={`Status: ${text}`}
    >
      {/* tiny dot */}
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: "currentColor", opacity: variant === "gradient" ? 0.9 : 0.8 }}
      />
      <span className="ml-1">{label}</span>
    </Badge>
  );
}
