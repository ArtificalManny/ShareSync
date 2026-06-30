// src/components/modals/KpiDrilldownModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const RANGE_KEY = "ss.kpi.range"; // localStorage key

export default function KpiDrilldownModal({
  open,
  onClose,
  title = "Cadence (14d)",
  subtitle = "Activity over time",
  series = [], // [{ date: '2025-08-01', value: 10 }, ...]
  unit = "",
}) {
  const [range, setRange] = useState(() => {
    try {
      return localStorage.getItem(RANGE_KEY) || "14d";
    } catch {
      return "14d";
    }
  });

  // persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(RANGE_KEY, range);
    } catch {}
  }, [range]);

  // filter series client-side by range (14d/30d/90d/all)
  const filtered = useMemo(() => {
    if (!Array.isArray(series) || series.length === 0) return [];
    if (range === "all") return series;
    const days = range === "14d" ? 14 : range === "30d" ? 30 : 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return series.filter((p) => new Date(p.date).getTime() >= cutoff);
  }, [range, series]);

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/70 dark:border-slate-700">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-200/70 dark:border-slate-800">
            <div>
              <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-600 dark:text-slate-400">
                {subtitle}
              </Dialog.Description>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Controls */}
          <div className="px-5 pt-4">
            <div className="inline-flex rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden">
              {["14d", "30d", "90d", "all"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={
                    "px-3 py-1 text-sm " +
                    (range === r
                      ? "bg-slate-900 text-white"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300")
                  }
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-72 px-5 pb-6 pt-2">
            <ResponsiveContainer width="Available" height="Available">
              <AreaChart data={filtered}>
                <defs>
                  <linearGradient id="cadenceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopOpacity={0.35} />
                    <stop offset="95%" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => {
                    try {
                      const dt = new Date(d);
                      return `${dt.getMonth() + 1}/${dt.getDate()}`;
                    } catch {
                      return d;
                    }
                  }}
                />
                <YAxis />
                <Tooltip
                  formatter={(v) => [`${v}${unit}`, "Value"]}
                  labelFormatter={(l) => {
                    try {
                      const dt = new Date(l);
                      return dt.toLocaleDateString();
                    } catch {
                      return l;
                    }
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="currentColor"
                  fill="url(#cadenceFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}