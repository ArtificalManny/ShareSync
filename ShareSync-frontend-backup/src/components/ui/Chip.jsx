import React from "react";
import { cn } from "./cn";

const TONES = {
  default: "bg-slate-50 text-slate-700 border-border",
  good:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn:    "bg-amber-50 text-amber-700 border-amber-200",
  bad:     "bg-rose-50 text-rose-700 border-rose-200",
};

export default function Chip({ tone = "default", className = "", children, ...rest }) {
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2 text-xs tabular-nums",
        TONES[tone] || TONES.default,
        className
      )}
    >
      {children}
    </span>
  );
}
