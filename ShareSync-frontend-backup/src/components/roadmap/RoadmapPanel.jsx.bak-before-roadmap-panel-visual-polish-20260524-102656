// src/components/roadmap/RoadmapPanel.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ROADMAP PANEL - Milestones + Filters (safe, minimal backend assumptions)
//
// ✅ SAFE COMPLETION PATH (NO BACKEND RISK):
// - Fetch milestones ONLY with projectId (no status/sort query dependencies)
// - Filter + sort client-side
// - Compute progress from liveTasks (task.milestoneId)
// - Clicking milestone calls onMilestoneClick(milestoneId, milestone)
//
// ✅ ADDED: Edit modal, Delete confirmation, Status change
// - Uses client.patch/client.delete for API calls
// - Tries multiple endpoint patterns for resilience
// - Optimistic UI with rollback on failure
//
// ⭐ LIGHT MODE CONTRAST FIX:
// - Explicit light-mode text colors for header, subtitle, filters, sort, and states
// - Preserves dark-mode token behavior
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus,
  RefreshCw,
  Map as MapIcon,
  Filter,
  ArrowUpDown,
  X,
  Loader2,
  Calendar,
  Flag,
  AlertTriangle,
} from "lucide-react";
import MilestoneCard from "./MilestoneCard";
import { getMilestones } from "../../api/milestones";
import client from "../../api/client";

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
  return s === "active" || s === "in-progress" || s === "inprogress" || s === "in_progress";
}

function parseDateMaybe(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isOverdueMilestone(m) {
  if (isMilestoneCompleted(m)) return false;
  const due = parseDateMaybe(m?.dueDate || m?.targetDate);
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
    return parseDateMaybe(m?.dueDate || m?.targetDate)?.getTime() ?? 0;
  };

  arr.sort((a, b) => {
    const av = getValue(a);
    const bv = getValue(b);
    return asc ? av - bv : bv - av;
  });

  return arr;
}

async function updateMilestoneApi(milestoneId, data) {
  if (!milestoneId) throw new Error("milestoneId is required");

  const attempts = [
    { method: "patch", url: `/milestones/${milestoneId}` },
    { method: "put", url: `/milestones/${milestoneId}` },
    { method: "patch", url: `/milestones/${milestoneId}/update` },
    { method: "put", url: `/milestones/${milestoneId}/update` },
  ];

  for (const { method, url } of attempts) {
    try {
      const res = await client[method](url, data);
      return res.data?.data || res.data;
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 405) continue;
      throw e;
    }
  }

  throw new Error("Could not update milestone — no working endpoint found. Check backend routes.");
}

async function deleteMilestoneApi(milestoneId) {
  if (!milestoneId) throw new Error("milestoneId is required");

  const endpoints = [`/milestones/${milestoneId}`];

  for (const url of endpoints) {
    try {
      const res = await client.delete(url);
      return res.data?.data || res.data;
    } catch (e) {
      if (e?.response?.status === 404 || e?.response?.status === 405) continue;
      throw e;
    }
  }

  throw new Error("Could not delete milestone — no working endpoint found. Check backend routes.");
}

const EDIT_STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "at_risk", label: "At Risk" },
];

