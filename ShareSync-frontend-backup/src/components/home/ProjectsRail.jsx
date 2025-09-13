import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StatusPill from "../projects/StatusPill.jsx";
import TraceOutline from "../ui/TraceOutline.jsx";

/** Ultra-light sparkline (SVG) */
function Sparkline({ points = [], width = 120, height = 36, pad = 4 }) {
  const vals = Array.isArray(points) ? points.map((v) => Number(v) || 0) : [];
  if (vals.length === 0) return null;

  const min = 0;
  const max = Math.max(1, Math.max(...vals));
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const x = (i) => pad + (vals.length === 1 ? innerW / 2 : (i / (vals.length - 1)) * innerW);
  const y = (v) => pad + innerH - ((v - min) / Math.max(1, max - min)) * innerH;

  const d = vals
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.9" />
    </svg>
  );
}

/** Small inline preset SVGs (keys match backend/frontend set) */
function SVGIcon({ name, className = "w-5 h-5" }) {
  const common = { className, "aria-hidden": true };
  switch (name) {
    case "rocket":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 2c3 0 6 2 8 4l-6 6-2-2-6 6-2-2 6-6-2-2 6-6z" fill="currentColor" />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M13 2L3 14h7l-1 8 11-12h-7l0-8z" fill="currentColor" />
        </svg>
      );
    case "target":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
      );
    default:
      return <div className={className} />;
  }
}

/**
 * ProjectsRail
 * - Horizontal, scrollable “stories” style rail
 * - Shows project icon (emoji/SVG) if available; falls back to avatar or initial
 */
