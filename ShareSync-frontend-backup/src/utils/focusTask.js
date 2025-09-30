export function focusTaskById(taskId, { behavior = "smooth" } = {}) {
    if (!taskId) return false;
    const el = document.querySelector(`[data-task-id="${CSS.escape(String(taskId))}"]`);
    if (!el) return false;
    try { el.scrollIntoView({ block: "center", behavior }); } catch { el.scrollIntoView(); }
    try { el.focus?.(); } catch {}
    return true;
  }
  