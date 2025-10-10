import React, { forwardRef } from "react";
import Button from "../ui/Button.jsx";


/**
 * ProjectStoryChip
 * Small pill with avatar + title + unread ring animation.
 *
 * Props:
 *  - project: {_id, name, icon?}
 *  - unread: boolean
 *  - selected: boolean (for aria-selected)
 *  - onClick, onFocus, tabIndex
 */
const ProjectStoryChip = forwardRef(function ProjectStoryChip(
  { project, unread = false, selected = false, onClick, onFocus, tabIndex = -1 },
  ref
) {
  const title = project?.name || "Untitled";
  const icon = project?.icon || null; // { kind:'emoji'|'svg', value }
  const initial = (title || "?").trim().charAt(0).toUpperCase();

  const avatar = (() => {
    if (icon && icon.kind === "emoji" && icon.value) {
      return <span className="text-xl leading-none">{icon.value}</span>;
    }
    // Fallback letter avatar
    return <span className="text-sm font-semibold">{initial}</span>;
  })();

  return (
    <Button asChild variant="ghost" size="sm">
      <button
        ref={ref}
        type="button"
        role="option"
        aria-selected={selected ? "true" : "false"}
        title={title}
        className={[
          "story-chip relative shrink-0 group",
          "rounded-2xl border border-border bg-surface hover:bg-surface/60",
          unread ? "story-chip--unread" : "",
        ].join(" ")}
        onClick={onClick}
        onFocus={onFocus}
        tabIndex={tabIndex}
      >
      <span className="story-chip__avatar">
        {avatar}
      </span>
      <span className="story-chip__label" aria-hidden="false">
        {title}
      </span>
      {/* focus ring handled by CSS; unread ring handled by .story-chip--unread */}
    </button>
    </Button>
  );
});

export default ProjectStoryChip;