export default function ProjectsRail({ items = [], loading = false }) {
  const scrollerRef = useRef(null);
  const [hoverId, setHoverId] = useState(null);
  const hoverTimer = useRef(null);

  const getId = (p) => p?._id || p?.id || null;

  const hasUnread = (p) => {
    if (!p?.lastActivityAt) return false;
    const since = Date.now() - new Date(p.lastActivityAt).getTime();
    return (p.unreadCount || 0) > 0 && since <= 24 * 60 * 60 * 1000;
  };

  const fallbackGlyph = (p) => {
    if (p?.avatar && /^https?:\/\//i.test(p.avatar)) return null;
    return (p?.title || "P").trim()[0]?.toUpperCase() || "P";
  };

  const scrollBy = (dx) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dx, behavior: "smooth" });
  };

  // Touch/drag to scroll
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onDown = (e) => {
      isDown = true;
      startX = (e.touches ? e.touches[0].pageX : e.pageX) - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      el.classList.add("cursor-grabbing");
    };
    const onLeave = () => {
      isDown = false;
      el.classList.remove("cursor-grabbing");
    };
    const onUp = () => {
      isDown = false;
      el.classList.remove("cursor-grabbing");
    };
    const onMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = (e.touches ? e.touches[0].pageX : e.pageX) - el.offsetLeft;
      const walk = (x - startX) * 1;
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("mouseup", onUp);
    el.addEventListener("mousemove", onMove);

    el.addEventListener("touchstart", onDown, { passive: true });
    el.addEventListener("touchend", onUp, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });

    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("mouseup", onUp);
      el.removeEventListener("mousemove", onMove);

      el.removeEventListener("touchstart", onDown);
      el.removeEventListener("touchend", onUp);
      el.removeEventListener("touchmove", onMove);
    };
  }, []);

  // Prefetch stats on hover/focus (debounced)
  useEffect(() => {
    if (!hoverId) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      import("../../api/stats")
        .then((mod) => mod.getProjectStats?.(hoverId, { range: 30 }))
        .catch(() => {});
    }, 120);
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, [hoverId]);

  // Resolve sparkline-friendly values
  const getSparkValues = (p) => {
    const s = p?.spark;
    if (Array.isArray(s)) return s;
    if (s && Array.isArray(s.values)) return s.values;
    if (s && Array.isArray(s.series)) return s.series;
    if (s && Array.isArray(s.activitySeries)) return s.activitySeries;
    if (Array.isArray(p?.activitySeries)) return p.activitySeries;
    return [];
  };

  const getTasksDone7d = (p) =>
    p?.tasksDone7d ?? p?.completedTasks ?? p?.kpis?.completedLast7d ?? null;

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[110px] shrink-0 rounded-2xl bg-slate-100 dark:bg-slate-800 h-[92px] animate-pulse"
              aria-hidden
            />
          ))}
        </div>
      );
    }
    if (!items?.length) {
      return <div className="text-sm text-muted">No recent projects.</div>;
    }

    return (
      <ul role="listbox" aria-label="Projects quick navigation" className="flex items-stretch gap-3">
        {items.map((p) => {
          const id = getId(p);
          if (!id) return null;
          const isUnread = hasUnread(p);
          const spark = getSparkValues(p);
          const done7d = getTasksDone7d(p);
          const icon = p?.icon || null; // {kind,value}
          const status = p?.status;

          return (
            <li key={id} role="option" aria-selected={false}>
              <TraceOutline radius={14} speedMs={2600}>
                <Link
                  to={`/projects/${id}`}
                  onMouseEnter={() => setHoverId(id)}
                  onMouseLeave={() => setHoverId((curr) => (curr === id ? null : curr))}
                  onFocus={() => setHoverId(id)}
                  onBlur={() => setHoverId((curr) => (curr === id ? null : curr))}
                  className={[
                    "group motion-quick relative w-[110px] shrink-0 rounded-2xl overflow-hidden",
                    "border border-border bg-surface",
                    "shadow-sm hover:shadow-md focus:outline-none",
                    "p-2 flex flex-col items-center gap-1",
                  ].join(" ")}
                  aria-label={`Open project ${p.title || "Untitled"}`}
                >
                  {/* left gradient bar */}
                  <span
                    aria-hidden="true"
                    className={[
                      "absolute left-0 top-0 h-full w-1.5 rounded-l-2xl transition-[width] duration-200 ease-out",
                      "bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-pink-500",
                      "group-hover:w-2",
                    ].join(" ")}
                  />
                  {/* shine sweep */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  >
                    <span className="absolute -left-20 top-0 h-full w-16 rotate-12 bg-white/10 group-hover:animate-[shine_900ms_ease-out]"></span>
                  </span>

                  {/* Avatar/Icon */}
                  <span
                    className={[
                      "relative block rounded-full overflow-hidden grid place-items-center",
                      "ring-1 border-border bg-white/60 dark:bg-slate-800/60",
                      "transition-transform duration-200 group-hover:scale-105",
                    ].join(" ")}
                    style={{ width: 52, height: 52 }}
                    aria-hidden="true"
                  >
                    {isUnread && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900" />
                    )}

                    {icon?.kind === "emoji" ? (
                      <div className="project-icon project-icon--lg bg-slate-100 dark:bg-slate-800">
                        <span className="emoji" role="img" aria-label="icon">{icon.value}</span>
                      </div>
                    ) : icon?.kind === "svg" ? (
                      <div className="project-icon project-icon--lg bg-slate-100 dark:bg-slate-800">
                        <span className="text-indigo-600">
                          <SVGIcon name={icon.value} className="w-5 h-5" />
                        </span>
                      </div>
                    ) : p?.avatar && /^https?:\/\//i.test(p.avatar) ? (
                      <img src={p.avatar} alt="" width={52} height={52} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-base font-semibold">{(p?.title || "P").slice(0,1).toUpperCase()}</span>
                    )}
                  </span>

                  <span className="text-[11px] text-text/90 text-center line-clamp-2">
                    {p.title || "Untitled"}
                  </span>

                  {/* Quick Peek hover card */}
                  {hoverId === id && (
                    <div
                      role="dialog"
                      aria-label={`${p.title || "Untitled"} quick peek`}
                      className={[
                        "motion-quick absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full",
                        "w-64 rounded-xl backdrop-blur bg-surface/95",
                        "border border-border shadow-xl p-3 z-10",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-muted mb-0.5">Last update</div>
                          <div className="text-sm text-text truncate">
                            {p.lastActivityAt ? new Date(p.lastActivityAt).toLocaleString() : "—"}
                          </div>
                          {Number.isFinite(done7d) && (
                            <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                              {done7d} tasks done (7d)
                            </div>
                          )}
                          {p.unreadCount > 0 && (
                            <div className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                              {p.unreadCount} unread update{p.unreadCount > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {Boolean(status) && <StatusPill status={status} size="sm" />}
                          {spark.length > 0 && (
                            <div className="text-indigo-500">
                              <Sparkline points={spark} width={120} height={36} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
              </TraceOutline>
            </li>
          );
        })}
      </ul>
    );
  }, [items, loading, hoverId]);

  return (
    <section aria-label="Projects quick rail" className="rail rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-5 py-2">
        <div className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-pink-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-text">Your Projects</h2>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy(-240)}
            className="btn btn--outline h-8 w-8 grid place-items-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy(240)}
            className="btn btn--outline h-8 w-8 grid place-items-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="px-3 sm:px-4 md:px-5 pb-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth cursor-grab"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") scrollBy(240);
          if (e.key === "ArrowLeft") scrollBy(-240);
        }}
      >
        {content}
      </div>
    </section>
  );
}
