import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "../utils/telemetry";

/**
 * useMentorNextAction
 * Picks the next best action from open tasks using a small heuristic:
 *   score = 0.5*impact + 0.3*urgency + 0.2*staleness - 0.2*effort
 *
 * Sources (in order):
 *  1) props.tasks (if provided)
 *  2) GET /api/mentor/next?projectId=... (if available)
 *  3) GET /api/tasks?state=open&projectId=... (fallback)
 *
 * Returns:
 *  { loading, error, suggestion, refresh }
 *
 * suggestion: {
 *   id, title, projectId, projectName, dueAt, estimateMinutes,
 *   etaMinutes, confidence (0..1),
 *   why: [string], score (number)
 * }
 */
export default function useMentorNextAction({
  projectId,
  tasks,             // optional preloaded open tasks
  limit = 1,
  refreshMs = 5 * 60_000,
} = {}) {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [data, setData]         = useState(null);
  const abortRef                = useRef(null);

  const endpointMentor = projectId
    ? `/api/mentor/next?projectId=${encodeURIComponent(projectId)}&limit=${limit}`
    : `/api/mentor/next?limit=${limit}`;
  const endpointTasks = projectId
    ? `/api/tasks?state=open&projectId=${encodeURIComponent(projectId)}`
    : `/api/tasks?state=open`;

  const refresh = async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      let openTasks = tasks;
      // 1) prefer props.tasks
      if (!Array.isArray(openTasks)) {
        // 2) try mentor endpoint
        const resMentor = await safeFetch(endpointMentor, controller.signal);
        if (resMentor.ok) {
          const json = await resMentor.json().catch(() => null);
          const sug = normalizeMentor(json);
          if (sug) {
            setData(sug);
            setLoading(false);
            track("mentor_next_action_loaded", { source: "mentor_api", projectId });
            return;
          }
        }
        // 3) fallback to tasks list
        const resTasks = await safeFetch(endpointTasks, controller.signal);
        if (resTasks.ok) {
          openTasks = await resTasks.json().catch(() => []);
        }
      }

      const suggestion = rankAndExplain(openTasks || [], { limit });
      setData(suggestion);
      track("mentor_next_action_loaded", { source: Array.isArray(tasks) ? "props" : "tasks_api", projectId });
    } catch (e) {
      setError(e);
      // safe demo fallback
      setData({
        id: "demo-quick-win",
        title: "Ship homepage polish (CTA contrast)",
        projectId: projectId || "all",
        projectName: "Quick Wins",
        dueAt: null,
        estimateMinutes: 25,
        etaMinutes: 25,
        confidence: 0.55,
        why: ["Small effort / high impact", "No dependencies detected"],
        score: 0.66,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    if (!refreshMs) return;
    const id = setInterval(refresh, refreshMs);
    return () => {
      clearInterval(id);
      abortRef.current?.abort?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, Array.isArray(tasks) ? tasks.length : "no-prop", refreshMs]);

  const suggestion = useMemo(() => data, [data]);

  return { loading, error, suggestion, refresh };
}

/* -------------------- helpers -------------------- */

async function safeFetch(url, signal) {
  try {
    return await fetch(url, { credentials: "include", signal });
  } catch {
    return { ok: false, status: 0, json: async () => null };
  }
}

function normalizeMentor(json) {
  if (!json) return null;
  // accept either {suggestion:{...}} or array
  const s = json.suggestion || (Array.isArray(json) ? json[0] : json);
  if (!s) return null;
  return {
    id: s.id || s._id || "nbd",
    title: s.title || s.name || "Next best action",
    projectId: s.projectId || s.project?.id || null,
    projectName: s.projectName || s.project?.title || null,
    dueAt: s.dueAt || s.due || null,
    estimateMinutes: toNum(s.estimateMinutes, 25),
    etaMinutes: toNum(s.etaMinutes, s.estimateMinutes || 25),
    confidence: clamp01(s.confidence ?? 0.6),
    why: Array.isArray(s.why) ? s.why : [s.why].filter(Boolean),
    score: toNum(s.score, 0.5),
  };
}

function rankAndExplain(items, { limit = 1 } = {}) {
  const open = (Array.isArray(items) ? items : []).filter((t) =>
    !["done", "completed", "archived"].includes(String(t.status || "").toLowerCase())
  );

  if (open.length === 0) {
    return {
      id: "start-sprint",
      title: "Start a 25:00 on the top project",
      projectId: "all",
      projectName: "Momentum",
      estimateMinutes: 25,
      etaMinutes: 25,
      confidence: 0.5,
      why: ["No open tasks found — create one during focus"],
      score: 0.4,
    };
  }

  const now = Date.now();
  const scored = open.map((t) => {
    const impact = mapPriority(t.priority || t.impact || t.size);
    const due = toTime(t.dueAt || t.due || t.deadline);
    const urgency = due ? urgencyScore(now, due) : 0.2;
    const updated = toTime(t.updatedAt || t.lastActivityAt || t.createdAt) || now;
    const staleness = Math.min(1, (now - updated) / (7 * 24 * 60 * 60 * 1000)); // up to 7 days
    const effort = normalizeEffort(t.estimateMinutes || t.estimate || t.points);

    const score = 0.5 * impact + 0.3 * urgency + 0.2 * staleness - 0.2 * effort;
    const eta = Math.max(15, Math.round((t.estimateMinutes || effort * 45 || 25) / 5) * 5);

    const why = [];
    if (impact >= 0.7) why.push("High impact");
    if (urgency >= 0.6) why.push("Due soon");
    if (staleness >= 0.5) why.push("Stale — nudge momentum");
    if (effort <= 0.3) why.push("Quick win");

    return {
      id: t.id || t._id || String(Math.random()),
      title: t.title || t.name || "Untitled task",
      projectId: t.projectId || t.project?.id || null,
      projectName: t.project?.title || t.projectName || null,
      dueAt: due || null,
      estimateMinutes: t.estimateMinutes || null,
      etaMinutes: eta,
      confidence: clamp01(0.5 + 0.2 * impact + 0.1 * urgency - 0.1 * effort),
      why: why.length ? why : ["Balanced pick for momentum"],
      score,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

function mapPriority(x) {
  const s = String(x ?? "").toLowerCase();
  if (s === "p0" || s === "critical" || s === "high") return 1;
  if (s === "p1" || s === "med" || s === "medium") return 0.7;
  if (s === "p2" || s === "low") return 0.4;
  const n = Number(x);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n / 10)) : 0.6; // default medium
}
function urgencyScore(now, due) {
  const d = Math.max(0, due - now);
  const day = 24 * 60 * 60 * 1000;
  if (d <= 0) return 1;     // overdue
  if (d < day) return 0.9;  // today
  if (d < 3 * day) return 0.7;
  if (d < 7 * day) return 0.5;
  return 0.2;
}
function normalizeEffort(x) {
  // estimateMinutes or points (1..8)
  const n = Number(x);
  if (!Number.isFinite(n)) return 0.4;
  if (n > 60) return 0.9;
  if (n > 30) return 0.7;
  if (n > 15) return 0.5;
  return 0.2;
}
function toTime(x) {
  const t = x ? new Date(x).getTime() : NaN;
  return Number.isFinite(t) ? t : null;
}
function toNum(x, d) {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
}
function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}
