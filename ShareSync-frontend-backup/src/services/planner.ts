// Merges calendar + due-soon tasks + optional AI suggestions into a simple "Today" plan.
import client from "../api/client";
import { askAssistant } from "./assistant.ts";

export type PlanBlock = {
  start: string; // ISO
  end: string;   // ISO
  label: string;
  type?: "meeting" | "focus" | "break" | "task";
};

export type Outcome = {
  title: string;
  projectId?: string | null;
  projectName?: string | null;
  from?: "ai" | "tasks" | "calendar";
};

export type TodayPlan = {
  outcomes: Outcome[];
  blocks: PlanBlock[];
  tasksDueToday: any[];
  eventsToday: any[];
  suggestedFocusTask?: any | null;
  generatedAt: number;
};

function isoAt(h: number, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export async function getTodayPlan(opts: { userId?: string; projectId?: string | null; includeAI?: boolean } = {}): Promise<TodayPlan> {
  const { includeAI = true } = opts;

  // 1) Try aggregated endpoint first (if your backend has it)
  try {
    const res = await client.get("/api/planner/today", { params: { includeAI } });
    if (res?.data) return normalizePlan(res.data);
  } catch {/* fall through */}

  // 2) Fallback: fetch due-today tasks + today's events separately
  const [tasks, events] = await Promise.all([
    fetchTasksDueToday().catch(() => []),
    fetchEventsToday().catch(() => []),
  ]);

  // 3) Build naive blocks from events, with 2 focus blocks by default
  const blocks: PlanBlock[] = [
    { start: isoAt(9, 0),  end: isoAt(11, 0), label: "Deep work", type: "focus" },
    ...events.map((e: any) => ({
      start: e.start?.dateTime || e.start || isoAt(12),
      end: e.end?.dateTime || e.end || isoAt(13),
      label: e.title || e.summary || "Meeting",
      type: "meeting",
    })),
    { start: isoAt(14, 0), end: isoAt(16, 0), label: "Deep work", type: "focus" },
  ];

  // 4) Outcomes = top 3 due-soon task titles; if AI requested, ask for improved phrasing
  let outcomes: Outcome[] = (tasks || [])
    .slice(0, 3)
    .map((t: any) => ({ title: t.title || t.name || "Task", projectId: t.projectId || null, projectName: t.projectName || null, from: "tasks" }));

  if (includeAI) {
    try {
      const ai = await suggestTopOutcomes({ tasks, events });
      if (ai && ai.length) outcomes = ai;
    } catch {/* keep fallback */}
  }

  // 5) Suggested focus task = first due task
  const suggestedFocusTask = tasks?.[0] || null;

  return {
    outcomes,
    blocks,
    tasksDueToday: tasks,
    eventsToday: events,
    suggestedFocusTask,
    generatedAt: Date.now(),
  };
}

export async function suggestTopOutcomes(payload: { tasks: any[]; events?: any[]; projectId?: string | null }): Promise<Outcome[]> {
  // Use your Assistant if available; fallback to top 3 task titles.
  try {
    const text = await askForOutcomesWithAssistant(payload);
    const parsed = parseBullets(text);
    if (parsed.length) return parsed.map((t) => ({ title: t, from: "ai" }));
  } catch {/* ignore */}
  return (payload.tasks || []).slice(0, 3).map((t: any) => ({
    title: t.title || t.name || "Task",
    projectId: t.projectId || null,
    projectName: t.projectName || null,
    from: "tasks",
  }));
}

async function fetchTasksDueToday(): Promise<any[]> {
  // Try common variants
  try {
    const r = await client.get("/api/tasks", { params: { due: "today", status: "open" } });
    return Array.isArray(r?.data) ? r.data : (r?.data?.items || []);
  } catch {}
  try {
    const r = await client.get("/api/tasks/due-today");
    return Array.isArray(r?.data) ? r.data : (r?.data?.items || []);
  } catch {}
  return [];
}

async function fetchEventsToday(): Promise<any[]> {
  try {
    const r = await client.get("/api/calendar/events", { params: { range: "today" } });
    return Array.isArray(r?.data) ? r.data : (r?.data?.items || []);
  } catch {}
  try {
    const r = await client.get("/api/calendar/today");
    return Array.isArray(r?.data) ? r.data : (r?.data?.items || []);
  } catch {}
  return [];
}

async function askForOutcomesWithAssistant(payload: { tasks: any[]; events?: any[]; projectId?: string | null }): Promise<string> {
  const prompt = [
    "You are a planning assistant. Given today's tasks and meetings, propose the top 3 concrete outcomes for today.",
    "Output as 3 bullet points, concise, action-oriented. No preamble, no numbering other than hyphen bullets.",
    "",
    "Tasks:",
    ...(payload.tasks || []).slice(0, 10).map((t: any, i: number) => `- ${t.title || t.name || "Task"}${t.dueDate ? ` (due ${new Date(t.dueDate).toDateString()})` : ""}`),
    "",
    "Meetings:",
    ...(payload.events || []).slice(0, 5).map((e: any) => `- ${e.title || e.summary || "Meeting"} ${e.start ? `@ ${new Date(e.start).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}` : ""}`),
  ].join("\n");

  const res = await askAssistant({
    scope: "planner",
    projectId: payload.projectId || undefined,
    items: (payload.tasks || []).slice(0, 20),
    instruction: prompt,
  });

  if (!res?.ok) throw new Error(res?.message || "Assistant failed");
  return String(res?.text || "");
}

function parseBullets(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function normalizePlan(data: any): TodayPlan {
  const blocks: PlanBlock[] = Array.isArray(data.blocks)
    ? data.blocks.map((b: any) => ({ start: b.start, end: b.end, label: b.label, type: b.type || "focus" }))
    : [];
  const outcomes: Outcome[] = Array.isArray(data.outcomes)
    ? data.outcomes.map((o: any) => ({ title: o.title, projectId: o.projectId ?? null, projectName: o.projectName ?? null, from: o.from || "ai" }))
    : [];
  return {
    outcomes,
    blocks,
    tasksDueToday: data.tasksDueToday || [],
    eventsToday: data.eventsToday || [],
    suggestedFocusTask: data.suggestedFocusTask || null,
    generatedAt: Number(data.generatedAt || Date.now()),
  };
}
