// src/components/projects/StatusPill.jsx
// OPTICAL AUDIT: Wrapped content in a flex container to perfectly align the 
// colored status dot with the uppercase text baseline.
import React, { useMemo } from "react";
import Chip from "../ui/Chip.jsx"; 

export default function StatusPill({
  status,
  size = "sm",
  variant = "solid",
  className = "",
}) {
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
    if ((s.includes("not") && s.includes("start")) || s.includes("ns")) {
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
    <Chip
      tone={tone}
      size={size}
      className={[gradientClasses, className].filter(Boolean).join(" ")}
      aria-label={`Status: ${text}`}
      title={text}
    >
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="shrink-0 inline-block h-1.5 w-1.5 rounded-full relative -top-[0.5px]"
          style={{ background: "currentColor", opacity: variant === "gradient" ? 0.9 : 0.8 }}
        />
        <span className="leading-tight">{label}</span>
      </span>
    </Chip>
  );
}
