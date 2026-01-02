import { toast } from "../ui/Toast";
// /src/components/audit/AuditList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api.js"
import { toCsv, downloadCsv } from "../../utils/csv";
import { track } from "../../utils/telemetry";

/**
 * Lightweight audit/system activity list (no WS; current page only).
 *
 * Props:
 * - scope: "user" | "project" | "org" (default "user")
 * - userId?: string           // used when scope="user" (public profile etc.)
 * - projectId?: string        // used when scope="project"
 * - pageSize?: number         // default 20
 * - showExport?: boolean      // default true (CSV export of CURRENT PAGE)
 * - className?: string
 *
 * Notes:
 * - Server endpoint is expected at:
 *     /api/audit?scope=<scope>&userId=&projectId=&limit=&cursor=
 *   If your backend differs, tweak `fetchPage`.
 * - CSV export includes ISO timestamps, event type, actor, project, description, id.
 */
export default function AuditList({
  scope = "user",
  userId = null,
  projectId = null,
  pageSize = 20,
  showExport = true,
  className = "",
}) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(() => {
    const p = { scope, limit: pageSize };
    if (scope === "user" && userId) p.userId = userId;
    if (scope === "project" && projectId) p.projectId = projectId;
    if (cursor) p.cursor = cursor;
    return p;
  }, [scope, userId, projectId, pageSize, cursor]);

  async function fetchPage(reset = false) {
      setLoading(true);
  setError("");
  try {
    const { items: list, nextCursor } = await api.audit.list(params);
    setItems((prev) => (reset ? list : [...prev, ...list]));
    setHasMore(Boolean(nextCursor));
    setCursor(nextCursor);
  } catch (e) {
    setError(e?.message || "Failed to load activity.");
  } finally {
    setLoading(false);
  }
  }

  useEffect(() => {
    // initial load or when inputs change: reset paging
    setItems([]);
    setCursor(null);
    setHasMore(false);
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, userId, projectId, pageSize]);

  const exportCsv = () => {
    try {
      const rows = (items || []).map((it) => ({
        timestamp_iso: new Date(it.ts || it.createdAt || Date.now()).toISOString(),
        type: it.type || it.event || "event",
        actor: it.user?.name || it.actor?.name || it.userId || "",
        project: it.project?.title || it.projectTitle || "",
        description: it.text || it.message || it.action || "",
        id: it.id || it._id || "",
      }));
      const csv = toCsv(rows);
      const fname = `activity_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
      downloadCsv(fname, csv);
      track?.("audit_export_clicked", { count: rows.length, scope });
    } catch {
      toast.error('Export failed', { description: 'Could not export CSV', duration: 3000 });
    }
  };

  const relTime = (ts) => {
    try {
      const d = new Date(ts);
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return d.toLocaleString();
    } catch {
      return "";
    }
  };

  return (
    <section className={className}>
      {/* Controls */}
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface"
          onClick={() => fetchPage(true)}
          disabled={loading}
          title="Refresh"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
        {showExport && (
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface"
            onClick={exportCsv}
            title="Download CSV (current page)"
          >
            Download CSV
          </button>
        )}
        {error && <span className="text-rose-600 text-sm ml-auto">{error}</span>}
      </div>

      {/* List */}
      <div className="divide-y divide-border rounded-xl border border-border bg-surface" role="feed" aria-busy={loading ? "true" : "false"}>
        {items.length === 0 && !loading && (
          <div className="p-3 text-sm text-muted">No activity yet.</div>
        )}
        {items.length === 0 && loading && (
          <div className="p-3 text-sm text-muted animate-pulse">Loading…</div>
        )}
        {items.map((it, idx) => {
          const ts = it.ts || it.createdAt;
          const title =
            it.text || it.message || it.action ||
            it.type || it.event || "event";
          const meta = [
            it.user?.name || it.actor?.name || it.userId || null,
            it.project?.title || it.projectTitle || null,
          ].filter(Boolean).join(" · ");

          return (
            <article
              key={it.id || it._id || `${idx}:${ts}`}
              className="px-3 py-2"
              aria-label={`${title} — ${relTime(ts)}`}
            >
              <div className="text-sm truncate">{title}</div>
              <div className="text-[11px] text-muted">
                {meta ? `${meta} · ` : ""}{relTime(ts)}
              </div>
            </article>
          );
        })}
      </div>

      {/* Paging */}
      <div className="mt-2 flex items-center justify-end">
        {hasMore && (
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface disabled:opacity-60"
            onClick={() => fetchPage(false)}
            disabled={loading}
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </section>
  );
}