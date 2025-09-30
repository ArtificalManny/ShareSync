import React from "react";
import ToastHost, { toast as rawToast } from "./toast";

/**
 * Map our semantic variants to strong, high-contrast styles.
 * These classNames lean on gradients we added and force readable text.
 */
const VARIANT_CLASS = {
  success: "bg-grad-success text-white shadow-md",
  error:   "bg-grad-error text-white shadow-md",
  warning: "bg-grad-orange-cta text-white shadow-md",
  xp:      "bg-grad-xp text-white shadow-md",
  info:    "bg-grad-deepblue text-white shadow-md",
};

/**
 * Safer toast() that auto-applies accessible colors for our common variants.
 * You can still pass your own className to override/extend.
 */
export function toast(opts = {}) {
  const variant = opts.variant || "info";
  const cls =
    VARIANT_CLASS[variant] ||
    "bg-surface text-[rgb(var(--text))] border border-border";
  return rawToast({
    ...opts,
    // ensure className merges: caller last so they can override if needed
    className: [cls, opts.className].filter(Boolean).join(" "),
  });
}

/**
 * Convenience helper for XP celebration to keep a consistent copy & style.
 * Usage: toastXp({ amount: 10, reason: 'on-time completion' })
 */
export function toastXp({ amount = 10, reason = "on-time completion" } = {}) {
  const title = `+${amount} XP`;
  const description = `Awarded for ${reason}.`;
  toast({
    title,
    description,
    variant: "xp",
  });
}

/**
 * Legacy default export stayed “Toaster”; apps can still import it.
 * Prefer: `import { ToastHost } from '../ui/toast'` for raw host,
 * but this keeps existing imports working.
 */
export default function Toaster() {
  return <ToastHost />;
}

export { ToastHost };