function EditMilestoneModal({ milestone, onClose, onSave, saving, error: saveError }) {
  const [title, setTitle] = useState(milestone?.title || milestone?.name || "");
  const [description, setDescription] = useState(milestone?.description || "");
  const [targetDate, setTargetDate] = useState(() => {
    const raw = milestone?.dueDate || milestone?.targetDate;
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  });
  const [status, setStatus] = useState(() => {
    const s = normalizeStatus(milestone?.status);
    if (s === "in-progress" || s === "inprogress" || s === "active") return "in_progress";
    if (s === "done" || s === "complete" || s === "completed") return "completed";
    if (s === "at-risk" || s === "at_risk") return "at_risk";
    return "planned";
  });

  const canSave = title.trim().length >= 1 && !saving;

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!canSave) return;

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      targetDate: targetDate || undefined,
      status,
    };

    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="relative w-[92vw] max-w-[520px] rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-1 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-violet-500 dark:text-brand-300" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-text-primary">
              Edit Milestone
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 text-slate-500 dark:text-text-tertiary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500 dark:text-text-tertiary">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Milestone title..."
              className="
                mt-2 w-full px-3 py-2 rounded-xl
                bg-white dark:bg-surface-2
                border border-slate-200 dark:border-white/[0.10]
                text-slate-900 dark:text-text-secondary
                focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-brand-500/30
              "
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500 dark:text-text-tertiary">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this milestone..."
              rows={3}
              className="
                mt-2 w-full px-3 py-2 rounded-xl resize-none
                bg-white dark:bg-surface-2
                border border-slate-200 dark:border-white/[0.10]
                text-slate-900 dark:text-text-secondary
                focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-brand-500/30
              "
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500 dark:text-text-tertiary flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Target date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="
                mt-2 w-full px-3 py-2 rounded-xl
                bg-white dark:bg-surface-2
                border border-slate-200 dark:border-white/[0.10]
                text-slate-900 dark:text-text-secondary
                focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-brand-500/30
              "
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500 dark:text-text-tertiary">
              Status
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {EDIT_STATUS_OPTIONS.map((opt) => {
                const active = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`
                      px-3 py-1.5 rounded-xl text-sm transition-all border
                      ${active
                        ? "bg-violet-50 border-violet-200 text-violet-700 ring-1 ring-violet-200/70 dark:bg-brand-500/10 dark:border-brand-500/25 dark:text-brand-300 dark:ring-brand-500/20"
                        : "bg-white dark:bg-surface-2 border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-surface-3"
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {saveError ? (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-error-500/10 border border-red-200 dark:border-error-500/15 text-sm text-red-600 dark:text-error-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="
                px-4 py-2 rounded-xl
                bg-white dark:bg-surface-2 border border-slate-200 dark:border-white/[0.10]
                text-slate-700 dark:text-text-secondary text-sm
                hover:bg-slate-50 dark:hover:bg-surface-1 transition-colors
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-xl
                text-sm font-medium transition-colors
                ${canSave ? "bg-violet-600 hover:bg-violet-500 dark:bg-brand-500 dark:hover:bg-brand-400 text-white" : "bg-slate-200 dark:bg-white/[0.10] text-slate-400 dark:text-white/40"}
              `}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ milestone, onClose, onConfirm, deleting, error: deleteError }) {
  const title = milestone?.title || milestone?.name || "this milestone";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="relative w-[92vw] max-w-[400px] rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-1 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-error-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500 dark:text-error-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-text-primary">Delete Milestone?</h3>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-text-secondary mb-6">
          Are you sure you want to delete <strong className="text-slate-900 dark:text-text-primary">"{title}"</strong>? This action cannot be undone.
        </p>

        {deleteError ? (
          <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-error-500/10 border border-red-200 dark:border-error-500/15 text-sm text-red-600 dark:text-error-200">
            {deleteError}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="
              flex-1 py-2.5 rounded-xl
              bg-white dark:bg-surface-2 border border-slate-200 dark:border-transparent
              text-slate-700 dark:text-text-secondary text-sm
              hover:bg-slate-50 dark:hover:bg-surface-3 hover:text-slate-900 dark:hover:text-text-primary
              transition-colors
            "
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="
              flex-1 py-2.5 rounded-xl
              bg-red-500 dark:bg-error-500 text-white text-sm font-medium
              hover:bg-red-600 dark:hover:bg-error-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors flex items-center justify-center gap-2
            "
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoadmapPanel({
  projectId,
  onMilestoneClick,
  onAddMilestone,
  liveTasks = [],
  selectedMilestoneId = null,
  defaultStatus = "all",
  defaultSort = "dueDate:asc",
  className = "",
}) {
  const [status, setStatus] = useState(defaultStatus);
  const [sort, setSort] = useState(defaultSort);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [editingMilestone, setEditingMilestone] = useState(null);
  const [deletingMilestone, setDeletingMilestone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");

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

  useEffect(() => {
    const onRefresh = () => fetchData();
    window.addEventListener("milestones:refresh", onRefresh);
    return () => window.removeEventListener("milestones:refresh", onRefresh);
  }, [fetchData]);

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

      c.planned += 1;
    });
    return c;
  }, [items]);

  const progressByMilestoneId = useMemo(() => {
    const map = new Map();
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

  const handleEdit = useCallback((milestoneId, milestone) => {
    setSaveError("");
    setEditingMilestone(milestone);
  }, []);

  const handleEditSave = useCallback(
    async (data) => {
      const mid = getMilestoneId(editingMilestone);
      if (!mid) return;

      setSaving(true);
      setSaveError("");

      const prevItems = items;
      setItems((prev) =>
        prev.map((m) =>
          getMilestoneId(m) === mid ? { ...m, ...data, status: data.status || m.status } : m
        )
      );

      try {
        await updateMilestoneApi(mid, data);
        setEditingMilestone(null);
        await fetchData();
      } catch (e) {
        const msg =
          Array.isArray(e?.response?.data?.message)
            ? e.response.data.message.join(" • ")
            : e?.response?.data?.message || e?.message || "Failed to save";
        setSaveError(msg);
        setItems(prevItems);
      } finally {
        setSaving(false);
      }
    },
    [editingMilestone, items, fetchData]
  );

  const handleDelete = useCallback((milestoneId, milestone) => {
    setDeleteError("");
    setDeletingMilestone(milestone);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const mid = getMilestoneId(deletingMilestone);
    if (!mid) return;

    setDeleting(true);
    setDeleteError("");

    const prevItems = items;
    setItems((prev) => prev.filter((m) => getMilestoneId(m) !== mid));

    try {
      await deleteMilestoneApi(mid);
      setDeletingMilestone(null);
      window.dispatchEvent(new CustomEvent("milestones:refresh"));
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to delete";
      setDeleteError(typeof msg === "string" ? msg : JSON.stringify(msg));
      setItems(prevItems);
    } finally {
      setDeleting(false);
    }
  }, [deletingMilestone, items]);

  const handleStatusChange = useCallback(
    async (milestoneId, newStatus) => {
      if (!milestoneId || !newStatus) return;

      const prevItems = items;
      setItems((prev) =>
        prev.map((m) =>
          getMilestoneId(m) === milestoneId ? { ...m, status: newStatus } : m
        )
      );

      try {
        await updateMilestoneApi(milestoneId, { status: newStatus });
        await fetchData();
      } catch (e) {
        setItems(prevItems);
        console.error("[RoadmapPanel] Status change failed:", e?.message);
      }
    },
    [items, fetchData]
  );

  return (
    <section className={`p-10 max-w-[1600px] mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <MapIcon className="w-5 h-5 text-violet-500 dark:text-brand-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-text-primary">Roadmap</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200/70 text-violet-700 dark:bg-white/[0.06] dark:border-transparent dark:text-text-tertiary">
              {counts.all} milestones
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-text-tertiary">
            Track milestones and deadlines. Progress updates instantly as tasks change.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={fetchData}
            className="
              inline-flex items-center gap-2 px-3 py-2 rounded-xl
              bg-white dark:bg-surface-1
              border border-slate-200 dark:border-white/[0.08]
              text-slate-700 dark:text-text-secondary text-sm
              hover:bg-slate-50 dark:hover:bg-surface-2
              hover:border-slate-300 dark:hover:border-white/[0.12]
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
              bg-rose-500 dark:bg-brand-500 text-white text-sm font-medium
              hover:bg-rose-400 dark:hover:bg-brand-400 transition-colors
            "
          >
            <Plus className="w-4 h-4" />
            <span>Add Milestone</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-slate-500 dark:text-text-tertiary">
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
                  px-3 py-1.5 rounded-xl text-sm transition-all border
                  ${
                    active
                      ? "bg-violet-50 border-violet-200 text-violet-700 dark:bg-brand-500/10 dark:border-brand-500/25 dark:text-brand-300"
                      : "bg-white dark:bg-surface-1 border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-surface-2 hover:border-slate-300 dark:hover:border-white/[0.12]"
                  }
                `}
              >
                <span>{opt.label}</span>
                <span className={`ml-2 text-xs ${active ? "text-violet-700 dark:text-brand-300" : "text-slate-500 dark:text-text-tertiary"}`}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>

        <div className="lg:ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-text-tertiary">
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Sort</span>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="
              px-3 py-2 rounded-xl text-sm
              bg-white dark:bg-surface-1
              border border-slate-200 dark:border-white/[0.08]
              text-slate-700 dark:text-text-secondary
              focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-brand-500/30
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
        <div className="p-10 rounded-2xl bg-white dark:bg-surface-1 border border-slate-200 dark:border-white/[0.06] text-center">
          <div className="w-10 h-10 rounded-full border-2 border-violet-200 dark:border-brand-500/20 border-t-violet-500 dark:border-t-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-text-tertiary text-sm">Loading milestones...</p>
        </div>
      )}

      {!loading && error && (
        <div className="p-8 rounded-2xl bg-red-50 dark:bg-error-500/10 border border-red-200 dark:border-error-500/15">
          <div className="text-red-600 dark:text-error-300 font-medium mb-2">Couldn't load milestones</div>
          <div className="text-sm text-slate-600 dark:text-text-secondary mb-4">{error}</div>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-xl bg-white dark:bg-surface-1 border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-surface-2 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (items?.length || 0) === 0 && (
        <div className="p-12 rounded-2xl bg-white dark:bg-surface-1 border border-slate-200 dark:border-white/[0.06] text-center">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-brand-500/10 text-violet-500 dark:text-brand-400 flex items-center justify-center mx-auto mb-4">
            <MapIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-text-primary mb-2">No milestones yet</h3>
          <p className="text-sm text-slate-600 dark:text-text-tertiary mb-6 max-w-md mx-auto">
            Create a milestone for your next release, demo, or deadline — and track progress as tasks get completed.
          </p>
          <button
            onClick={() => onAddMilestone?.()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 dark:bg-brand-500 text-white text-sm font-medium hover:bg-rose-400 dark:hover:bg-brand-400 transition-colors"
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
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            );
          })}
        </div>
      )}

      {editingMilestone ? (
        <EditMilestoneModal
          milestone={editingMilestone}
          onClose={() => { setEditingMilestone(null); setSaveError(""); }}
          onSave={handleEditSave}
          saving={saving}
          error={saveError}
        />
      ) : null}

      {deletingMilestone ? (
        <DeleteConfirmModal
          milestone={deletingMilestone}
          onClose={() => { setDeletingMilestone(null); setDeleteError(""); }}
          onConfirm={handleConfirmDelete}
          deleting={deleting}
          error={deleteError}
        />
      ) : null}
    </section>
  );
}
