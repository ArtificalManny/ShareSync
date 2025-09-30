import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ProjectStoryChip from "./ProjectStoryChip";
import { getLastSeen, setLastSeen, hasUnread, buildUnreadMap } from "../../utils/stories";
import { track } from "../../utils/telemetry";
import "../../styles/stories.css";

/**
 * ProjectStoriesBar
 * Horizontal, keyboard-accessible rail of project “stories”.
 *
 * Props:
 *  - projects: Array<{ _id, name, icon?, lastActivityAt?, updatedAt? }>
 *  - unread?: Record<projectId, boolean> (optional override)
 *  - onOpen?: (project) => void   (parent navigates)
 *  - className?: string
 */
export default function ProjectStoriesBar({ projects = [], unread = {}, onOpen, className = "" }) {
  const listRef = useRef(null);
  const itemRefs = useRef([]);
  const [focusIndex, setFocusIndex] = useState(0);

  // Local overrides so the unread ring clears immediately on open (in addition to setLastSeen)
  const [overrides, setOverrides] = useState({}); // { [projectId]: boolean }

  const computedUnread = useMemo(() => {
    if (!Array.isArray(projects)) return {};
    // Base: compute from lastSeen + lastActivity
    const base = buildUnreadMap(projects);
    // External override (prop) first
    Object.entries(unread || {}).forEach(([pid, v]) => { base[pid] = Boolean(v); });
    // Local override (rings clear instantly)
    Object.entries(overrides || {}).forEach(([pid, v]) => { base[pid] = Boolean(v); });
    return base;
  }, [projects, unread, overrides]);

  useEffect(() => {
    try { track("stories_rendered", { count: projects.length }); } catch {}
  }, [projects.length]);

  // Keep refs the same length as items
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, projects.length);
  }, [projects.length]);

  const scrollIntoView = (idx) => {
    const el = itemRefs.current[idx];
    if (!el || !listRef.current) return;
    const container = listRef.current;
    const rect = el.getBoundingClientRect();
    const crect = container.getBoundingClientRect();

    if (rect.left < crect.left) {
      container.scrollBy({ left: rect.left - crect.left - 8, behavior: "smooth" });
    } else if (rect.right > crect.right) {
      container.scrollBy({ left: rect.right - crect.right + 8, behavior: "smooth" });
    }
  };

  const moveFocus = (delta) => {
    if (projects.length === 0) return;
    let next = (focusIndex + delta + projects.length) % projects.length;
    setFocusIndex(next);
    requestAnimationFrame(() => {
      itemRefs.current[next]?.focus?.();
      scrollIntoView(next);
    });
  };

  const onKeyDown = (e) => {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        moveFocus(1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        moveFocus(-1);
        break;
      case "Home":
        e.preventDefault();
        setFocusIndex(0);
        requestAnimationFrame(() => {
          itemRefs.current[0]?.focus?.();
          scrollIntoView(0);
        });
        break;
      case "End":
        e.preventDefault();
        setFocusIndex(projects.length - 1);
        requestAnimationFrame(() => {
          itemRefs.current[projects.length - 1]?.focus?.();
          scrollIntoView(projects.length - 1);
        });
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (projects[focusIndex]) handleOpen(projects[focusIndex]);
        break;
      default:
        break;
    }
  };

  const handleOpen = useCallback((p) => {
    if (!p?._id) return;
    try { setLastSeen(p._id, Date.now()); } catch {}
    // Clear ring immediately
    setOverrides((prev) => ({ ...prev, [String(p._id)]: false }));
    try { track("story_opened", { projectId: p._id }); } catch {}
    try { track("story_mark_read", { projectId: p._id }); } catch {}
    onOpen?.(p);
  }, [onOpen]);

  if (!projects?.length) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-3 text-sm text-muted">
        No projects yet.
      </div>
    );
  }

  return (
    <div className={`stories-wrap ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted">Projects</h3>
      </div>

      <div
        ref={listRef}
        className="stories-rail"
        role="listbox"
        aria-label="Recent projects"
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
      >
        {projects.map((p, i) => {
          const pid = String(p._id || p.id || "");
          const isUnread = computedUnread[pid] === true;
          const selected = i === focusIndex;

          return (
            <ProjectStoryChip
              key={pid || i}
              ref={(el) => (itemRefs.current[i] = el)}
              project={p}
              unread={isUnread}
              selected={selected}
              tabIndex={i === 0 ? 0 : -1} // roving tabindex (first is tabbable)
              onClick={() => handleOpen(p)}
              onFocus={() => setFocusIndex(i)}
            />
          );
        })}
      </div>
    </div>
  );
}
