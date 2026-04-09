// src/components/pulse/PulsePanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PULSE PANEL (Phase 2): Lightweight heartbeat widget
// ⭐ UPGRADE: Real-time Socket listeners for "Live" stat refreshing
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from "react";
import { Flame, Zap, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import { fetchPulseMetrics } from "../../api/taskApi";
import { useRealtime } from "../../context/RealtimeContext"; // Ensure this path is correct

export default function PulsePanel({ projectId, refreshKey = 0, className = "" }) {
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(false);
  const { socket } = useRealtime(); // ⭐ Hook into the shotgun broadcast

  const loadMetrics = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await fetchPulseMetrics({ projectId });
      setPulse(data);
    } catch (e) {
      setPulse(null);
      console.warn("[PulsePanel] fetch failed:", e?.message || e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initial Load
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics, refreshKey]);

  // ⭐ REALTIME LISTENER ⭐
  useEffect(() => {
    if (!socket || !projectId) return;

    // Listen for ANY project activity that would change metrics
    const handleUpdate = (data) => {
      // If the update belongs to this project, refresh the pulse!
      if (data?.projectId === projectId || data?.data?.projectId === projectId) {
        console.log("[Pulse] Activity detected, syncing metrics...");
        loadMetrics();
      }
    };

    socket.on("task_updated", handleUpdate);
    socket.on("task_created", handleUpdate);
    socket.on("milestone_updated", handleUpdate);
    socket.on("new_notification", handleUpdate);

    return () => {
      socket.off("task_updated", handleUpdate);
      socket.off("task_created", handleUpdate);
      socket.off("milestone_updated", handleUpdate);
      socket.off("new_notification", handleUpdate);
    };
  }, [socket, projectId, loadMetrics]);

  if (!projectId) return null;

  const doneToday = pulse?.doneToday ?? 0;
  const inMotion = pulse?.inMotion ?? 0;
  const blocked = pulse?.blocked ?? 0;
  const doneLast7Days = pulse?.doneLast7Days ?? 0;
  const createdToday = pulse?.createdToday ?? 0;
  const movedToReviewToday = pulse?.movedToReviewToday ?? 0;

  return (
    <div className={`bg-white dark:bg-[#1f1f23] rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-amber-500" />
          <h3 className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight">
            Pulse Activity
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {loading ? (
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Syncing
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-500/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
              Live
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Flame className="w-4 h-4 text-amber-500" />}
          label="Today Shipped"
          value={doneToday}
          hint="Completed today"
        />
        <StatCard
          icon={<Zap className="w-4 h-4 text-violet-500" />}
          label="In Motion"
          value={inMotion}
          hint="Todo + In Progress"
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          label="Blocked"
          value={blocked}
          hint="Needs attention"
        />
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 grid grid-cols-3 gap-4">
        <MiniStat label="7-Day Ships" value={doneLast7Days} icon={<TrendingUp className="w-4 h-4 text-teal-500" />} />
        <MiniStat label="Created Today" value={createdToday} />
        <MiniStat label="To Review" value={movedToReviewToday} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-violet-200 dark:hover:border-violet-500/30 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-md cursor-default group">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-[13px] font-bold mb-3">
        <div className="group-hover:scale-110 transition-transform">{icon}</div>
        <span>{label}</span>
      </div>
      <div className="text-[32px] font-black text-slate-900 dark:text-white tabular-nums tracking-tight leading-none">{value}</div>
      {hint && <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2 tracking-wide uppercase">{hint}</div>}
    </div>
  );
}

function MiniStat({ label, value, icon }) {
  return (
    <div className="p-3.5 rounded-xl bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 hover:border-violet-200 transition-colors duration-200">
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="text-[20px] font-black text-slate-900 dark:text-white tabular-nums leading-none">{value}</div>
    </div>
  );
}
