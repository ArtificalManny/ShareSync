import React, { useEffect, useMemo, useRef, useState } from "react";
import FeedFilterBar from "./FeedFilterBar";
import FeedEmptyState from "./FeedEmptyState";

import UpdateItem from "./items/UpdateItem";
import TaskItem from "./items/TaskItem";
import FileItem from "./items/FileItem";
import SystemItem from "./items/SystemItem";

import useFreshHighlight from "../../hooks/useFreshHighlight";
import "../../styles/feed.css";

/**
 * ProjectActivityFeed
 * Mixed-type, filterable feed with optional composer and pagination.
 *
 * Props:
 * - projectId: string
 * - items: array (unified-ish activity items; server format OK)
 * - loading: boolean
 * - hasMore: boolean
 * - onLoadMore: () => void
 * - onPostUpdate?: (text) => Promise<void> | void
 * - onRefetch?: () => void
 * - filter?: 'all'|'updates'|'tasks'|'files'|'system'
 * - onFilterChange?: (next) => void
 */
export default function ProjectActivityFeed({
  projectId,
  items = [],
  loading = false,
  hasMore = false,
  onLoadMore,
  onPostUpdate,
  onRefetch,
  filter: controlledFilter,
  onFilterChange,
}) {
  // Perf marker when first items render
  const firstRenderRef = useRef(false);
  useEffect(() => {
    if (!firstRenderRef.current && items.length > 0) {
      firstRenderRef.current = true;
      try {
        performance.mark?.("ss:feed:first-render");
      } catch {}
    }
  }, [items.length]);

  // Local/controlled filter
  const [localFilter, setLocalFilter] = useState("all");
  const activeFilter = controlledFilter ?? localFilter;
  const setFilter = (next) => {
    if (onFilterChange) onFilterChange(next);
    else setLocalFilter(next);
  };

  // Classifier to map arbitrary events to category buckets
  const classify = (evt) => {
    const type = String(evt?.type || evt?.kind || "").toLowerCase();
    if (type.includes("system") || type.includes("audit")) return "system";
    if (type.includes("task")) return "tasks";
    if (type.includes("file")) return "files";
    if (type.includes("update") || type === "") return "updates";

    // fallback heuristics
    const txt = String(evt?.text || "").toLowerCase();
    if (txt.includes("uploaded") || txt.includes(".png") || txt.includes(".pdf"))
      return "files";
    if (
      txt.includes("task") ||
      txt.includes("assigned") ||
      txt.includes("completed")
    )
      return "tasks";
    return "updates";
  };

  // Filter + sort
  const filtered = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const byCat =
      activeFilter === "all"
        ? list
        : list.filter((i) => classify(i) === activeFilter);
    return [...byCat].sort((a, b) => {
      const ta = +new Date(a.createdAt || a.ts || 0);
      const tb = +new Date(b.createdAt || b.ts || 0);
      return tb - ta;
    });
  }, [items, activeFilter]);

  // Optional inline composer
  const handleComposerSubmit = async (val) => {
    if (!val?.trim()) return;
    await onPostUpdate?.(val.trim());
  };

  // Row renderer with fresh highlight
  const Row = ({ evt }) => {
    const when = formatWhen(evt?.createdAt || evt?.ts);
    const key =
      evt?._id ||
      evt?.id ||
      `${evt?.type || "evt"}:${evt?.createdAt || evt?.ts}:${
        evt?.text?.slice?.(0, 16) || ""
      }`;

    const { isFresh } = useFreshHighlight(evt?.freshUntil);

    const cat = classify(evt);
    const commonProps = { event: evt, when, isFresh };

    switch (cat) {
      case "tasks":
        return <TaskItem key={key} {...commonProps} />;
      case "files":
        return <FileItem key={key} {...commonProps} />;
      case "system":
        return <SystemItem key={key} {...commonProps} />;
      case "updates":
      default:
        return <UpdateItem key={key} {...commonProps} />;
    }
  };

  return (
    <section aria-label="Project activity feed" className="space-y-3">
      <FeedFilterBar
        value={activeFilter}
        onChange={setFilter}
        showSearch={false}
        rightExtra={
          onRefetch ? (
            <button
              type="button"
              onClick={() => onRefetch?.()}
              className="inline-flex items-center rounded-xl border border-slate-200/70 dark:border-slate-700 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Refresh
            </button>
          ) : null
        }
      />

      {onPostUpdate && <Composer onSubmit={handleComposerSubmit} />}

      {/* Loading skeleton (initial) */}
      {loading && filtered.length === 0 && (
        <div
          className="rounded-xl border border-slate-200/70 dark:border-slate-700 p-4 bg-white/70 dark:bg-slate-800/70"
          aria-busy="true"
        >
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          </div>
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((evt) => (
            <Row key={evt.id || evt._id} evt={evt} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <FeedEmptyState
          icon="🧵"
          title={
            activeFilter === "all" ? "No activity yet" : "No items in this filter"
          }
          body={
            activeFilter === "all"
              ? "Kick things off with a quick update so everyone knows the plan."
              : "Try switching filters or posting an update."
          }
          action={
            onPostUpdate && activeFilter === "all" ? (
              <button
                onClick={() => onPostUpdate?.("First update 👋")}
                className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Post an update
              </button>
            ) : null
          }
        />
      )}

      {/* Pagination */}
      {hasMore && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onLoadMore}
            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
}

/** Small inline composer */
function Composer({ onSubmit }) {
  const inputRef = React.useRef(null);
  const send = () => {
    const val = inputRef.current?.value ?? "";
    if (!val.trim()) return;
    onSubmit?.(val.trim());
    inputRef.current.value = "";
  };
  return (
    <div className="rounded-xl border border-slate-200/70 dark:border-slate-700 p-3 bg-white dark:bg-slate-900">
      <label htmlFor="feed-composer" className="sr-only">
        Post an update
      </label>
      <div className="flex gap-2">
        <input
          id="feed-composer"
          ref={inputRef}
          type="text"
          placeholder="What’s the latest?"
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button
          type="button"
          onClick={send}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Post
        </button>
      </div>
    </div>
  );
}

/** Helper */
function formatWhen(iso) {
  try {
    return iso ? new Date(iso).toLocaleString() : "";
  } catch {
    return "";
  }
}