// src/components/ui/Toaster.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7.2: Toaster Adapter
// Maintained for backward compatibility, mapping legacy gradient classes
// to the new high-contrast "Gallery Walk" theme.
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import ToastHost, { toast as rawToast } from "./toast";

const VARIANT_CLASS = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-md",
  error:   "bg-red-50 border-red-200 text-red-700 shadow-md",
  warning: "bg-amber-50 border-amber-200 text-amber-700 shadow-md",
  xp:      "bg-violet-50 border-violet-200 text-violet-700 shadow-[0_4px_20px_rgba(139,92,246,0.15)]",
  info:    "bg-slate-50 border-slate-200 text-slate-800 shadow-md",
};

export function toast(opts = {}) {
  const variant = opts.variant || "info";
  const cls = VARIANT_CLASS[variant] || VARIANT_CLASS.info;
  
  return rawToast({
    ...opts,
    className: [cls, opts.className].filter(Boolean).join(" "),
  });
}

export function toastXp({ amount = 10, reason = "on-time completion" } = {}) {
  const title = `+${amount} XP`;
  const description = `Awarded for ${reason}.`;
  
  // We explicitly call rawToast here so it triggers the framer motion
  // animation defined in our updated toast.jsx
  rawToast({
    title,
    description,
    variant: "xp", // We'll map this back to 'insight' in toast.jsx or handle it manually
  });
}

export default function Toaster() {
  return <ToastHost />;
}

export { ToastHost };
