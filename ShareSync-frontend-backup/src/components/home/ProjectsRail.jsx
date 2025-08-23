// /src/components/home/ProjectsRail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * ProjectsRail
 * - Horizontal, scrollable “stories” style rail
 * - Keyboardable (left/right), buttons for scroll
 * - Touch drag to scroll
 * - Blue ring if unread in last 24h (unreadCount > 0 AND lastActivityAt < 24h)
 *
 * props:
 *  - items: Array<{ _id?, id?, title, avatar?, lastActivityAt?, unreadCount? }>
 *  - loading: boolean
 */
export default function ProjectsRail({ items = [], loading = false }) {
  const scrollerRef = useRef(null);
  const [hoverId, setHoverId] = useState(null);
  const hoverTimer = useRef(null);

  // helpers
  const getId = (p) => p?._id || p?.id || null;

  const hasUnread = (p) => {
    if (!p?.lastActivityAt) return false;
    const since = Date.now() - new Date(p.lastActivityAt).getTime();
    return (p.unreadCount || 0) > 0 && since <= 24 * 60 * 60 * 1000;
  };

  const displayEmoji = (p) => {
    if (p?.avatar && /^https?:\/\//i.test(p.avatar)) return null; // it’s an image URL
    const m = (p?.title || "").match(/[\p{Emoji}\p{Extended_Pictographic}]/u);
    return m ? m[0] : (p?.title || "P").trim()[0]?.toUpperCase() || "P";
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

  // ✅ Prefetch stats on hover/focus (debounced)
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

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[88px] shrink-0 rounded-2xl bg-slate-100 dark:bg-slate-800 h-[92px] animate-pulse"
              aria-hidden
            />
          ))}
        </div>
      );
    }
    if (!items?.length) {
      return <div className="text-sm text-slate-500">No recent projects.</div>;
    }

    return (
      <ul
        role="listbox"
        aria-label="Projects quick navigation"
        className="flex items-stretch gap-3"
      >
        {items.map((p) => {
          const id = getId(p);
          if (!id) return null;
          const isUnread = hasUnread(p);
          const emoji = displayEmoji(p);
          const isImage = p?.avatar && /^https?:\/\//i.test(p.avatar);

          return (
            <li key={id} role="option" aria-selected={false}>
              <Link
                to={`/projects/${id}`}
                onMouseEnter={() => setHoverId(id)}
                onMouseLeave={() => setHoverId((curr) => (curr === id ? null : curr))}
                onFocus={() => setHoverId(id)}
                onBlur={() => setHoverId((curr) => (curr === id ? null : curr))}
                className="motion-quick relative w-[92px] shrink-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 p-2 flex flex-col items-center gap-1"
                aria-label={`Open project ${p.title || "Untitled"}`}
              >
                <span
                  className={[
                    "block h-12 w-12 rounded-full overflow-hidden grid place-items-center text-lg font-semibold",
                    isUnread
                      ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                      : "ring-1 ring-slate-200/70 dark:ring-slate-700",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {isImage ? (
                    <img
                      src={p.avatar}
                      alt=""
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{emoji}</span>
                  )}
                </span>
                <span className="text-[11px] text-slate-700 dark:text-slate-300 text-center line-clamp-2">
                  {p.title || "Untitled"}
                </span>

                {/* Quick Peek hover card */}
                {hoverId === id && (
                  <div
                    role="dialog"
                    aria-label={`${p.title || "Untitled"} quick peek`}
                    className="motion-quick absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 shadow-xl p-3 z-10"
                  >
                    <div className="text-xs text-slate-500 mb-1">Last activity</div>
                    <div className="text-sm text-slate-800 dark:text-slate-100">
                      {p.lastActivityAt ? new Date(p.lastActivityAt).toLocaleString() : "—"}
                    </div>
                    {p.unreadCount > 0 && (
                      <div className="mt-2 text-xs text-blue-600">
                        {p.unreadCount} unread update{p.unreadCount > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }, [items, loading, hoverId]);

  return (
    <section
      aria-label="Projects quick rail"
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 shadow-sm"
    >
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-5 py-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Your Projects
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy(-240)}
            className="motion-quick h-8 w-8 rounded-lg border border-slate-200/70 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 grid place-items-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy(240)}
            className="motion-quick h-8 w-8 rounded-lg border border-slate-200/70 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 grid place-items-center"
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
