import React, { useEffect, useMemo, useState } from "react";
import { useSocketEvent } from "../../context/SocketContext.jsx";
import { formatLongDateTime } from "../../utils/formatters.js";

function prettyType(type) {
  if (!type) return "Update";
  if (type === "task.created") return "Task created";
  if (type === "milestone.updated") return "Milestone updated";
  if (type === "sprint.completed") return "Sprint completed";
  return type.replaceAll(".", " ");
}

function LiveRow({ e }) {
  const when = e?.createdAt ? formatLongDateTime(e.createdAt) : "";
  const title =
    e?.data?.title ||
    e?.data?.name ||
    e?.data?.taskTitle ||
    e?.data?.milestoneTitle ||
    e?.data?.sprintName ||
    "";

  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
      <div className="min-w-0">
        <div className="text-sm text-slate-800 dark:text-slate-100 break-words">
          <span className="font-medium">{prettyType(e?.type)}</span>
          {title ? <span className="text-slate-500"> — {title}</span> : null}
        </div>
        <div className="text-[11px] text-slate-500">{when}</div>
      </div>
    </div>
  );
}

/**
 * PublicProjectLiveFeed
 * - Listens for `public:project:update`
 * - Appends events to a simple UI list
 * - Frontend-only: no backend dependency besides event name + payload shape
 *
 * Expected payload (recommended):
 * {
 *   projectId: string,
 *   type: 'task.created' | 'milestone.updated' | 'sprint.completed' | string,
 *   data: any,
 *   createdAt: string | Date
 * }
 */
export default function PublicProjectLiveFeed({ projectId }) {
  const [events, setEvents] = useState([]);

  // Reset feed when project changes (safety)
  useEffect(() => {
    setEvents([]);
  }, [projectId]);

  useSocketEvent("public:project:update", (payload) => {
    // Defensive guards
    if (!payload) return;

    // Only accept events for THIS project
    const pid = payload.projectId || payload?.data?.projectId || null;
    if (projectId && pid && String(pid) !== String(projectId)) return;

    const normalized = {
      projectId: pid || projectId || null,
      type: payload.type || payload.eventType || "update",
      data: payload.data || payload,
      createdAt: payload.createdAt || new Date().toISOString(),
    };

    setEvents((prev) => {
      const next = [normalized, ...prev];
      // Keep it lightweight (last 50)
      return next.slice(0, 50);
    });
  });

  const hasEvents = events.length > 0;

  const headerRight = useMemo(() => {
    if (!hasEvents) return null;
    return (
      <span className="text-[11px] text-slate-500">
        Live • {events.length} recent
      </span>
    );
  }, [hasEvents, events.length]);

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Live updates
        </h2>
        {headerRight}
      </div>

      {!hasEvents ? (
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Waiting for live updates…
          <div className="mt-1 text-xs text-slate-500">
            When this project creates tasks, updates milestones, or completes sprints, updates will appear here.
          </div>
        </div>
      ) : (
        <div className="mt-2 divide-y divide-slate-200/70 dark:divide-slate-800">
          {events.map((e, idx) => (
            <LiveRow key={`${e.createdAt}-${idx}`} e={e} />
          ))}
        </div>
      )}
    </div>
  );
}
