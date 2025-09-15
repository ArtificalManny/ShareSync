import React from "react";
import { Shield, UserPlus, Settings, Globe2, Image as ImageIcon } from "lucide-react";

/**
 * SystemItem
 * Generic renderer for system/audit events.
 *
 * Props:
 *  - event: { type?, text?, meta?, createdAt? }
 *  - when?: string (pre-formatted)
 *  - isFresh?: boolean (highlight row when true)
 *  - className?: string (extra classes for root)
 */
export default function SystemItem({ event, when, isFresh = false, className = "" }) {
  const u = event || {};
  const t = String(u.type || u.kind || "system").toLowerCase();
  const whenText = when || (u.createdAt ? new Date(u.createdAt).toLocaleString() : "");

  const { icon, labelClass, badgeText } = pickBadge(t, u);

  const label =
    u.text ||
    u.meta?.message ||
    inferMessageFromMeta(t, u.meta) ||
    "System activity";

  return (
    <article
      className={`feed-row relative overflow-hidden flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-slate-700 px-3 py-2 bg-white/70 dark:bg-slate-800/70 ${isFresh ? "row-new" : ""} ${className}`}
    >
      {isFresh && <span className="row-pulse-ring" aria-hidden />}
      <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1 border ${labelClass}`}>
        {icon}
        {badgeText}
      </span>
      <span className="text-sm text-slate-800 dark:text-slate-100 truncate" title={label}>
        {label}
      </span>
      <span className="ml-auto text-[11px] text-slate-500">{whenText}</span>
    </article>
  );
}

/** Pick icon/badge style based on subtype */
function pickBadge(type, evt) {
  if (type.includes("members") || type.includes("invite") || type.includes("joined")) {
    return {
      icon: <UserPlus className="w-4 h-4" />,
      labelClass:
        "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-900/60",
      badgeText: "Members",
    };
  }
  if (type.includes("public") || type.includes("visibility")) {
    return {
      icon: <Globe2 className="w-4 h-4" />,
      labelClass:
        "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/70 dark:border-sky-900/60",
      badgeText: "Visibility",
    };
  }
  if (type.includes("icon") || evt?.meta?.icon) {
    return {
      icon: <ImageIcon className="w-4 h-4" />,
      labelClass:
        "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200/70 dark:border-violet-900/60",
      badgeText: "Icon",
    };
  }
  if (type.includes("settings") || type.includes("config") || type.includes("updated")) {
    return {
      icon: <Settings className="w-4 h-4" />,
      labelClass:
        "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-900/60",
      badgeText: "Settings",
    };
  }
  return {
    icon: <Shield className="w-4 h-4" />,
    labelClass:
      "bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-800/60",
    badgeText: "System",
  };
}

/** Build a human-ish message if not provided */
function inferMessageFromMeta(type, meta = {}) {
  if (!meta || typeof meta !== "object") return null;

  // Project icon change
  if (type.includes("icon") || meta.icon) {
    const kind = meta.icon?.kind || "emoji";
    const v = meta.icon?.value || "";
    return kind === "emoji" ? `Project icon set to ${v}` : `Project icon changed`;
    }

  // Public visibility toggles
  if (type.includes("public") || "publicEnabled" in meta || "publicToken" in meta) {
    const enabled = !!meta.publicEnabled || !!meta.publicToken;
    return enabled ? "Project status page enabled" : "Project status page disabled";
  }

  // Member updates summary
  if (Array.isArray(meta?.members)) {
    const add = meta.members.filter((m) => m?.__action === "added").length;
    const rem = meta.members.filter((m) => m?.__action === "removed").length;
    if (add || rem) {
      const parts = [];
      if (add) parts.push(`${add} added`);
      if (rem) parts.push(`${rem} removed`);
      return `Members updated (${parts.join(", ")})`;
    }
  }

  // Fallback
  return null;
}