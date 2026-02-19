// src/components/roadmap/RoadmapPanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ROADMAP PANEL - Milestones + Filters (safe, minimal backend assumptions)
//
// ✅ SAFE COMPLETION PATH (NO BACKEND RISK):
// - Fetch milestones ONLY with projectId (no status/sort query dependencies)
// - Filter + sort client-side
// - Compute progress from liveTasks (task.milestoneId)
// - Clicking milestone calls onMilestoneClick(milestoneId, milestone)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, RefreshCw, Map as MapIcon, Filter, ArrowUpDown } from "lucide-react";
import MilestoneCard from "./MilestoneCard";
import { getMilestones } from "../../api/milestones";

const STATUS_OPTIONS = [
  { id: "all", label: "All" },
  { id: "planned", label: "Planned" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "overdue", label: "Overdue" },
];

const SORT_OPTIONS = [
  { id: "dueDate:asc", label: "Due date ↑" },
  { id: "dueDate:desc", label: "Due date ↓" },
  { id: "createdAt:desc", label: "Newest" },
  { id: "createdAt:asc", label: "Oldest" },
];

function getMilestoneId(m) {
  return m?._id || m?.id;
}

function normalizeId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return v?.toString?.() || "";
}

function normalizeStatus(status) {
  return (status || "").toLowerCase();
}

// ✅ Safe "done" detection without backend dependency.
// Adjust later if your backend uses different status values.
function isTaskDone(task) {
  if (!task) return false;
  if (task.completed === true) return true;
  if (task.isCompleted === true) return true;

  const s = normalizeStatus(task.status);
  return s === "done" || s === "completed" || s === "complete";
}

function isMilestoneCompleted(m) {
  const s = normalizeStatus(m?.status);
  return s === "done" || s === "completed" || s === "complete";
}

function isMilestoneInProgress(m) {
  const s = normalizeStatus(m?.status);
  return s === "active" || s === "in-progress" || s === "inprogress";
}

