import React from "react";
import UpdateItem from "./items/UpdateItem";
import TaskItem from "./items/TaskItem";
import FileItem from "./items/FileItem";
import AuditItem from "./items/AuditItem";

/**
 * ProjectActivityItem
 * Single switchboard that delegates to the specialized sub-renderers.
 *
 * Props:
 *  - event: the feed item (heterogeneous)
 *  - classify: (event) => 'updates' | 'tasks' | 'files' | 'system'
 */
export default function ProjectActivityItem({ event, classify }) {
  const group = classify?.(event) || "updates";
  const when = event?.createdAt ? new Date(event.createdAt).toLocaleString() : "";
  const isNew = Boolean(event?.__optimistic || event?._isNew || event?.isNew);

  // We wrap the rendered item so we can add the subtle ring pulse for "new".
  return (
    <div className={isNew ? "ring-anim rounded-xl" : undefined}>
      {renderByGroup(group, event, when)}
    </div>
  );
}

function renderByGroup(group, event, when) {
  const variant =
    group === "tasks" ? "emerald" :
    group === "files" ? "blue" :
    group === "system" ? "purple" :
    "blue";

  switch (group) {
    case "tasks":
      return <TaskItem event={event} when={when} variant={variant} />;
    case "files":
      return <FileItem event={event} when={when} variant={variant} />;
    case "system":
      return <AuditItem event={event} when={when} variant={variant} />;
    case "updates":
    default:
      return <UpdateItem event={event} when={when} variant={variant} />;
  }
}
