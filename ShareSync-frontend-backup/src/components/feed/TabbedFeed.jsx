import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { track } from "../../utils/telemetry";
import AuditList from "../audit/AuditList.jsx";

// Heavy panel: load on demand
const PublicStreakFeed = lazy(() => import("./PublicStreakFeed.jsx"));

/**
 * TabbedFeed
 * A single, accessible feed surface with tabs (Updates / Tasks / Files / Discover).
 *
 * Props:
 *  - projectId?: string   → when present, "Updates" shows project activity; otherwise user scope.
 *  - initialTab?: 'updates' | 'tasks' | 'files' | 'discover'
 *  - showDiscover?: boolean (default true)
 *  - className?: string
 *  - onTabChange?: (tabKey) => void
 *
 * Telemetry:
 *  - feed_tab_changed { tab, projectId }
 */
export default function TabbedFeed({
  projectId = null,
  initialTab = "updates",
  showDiscover = true,
  className = "",
  onTabChange,
}) {
  const [tab, setTab] = useState(initialTab);
  const tablistRef = useRef(null);
  const idBase = useMemo(() => "tf" + Math.random().toString(36).slice(2, 8), []);

  const tabs = useMemo(() => {
    const base = [
      { key: "updates",  label: "Updates" },
      { key: "tasks",    label: "Tasks" },
      { key: "files",    label: "Files" },
    ];
    return showDiscover ? [...base, { key: "discover", label: "Discover" }] : base;
  }, [showDiscover]);

  // Keep selected tab valid if discover toggles off
  useEffect(() => {
    const exists = tabs.some(t => t.key === tab);
    if (!exists) setTab(tabs[0]?.key || "updates");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.length]);

  const changeTab = (next) => {
    setTab(next);
    try { track("feed_tab_changed", { tab: next, projectId }); } catch {}
    onTabChange?.(next);
  };

  // Keyboard navigation for tabs (left/right/home/end)
  const onKeyDownTabs = (e) => {
    const idx = tabs.findIndex(t => t.key === tab);
    if (idx < 0) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      changeTab(tabs[(idx + 1) % tabs.length].key);
      focusTab(tabs[(idx + 1) % tabs.length].key);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      changeTab(tabs[(idx - 1 + tabs.length) % tabs.length].key);
      focusTab(tabs[(idx - 1 + tabs.length) % tabs.length].key);
    } else if (e.key === "Home") {
      e.preventDefault();
      changeTab(tabs[0].key);
      focusTab(tabs[0].key);
    } else if (e.key === "End") {
      e.preventDefault();
      changeTab(tabs[tabs.length - 1].key);
      focusTab(tabs[tabs.length - 1].key);
    }
  };

  const focusTab = (key) => {
    const btn = tablistRef.current?.querySelector(`#${idBase}-tab-${key}`);
    btn?.focus?.();
  };

  return (
    <div className={`card rounded-2xl p-4 shine accent-bar ${className}`}>
      <span className="accent-bar__left" aria-hidden="true" />
      {/* Tabs */}
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="Activity feed tabs"
        className="flex flex-wrap items-center gap-2 mb-3"
        onKeyDown={onKeyDownTabs}
      >
        {tabs.map(({ key, label }) => {
          const selected = tab === key;
          return (
            <button
              key={key}
              id={`${idBase}-tab-${key}`}
              role="tab"
              aria-selected={selected}
              aria-controls={`${idBase}-panel-${key}`}
              tabIndex={selected ? 0 : -1}
              className={[
                "px-3 py-1.5 rounded-full text-sm border transition",
                selected
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700/60",
              ].join(" ")}
              onClick={() => changeTab(key)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div className="mt-2">
        {/* Updates */}
        <Panel
          id={`${idBase}-panel-updates`}
          labelledBy={`${idBase}-tab-updates`}
          hidden={tab !== "updates"}
        >
          <AuditList scope={projectId ? "project" : "user"} projectId={projectId || undefined} />
        </Panel>

        {/* Tasks (light placeholder wiring for now) */}
        <Panel
          id={`${idBase}-panel-tasks`}
          labelledBy={`${idBase}-tab-tasks`}
          hidden={tab !== "tasks"}
        >
          <PlaceholderBlock
            title="Tasks activity"
            subtitle="Task-specific changes will appear here."
            ctaLabel="Go to project tasks"
            href={projectId ? `/projects/${projectId}#tasks` : "/projects"}
          />
        </Panel>

        {/* Files (light placeholder wiring for now) */}
        <Panel
          id={`${idBase}-panel-files`}
          labelledBy={`${idBase}-tab-files`}
          hidden={tab !== "files"}
        >
          <PlaceholderBlock
            title="Files activity"
            subtitle="Recently added and updated files will appear here."
            ctaLabel="Open files"
            href={projectId ? `/projects/${projectId}#files` : "/projects"}
          />
        </Panel>

        {/* Discover / Public cadence feed */}
        {showDiscover && (
          <Panel
            id={`${idBase}-panel-discover`}
            labelledBy={`${idBase}-tab-discover`}
            hidden={tab !== "discover"}
          >
            <Suspense fallback={<Skeleton height={120} label="Loading Discover…" />}>
              <PublicStreakFeed initialType="all" initialSince="7d" initialSort="newest" />
            </Suspense>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Panel({ id, labelledBy, hidden, children }) {
  return (
    <section
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
      hidden={hidden}
      className={hidden ? "hidden" : "block"}
    >
      {children}
    </section>
  );
}

function Skeleton({ height = 96, label = "Loading…" }) {
  return (
    <div
      className="rounded-2xl border border-border bg-surface animate-pulse grid place-items-center text-sm text-muted"
      style={{ height }}
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}

function PlaceholderBlock({ title, subtitle, ctaLabel, href }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-sm text-muted mt-1">{subtitle}</div>
      <div className="mt-3">
        <a href={href} className="btn btn--outline">{ctaLabel}</a>
      </div>
    </div>
  );
}