function parseDateMaybe(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isOverdueMilestone(m) {
  if (isMilestoneCompleted(m)) return false;
  const due = parseDateMaybe(m?.dueDate);
  if (!due) return false;
  return due.getTime() < Date.now();
}

function applyStatusFilter(items, statusId) {
  if (!Array.isArray(items)) return [];
  if (!statusId || statusId === "all") return items;

  if (statusId === "planned") {
    return items.filter((m) => normalizeStatus(m?.status || "planned") === "planned");
  }

  if (statusId === "in-progress") {
    return items.filter((m) => isMilestoneInProgress(m));
  }

  if (statusId === "completed") {
    return items.filter((m) => isMilestoneCompleted(m));
  }

  if (statusId === "overdue") {
    return items.filter((m) => isOverdueMilestone(m));
  }

  return items;
}

function applySort(items, sortId) {
  const arr = Array.isArray(items) ? [...items] : [];
  const [field, dir] = (sortId || "dueDate:asc").split(":");
  const asc = (dir || "asc").toLowerCase() === "asc";

  const getValue = (m) => {
    if (field === "createdAt") return parseDateMaybe(m?.createdAt)?.getTime() ?? 0;
    // default: dueDate
    return parseDateMaybe(m?.dueDate)?.getTime() ?? 0;
  };

  arr.sort((a, b) => {
    const av = getValue(a);
    const bv = getValue(b);
    return asc ? av - bv : bv - av;
  });

  return arr;
}

export default function RoadmapPanel({
  projectId,
  onMilestoneClick,
  onAddMilestone,

  // ✅ SAFE: liveTasks passed from ProjectHome for frontend-only progress
  liveTasks = [],

  // ✅ highlight selected milestone (optional)
  selectedMilestoneId = null,

  // optional knobs
  defaultStatus = "all",
  defaultSort = "dueDate:asc",
  className = "",
}) {
  const [status, setStatus] = useState(defaultStatus);
  const [sort, setSort] = useState(defaultSort);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");

    try {
      const list = await getMilestones(projectId);
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load milestones";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!projectId) return;
      if (cancelled) return;
      await fetchData();
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, fetchData]);

  const counts = useMemo(() => {
    const c = { all: 0, planned: 0, "in-progress": 0, completed: 0, overdue: 0 };
    (items || []).forEach((m) => {
      c.all += 1;

      if (isOverdueMilestone(m)) {
        c.overdue += 1;
        return;
      }

      if (isMilestoneCompleted(m)) {
        c.completed += 1;
        return;
      }

      if (isMilestoneInProgress(m)) {
        c["in-progress"] += 1;
        return;
      }

      // default bucket
      c.planned += 1;
    });
    return c;
  }, [items]);

  // ✅ Compute progress per milestone from liveTasks (frontend-only).
  const progressByMilestoneId = useMemo(() => {
    const map = new globalThis.Map();
    const tasksArr = Array.isArray(liveTasks) ? liveTasks : [];

    for (const t of tasksArr) {
      const mid = normalizeId(t?.milestoneId);
      if (!mid) continue;

      if (!map.has(mid)) {
        map.set(mid, { total: 0, done: 0 });
      }
      const cur = map.get(mid);
      cur.total += 1;
      if (isTaskDone(t)) cur.done += 1;
    }

    return map;
  }, [liveTasks]);

  const filteredSortedItems = useMemo(() => {
    const filtered = applyStatusFilter(items, status);
    return applySort(filtered, sort);
  }, [items, status, sort]);

  const itemsWithProgress = useMemo(() => {
    return (filteredSortedItems || []).map((m) => {
      const mid = normalizeId(getMilestoneId(m));
      const stats = progressByMilestoneId.get(mid) || { total: 0, done: 0 };

      const total = stats.total;
      const done = stats.done;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      const left = Math.max(0, total - done);

      return {
        ...m,
        progress,
        tasksTotal: total,
        tasksDone: done,
        tasksLeft: left,
      };
    });
  }, [filteredSortedItems, progressByMilestoneId]);

  const handleCardClick = useCallback(
    (milestoneId, milestone) => {
      if (!milestoneId) return;
      onMilestoneClick?.(milestoneId, milestone);
    },
    [onMilestoneClick]
  );

  return (
    <section className={`p-10 max-w-[1600px] mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <MapIcon className="w-5 h-5 text-brand-400" />
            <h2 className="text-xl font-semibold text-text-primary">Roadmap</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-text-tertiary">
              {counts.all} milestones
            </span>
          </div>
          <p className="text-sm text-text-tertiary">
            Track milestones and deadlines. Progress updates instantly as tasks change.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={fetchData}
            className="
              inline-flex items-center gap-2 px-3 py-2 rounded-xl
              bg-surface-1 border border-white/[0.08]
              text-text-secondary text-sm
              hover:bg-surface-2 hover:border-white/[0.12]
              transition-all
            "
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => onAddMilestone?.()}
            className="
              inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-brand-500 text-white text-sm font-medium
              hover:bg-brand-400 transition-colors
            "
          >
            <Plus className="w-4 h-4" />
            <span>Add Milestone</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-text-tertiary">
          <Filter className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Filter</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt.id;
            const n = counts[opt.id] ?? (opt.id === "all" ? counts.all : 0);
            return (
              <button
                key={opt.id}
                onClick={() => setStatus(opt.id)}
                className={`
                  px-3 py-1.5 rounded-xl text-sm transition-all
                  border
                  ${
                    active
                      ? "bg-brand-500/10 border-brand-500/25 text-brand-300"
                      : "bg-surface-1 border-white/[0.08] text-text-secondary hover:bg-surface-2 hover:border-white/[0.12]"
                  }
                `}
              >
                <span>{opt.label}</span>
                <span className={`ml-2 text-xs ${active ? "text-brand-300" : "text-text-tertiary"}`}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>

        <div className="lg:ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 text-text-tertiary">
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Sort</span>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="
              px-3 py-2 rounded-xl text-sm
              bg-surface-1 border border-white/[0.08]
              text-text-secondary
              focus:outline-none focus:ring-2 focus:ring-brand-500/30
            "
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="p-10 rounded-2xl bg-surface-1 border border-white/[0.06] text-center">
          <div className="w-10 h-10 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-text-tertiary text-sm">Loading milestones...</p>
        </div>
      )}

      {!loading && error && (
        <div className="p-8 rounded-2xl bg-error-500/10 border border-error-500/15">
          <div className="text-error-300 font-medium mb-2">Couldn’t load milestones</div>
          <div className="text-sm text-text-secondary mb-4">{error}</div>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-xl bg-surface-1 border border-white/[0.08] text-text-secondary hover:bg-surface-2 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (items?.length || 0) === 0 && (
        <div className="p-12 rounded-2xl bg-surface-1 border border-white/[0.06] text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-4">
            <MapIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No milestones yet</h3>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            Create a milestone for your next release, demo, or deadline — and track progress as tasks get completed.
          </p>
          <button
            onClick={() => onAddMilestone?.()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create first milestone
          </button>
        </div>
      )}

      {!loading && !error && (itemsWithProgress?.length || 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {itemsWithProgress.map((m) => {
            const mid = getMilestoneId(m);
            const isSelected = normalizeId(selectedMilestoneId) === normalizeId(mid);

            return (
              <MilestoneCard
                key={mid}
                milestone={m}
                onClick={handleCardClick}
                showActions={true}
                isSelected={isSelected}
                onEdit={(mId, mm) => onMilestoneClick?.(mId, mm)}
                onDelete={undefined}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
