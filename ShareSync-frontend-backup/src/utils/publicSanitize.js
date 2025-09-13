/**
 * Defensive client-side sanitizers for public views.
 * These DO NOT replace server-side sanitization.
 */

/** Remove private-ish fields from a project payload before public render. */
export function sanitizeProjectForPublic(raw = {}) {
    const allow = {};
    allow._id = raw._id || raw.id || undefined;
    allow.title = raw.title || raw.name || "Untitled Project";
    allow.icon = raw.icon || null;
    allow.lastUpdatedAt = raw.lastUpdatedAt || raw.updatedAt || raw.createdAt || new Date().toISOString();
    // public KPIs (if present)
    if (raw.kpis && typeof raw.kpis === "object") {
      const { onTime30d, throughputPerWeek, activeDays28d, cadence14d } = raw.kpis;
      allow.kpis = { onTime30d, throughputPerWeek, activeDays28d, cadence14d };
    }
    // DO NOT include members, emails, files, private notes, etc.
    return allow;
  }
  
  /** Keep only public-safe activity lines (heuristic). */
  export function sanitizeActivityForPublic(items = []) {
    return (Array.isArray(items) ? items : [])
      .filter((it) => {
        // If backend labels visibility, respect it.
        if (it.visibility && it.visibility !== "public") return false;
        // Heuristic types allowed:
        const t = String(it.type || "").toLowerCase();
        if (t.includes("audit") || t.includes("system")) return true;
        if (t.startsWith("update")) return true;
        if (t.startsWith("task.completed") || t.startsWith("task.complete")) return true;
        // avoid raw file payloads or internal changes
        if (t.startsWith("file.")) return false;
        return false;
      })
      .map((it) => ({
        type: it.type || "update",
        text: it.text || it.title || "",
        createdAt: it.createdAt || it.ts || new Date().toISOString(),
      }));
  }
  