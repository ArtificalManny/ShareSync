import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  History,
  FileText,
  MessageSquareText,
  CheckSquare,
  Settings,
  Loader2,
  PlusCircle,
} from "lucide-react";
import { track } from "../../utils/telemetry";

/**
 * Unified project activity feed (normalized items).
 *
 * Props:
 * - projectId: string
 * - items: normalized items [{ id, type, subtype, projectId, userId?, ts, text, task?, files?, freshUntil? }]
 * - loading: boolean
 * - hasMore: boolean
 * - onLoadMore?: () => void
 * - onRefetch?: () => void
 * - onPostUpdate?: (payload: string | {text, attachments?}) => Promise<void>   // presence => canEdit
 */
export default function ProjectActivityFeed({
  projectId,
  items = [],
  loading = false,
  hasMore = false,
  onLoadMore,
  onRefetch,
  onPostUpdate, // if present → editor can post
}) {
  const canPost = typeof onPostUpdate === "function";
  const [composer, setComposer] = useState("");
  const [posting, setPosting] = useState(false);

  // Filters
  const FILTERS = [
    { key: "all", label: "All", icon: History },
    { key: "update", label: "Updates", icon: MessageSquareText },
    { key: "task", label: "Tasks", icon: CheckSquare },
    { key: "file", label: "Files", icon: FileText },
    { key: "system", label: "System", icon: Settings },
  ];
  const [filter, setFilter] = useState("all");

  // polite live region: announce when new items arrive
  const liveRef = useRef(null);
  const prevLenRef = useRef(items.length);
  useEffect(() => {
    const prev = prevLenRef.current;
    const next = items.length;
    if (next > prev && liveRef.current) {
      const diff = next - prev;
      liveRef.current.textContent = `${diff} new ${diff === 1 ? "activity" : "activities"}.`;
      setTimeout(() => {
        if (liveRef.current) liveRef.current.textContent = "";
      }, 1500);
    }
    prevLenRef.current = next;
  }, [items.length]);

  // Counts by type (for chips)
  const counts = useMemo(() => {
    const c = { all: items.length, update: 0, task: 0, file: 0, system: 0 };
    for (const it of items) {
      const t = (it?.type || "").toLowerCase();
      if (c[t] !== undefined) c[t] += 1;
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((it) => String(it.type).toLowerCase() === filter);
  }, [items, filter]);

  const setsize = filtered.length;

  const submitComposer = async () => {
    if (!canPost || posting) return;
    const text = String(composer || "").trim();
    if (!text) return;
    setPosting(true);
    try {
      // ProjectHome handler already does telemetry + optimistic swap
      await onPostUpdate(text);
      setComposer("");
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "Failed to post update.");
    } finally {
      setPosting(false);
    }
  };

  const onComposerKey = useCallback(
    (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submitComposer();
      }
    },
    [submitComposer]
  );

  // Simple, lightweight relative time formatter (fallback if you don't have a util)
  const relTime = (ts) => {
    try {
      const d = new Date(ts);
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return d.toLocaleDateString();
    } catch {
      return "";
    }
  };

  const iconFor = (type) => {
    if (type === "task") return <CheckSquare className="w-4 h-4 text-emerald-600" aria-hidden="true" />;
    if (type === "file") return <FileText className="w-4 h-4 text-indigo-600" aria-hidden="true" />;
    if (type === "system") return <Settings className="w-4 h-4 text-slate-500" aria-hidden="true" />;
    return <MessageSquareText className="w-4 h-4 text-purple-600" aria-hidden="true" />;
  };

  const rows = filtered;

  return (
    <section aria-label="Activity feed" role="region">
      {/* Live updates */}
      <div className="sr-only" aria-live="polite" ref={liveRef} />

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const ActiveIcon = f.icon;
          const active = filter === f.key;
          const count = counts[f.key] ?? 0;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setFilter(f.key);
                try { track("activity_filter_changed", { projectId, filter: f.key }); } catch {}
              }}
              className={[
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs",
                active ? "bg-indigo-600 border-indigo-600 text-white" : "border-border hover:bg-surface text-text",
              ].join(" ")}
              aria-pressed={active ? "true" : "false"}
            >
              <ActiveIcon className="w-3.5 h-3.5" />
              {f.label}
              <span
                className={[
                  "ml-1 inline-flex min-w-[16px] items-center justify-center rounded-full px-1 text-[10px]",
                  active ? "bg-white/20" : "bg-surface text-muted border border-border",
                ].join(" ")}
                aria-label={`${count} ${f.label.toLowerCase()} items`}
              >
                {count}
              </span>
            </button>
          );
        })}
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => {
              onRefetch?.();
              try { track("activity_refresh_clicked", { projectId }); } catch {}
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Optional composer (editors only) */}
      {canPost && (
        <div className="mb-3 rounded-xl border border-border bg-surface p-3">
          <label htmlFor="composer-input" className="block text-xs text-muted mb-1">
            Post an update
          </label>
          <textarea
            id="composer-input"
            rows={3}
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            onKeyDown={onComposerKey}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            placeholder="What’s happening?"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="text-[11px] text-muted">
              Press <kbd className="px-1 border rounded">⌘</kbd>/<kbd className="px-1 border rounded">Ctrl</kbd> +{" "}
              <kbd className="px-1 border rounded">Enter</kbd> to post
            </div>
            <button
              type="button"
              onClick={submitComposer}
              disabled={posting || !composer.trim()}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60"
              aria-label="Post update"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      )}

      {/* Skeletons */}
      {loading && rows.length === 0 && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-3 animate-pulse h-[64px]" />
          ))}
        </div>
      )}

      {/* Empty (filter-aware) */}
      {!loading && rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-sm text-muted">
          {filter === "all" && "No activity yet."}
          {filter === "update" && "No updates yet."}
          {filter === "task" && "No task activity yet."}
          {filter === "file" && "No file activity yet."}
          {filter === "system" && "No system activity yet."}
        </div>
      )}

      {/* List */}
      <div role="feed" aria-busy={loading ? "true" : "false"} className="divide-y divide-border rounded-xl border border-border bg-surface">
        {rows.map((it, idx) => {
          const posinset = idx + 1;
          const fresh = typeof it.freshUntil === "number" ? it.freshUntil > Date.now() : false;
          const a11yLabel = `${it.type || "item"} — ${it.text || ""} — ${relTime(it.ts)}`;

          return (
            <article
              key={it.id || `${it.type}:${it.ts}:${idx}`}
              role="article"
              tabIndex={0}
              aria-label={a11yLabel}
              aria-posinset={posinset}
              aria-setsize={setsize}
              className={[
                "group px-3 py-2 flex items-start gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                fresh ? "bg-indigo-50/50 dark:bg-indigo-950/20" : ""
              ].join(" ")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  // future: open detail
                }
              }}
            >
              <div className="mt-0.5">{iconFor(it.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text truncate">
                  {it.text || (it.task?.title ?? "") || (Array.isArray(it.files) ? `${it.files.length} file(s)` : "")}
                </div>
                <div className="text-[11px] text-muted">
                  {humanizeSubtype(it.type, it.subtype)} · {relTime(it.ts)}
                </div>
              </div>
              {fresh && <span className="ml-1 mt-1 inline-block w-2 h-2 rounded-full bg-indigo-500" aria-hidden="true" />}
            </article>
          );
        })}
      </div>

      {/* Footer: pagination */}
      <div className="mt-3 flex items-center justify-end">
        {hasMore && (
          <button
            type="button"
            onClick={() => {
              onLoadMore?.();
              try { track("activity_load_more_clicked", { projectId, filter }); } catch {}
            }}
            disabled={loading}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface disabled:opacity-60"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </section>
  );
}

function humanizeSubtype(type, subtype) {
  if (!subtype) return type || "activity";
  const s = String(subtype).toLowerCase();
  if (s.includes("created")) return "created";
  if (s.includes("updated")) return "updated";
  if (s.includes("completed")) return "completed";
  if (s.includes("added")) return "added";
  if (s.includes("removed")) return "removed";
  return type || "activity";
}
