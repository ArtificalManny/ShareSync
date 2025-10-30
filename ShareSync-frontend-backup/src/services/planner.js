// src/services/planner.js
import client from "../api/client";
import { askAssistant } from "./assistant";

function isoAt(h, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export async function getTodayPlan(opts = {}) {
  const { includeAI = true } = opts;

  // 1) Try aggregated endpoint
  try {
    const res = await client.get("/api/planner/today", { params: { includeAI } });
    if (res?.data) return normalizePlan(res.data);
  } catch {}

  // 2) Fallback: fetch tasks + events
  const [tasks, events] = await Promise.all([
    fetchTasksDueToday().catch(() => []),
    fetchEventsToday().catch(() => []),
  ]);

  // 3) Build blocks
  const blocks = [
    { start: isoAt(9, 0), end: isoAt(11, 0), label: "Deep work", type: "focus" },
    ...events.map((e) => ({
      start: e.start?.dateTime || e.start || isoAt(12),
      end: e.end?.dateTime || e.end || isoAt(13),
      label: e.title || e.summary || "Meeting",
      type: "meeting",
    })),
    { start: isoAt(14, 0), end: isoAt(16, 0), label: "Deep work", type: "focus" },
  ];

  // 4) Outcomes
  let outcomes = (tasks || [])
    .slice(0, 3)
    .map((t) => ({
      title: t.title || t.name || "Task",
      projectId: t.projectId || null,
      projectName: t.projectName || null,
      from: "tasks",
    }));

  if (includeAI) {
    try {
      const ai = await suggestTopOutcomes({ tasks, events });
      if (ai && ai.length) outcomes = ai;
    } catch {}
  }

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

export async function suggestTopOutcomes(payload) {
  try {
    const text = await askForOutcomesWithAssistant(payload);
    const parsed = parseBullets(text);
    if (parsed.length) return parsed.map((t) => ({ title: t, from: "ai" }));
  } catch {}
  return (payload.tasks || []).slice(0, 3).map((t) => ({
    title: t.title || t.name || "Task",
    projectId: t.projectId || null,
    projectName: t.projectName || null,
    from: "tasks",
  }));
}

async function fetchTasksDueToday() {
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

async function fetchEventsToday() {
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

async function askForOutcomesWithAssistant(payload) {
  const prompt = [
    "You are a planning assistant. Given today's tasks and meetings, propose the top 3 concrete outcomes for today.",
    "Output as 3 bullet points, concise, action-oriented. No preamble, no numbering other than hyphen bullets.",
    "",
    "Tasks:",
    ...(payload.tasks || []).slice(0, 10).map((t, i) => `- ${t.title || t.name || "Task"}${t.dueDate ? ` (due ${new Date(t.dueDate).toDateString()})` : ""}`),
    "",
    "Meetings:",
    ...(payload.events || []).slice(0, 5).map((e) => `- ${e.title || e.summary || "Meeting"} ${e.start ? `@ ${new Date(e.start).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}` : ""}`),
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

function parseBullets(text) {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function normalizePlan(data) {
  const blocks = Array.isArray(data.blocks)
    ? data.blocks.map((b) => ({ start: b.start, end: b.end, label: b.label, type: b.type || "focus" }))
    : [];
  const outcomes = Array.isArray(data.outcomes)
    ? data.outcomes.map((o) => ({ title: o.title, projectId: o.projectId ?? null, projectName: o.projectName ?? null, from: o.from || "ai" }))
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