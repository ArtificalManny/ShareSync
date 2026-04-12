// src/components/home/MissionClock.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MISSION CLOCK — Real-time dashboard clock, updates once per minute
// Syncs to the exact minute boundary so the flip is always precise.
// Uses Intl.DateTimeFormat → adapts to whatever timezone the browser reports.
// Isolated component: only this tiny tree re-renders on tick.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";

// ─── Formatters (created once, reused every tick) ──────────────────────────

function buildFormatters() {
  // Detect the browser's timezone automatically — no config needed
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const dateFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const timeFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const zoneFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "short",
  });

  return { dateFmt, timeFmt, zoneFmt, tz };
}

function formatNow(fmts) {
  const now = new Date();
  const dateStr = fmts.dateFmt.format(now);              // "Sunday, April 12"
  const timeStr = fmts.timeFmt.format(now);              // "11:47 AM"
  // Extract just the zone abbreviation (e.g. "PDT", "EST", "CET")
  const zoneParts = fmts.zoneFmt.formatToParts(now);
  const zoneStr = zoneParts.find(p => p.type === "timeZoneName")?.value || "";
  return { dateStr, timeStr, zoneStr };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function MissionClock() {
  const fmts = useMemo(() => buildFormatters(), []);
  const [display, setDisplay] = useState(() => formatNow(fmts));

  useEffect(() => {
    // Immediately set the correct time
    setDisplay(formatNow(fmts));

    // Calculate ms until the next minute boundary (XX:XX:00.000)
    const now = new Date();
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    // First tick: sync to the exact minute boundary
    const syncTimeout = setTimeout(() => {
      setDisplay(formatNow(fmts));

      // After sync: tick every 60 seconds
      const interval = setInterval(() => {
        setDisplay(formatNow(fmts));
      }, 60_000);

      // Store interval ID for cleanup
      syncTimeout._intervalId = interval;
    }, msUntilNextMinute);

    return () => {
      clearTimeout(syncTimeout);
      if (syncTimeout._intervalId) clearInterval(syncTimeout._intervalId);
    };
  }, [fmts]);

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Subtle clock icon — matches the "Operational Status: Live" aesthetic */}
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
      </div>

      {/* Date + Time stack */}
      <div className="flex flex-col items-end leading-tight">
        <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 tracking-wide">
          {display.dateStr}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold text-slate-600 dark:text-zinc-300 tabular-nums">
            {display.timeStr}
          </span>
          {display.zoneStr && (
            <span className="text-[10px] font-medium text-slate-400/70 dark:text-zinc-600 uppercase tracking-wider">
              {display.zoneStr}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
