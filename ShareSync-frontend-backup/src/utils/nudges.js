/**
 * decideNudges(input) -> [{ id, kind, title, message, actions[] }]
 *
 * input:
 *  - recentEvents: [{ type, createdAt }]
 *  - prefs: { nudges: { sprint?:bool, update?:bool, convertTask?:bool } }
 *  - lastSprintFinishedAt?: ISO
 *  - notesCount?: number
 *  - tasksPending?: number
 */
export function decideNudges({
    recentEvents = [],
    prefs = {},
    lastSprintFinishedAt,
    notesCount = 0,
    tasksPending = 0,
  }) {
    const out = [];
    const allow = (k) => prefs?.nudges?.[k] !== false;
  
    // If a sprint finished recently and no update yet, suggest logging an update
    const finished = lastSprintFinishedAt ? new Date(lastSprintFinishedAt).getTime() : 0;
    const hasRecentUpdate = recentEvents.some((e) => String(e.type).startsWith("update"));
    if (finished && !hasRecentUpdate && allow("update")) {
      out.push({
        id: "nudge_update_after_sprint",
        kind: "update",
        title: "Close the loop?",
        message: "You just wrapped a sprint. Share a quick update.",
        actions: [{ label: "Post update", href: "/home#recent-activity" }],
      });
    }
  
    // If user posted an update but hasn’t done focused work yet, suggest a sprint
    const hasFreshUpdate = recentEvents.some((e) => String(e.type).startsWith("update") &&
      Date.now() - new Date(e.createdAt || 0).getTime() < 2 * 60 * 60 * 1000); // 2h
    if (hasFreshUpdate && allow("sprint")) {
      out.push({
        id: "nudge_sprint_after_update",
        kind: "sprint",
        title: "Make progress now?",
        message: "Kick off a short sprint to push this forward.",
        actions: [{ label: "Start sprint", href: "/home#focus-sprint" }],
      });
    }
  
    // If there are many notes and few tasks, suggest converting notes → tasks
    if (notesCount >= 3 && tasksPending <= 1 && allow("convertTask")) {
      out.push({
        id: "nudge_convert_notes",
        kind: "convert",
        title: "Turn notes into actions",
        message: "You’ve got notes piling up. Convert one into a task?",
        actions: [{ label: "Review notes", href: "/home#notes" }],
      });
    }
  
    return out;
  }
  