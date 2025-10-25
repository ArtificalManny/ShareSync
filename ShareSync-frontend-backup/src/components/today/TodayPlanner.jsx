import React, { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../ui/Card.jsx";
import SectionHeader from "../ui/SectionHeader.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { PlayCircle, RefreshCcw, CalendarDays, Clock, Target } from "lucide-react";
import { getTodayPlan, suggestTopOutcomes } from "../../services/planner.ts";
import { createTask } from "../../api/tasks";
import "../../styles/today.css";
import { track } from "../../utils/telemetry";
import { toast } from "../ui/Toaster.jsx";

function fmtTime(d) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function TodayPlanner({ userId = "me", projectId = null }) {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  // local completion state for the 3 outcomes
  const [completed, setCompleted] = useState({}); // { idx: true }

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = await getTodayPlan({ userId, projectId, includeAI: true });
      setPlan(p || null);
      setCompleted({});
      try { track("todayplanner_loaded", { hasEvents: !!(p?.eventsToday?.length), hasTasks: !!(p?.tasksDueToday?.length) }); } catch {}
    } catch (e) {
      setError(e?.message || "Could not load plan for today.");
    } finally {
      setLoading(false);
    }
  }, [userId, projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const outcomes = useMemo(() => (plan?.outcomes || []).slice(0, 3), [plan?.outcomes]);

  const toggleOutcome = (idx) => {
    setCompleted((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const startSprint = () => {
    try { track("todayplanner_start_sprint"); } catch {}
    try {
      window.dispatchEvent(new CustomEvent("start-tenx-sprint", { detail: { projectId } }));
    } catch {}
  };

  const createOutcomeTasks = async () => {
    if (!Array.isArray(outcomes) || outcomes.length === 0) return;
    const created = [];
    for (const o of outcomes) {
      try {
        const dueDate = new Date(); // today
        const payload = { title: o.title, dueDate, projectId: o.projectId || projectId || undefined };
        const res = await createTask(o.projectId || projectId, payload);
        created.push(res);
      } catch (e) {
        // continue
      }
    }
    try {
      toast({ title: "Added to tasks", description: `${created.length} outcome${created.length === 1 ? "" : "s"} created.` });
      track("todayplanner_outcomes_inserted", { count: created.length });
    } catch {}
  };

  const regenerate = async () => {
    if (!plan) return refresh();
    try {
      const ai = await suggestTopOutcomes({
        tasks: plan.tasksDueToday || [],
        events: plan.eventsToday || [],
        projectId,
      });
      setPlan((prev) => ({ ...(prev || {}), outcomes: ai || [] }));
      setCompleted({});
      track?.("todayplanner_regenerated");
    } catch (e) {
      toast?.({ title: "Couldn’t regenerate", description: e?.message || "Try again.", variant: "error" });
    }
  };

  if (loading) {
    return (
      <Card className="today-card" role="region" aria-label="Today planner" aria-busy="true">
        <div className="today-head">
          <div className="today-title">
            <CalendarDays className="w-4 h-4" />
            Plan my day
          </div>
        </div>
        <div className="today-skeleton" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="today-card">
        <div className="today-head">
          <div className="today-title">
            <CalendarDays className="w-4 h-4" />
            Plan my day
          </div>
        </div>
        <EmptyState
          icon="🗓️"
          title="Couldn’t load your plan"
          primary={{ label: "Retry", onClick: refresh }}
        >
          {String(error)}
        </EmptyState>
      </Card>
    );
  }

  if (!plan || (!plan.tasksDueToday?.length && !plan.eventsToday?.length && !outcomes.length)) {
    return (
      <Card className="today-card">
        <div className="today-head">
          <div className="today-title">
            <CalendarDays className="w-4 h-4" />
            Plan my day
          </div>
          <div className="today-actions">
            <button className="today-ghost" onClick={refresh} aria-label="Refresh plan">
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
        <EmptyState
          icon="✨"
          title="Nothing urgent today"
          primary={{ label: "Start a 25:00", onClick: startSprint }}
        >
          Create a task or add due dates to see suggestions here.
        </EmptyState>
      </Card>
    );
  }

  return (
    <Card className="today-card" role="region" aria-label="Today planner">
      <div className="today-head">
        <div className="today-title">
          <CalendarDays className="w-4 h-4" />
          Plan my day
        </div>
        <div className="today-actions">
          <button className="today-ghost" onClick={regenerate} title="Regenerate with AI">
            <RefreshCcw className="w-4 h-4" />
            Regenerate
          </button>
          <button className="today-primary" onClick={startSprint} title="Start a 25:00 focus sprint">
            <PlayCircle className="w-4 h-4" />
            Start 25:00
          </button>
        </div>
      </div>

      {/* Top 3 Outcomes */}
      <div className="today-section">
        <SectionHeader icon="Target">Top 3 outcomes</SectionHeader>
        <ul className="today-outcomes">
          {outcomes.map((o, idx) => (
            <li key={idx} className={`today-outcome ${completed[idx] ? "is-done" : ""}`}>
              <label className="today-check">
                <input
                  type="checkbox"
                  checked={!!completed[idx]}
                  onChange={() => toggleOutcome(idx)}
                  aria-label={`Mark outcome ${idx + 1} as done`}
                />
                <span className="today-bullet" />
              </label>
              <span className="today-outcome-text">{o.title}</span>
              {o.projectName ? <span className="today-chip">#{o.projectName}</span> : null}
            </li>
          ))}
        </ul>
        <div className="today-row-end">
          <button className="today-ghost" onClick={createOutcomeTasks} title="Insert as tasks">
            Insert to tasks
          </button>
        </div>
      </div>

      {/* Time blocks */}
      <div className="today-section">
        <SectionHeader icon="Clock">Time blocks</SectionHeader>
        <div className="today-blocks">
          {(plan.blocks || []).map((b, i) => (
            <div key={i} className={`today-block type-${b.type || "focus"}`}>
              <div className="today-block-time">
                {fmtTime(b.start)} — {fmtTime(b.end)}
              </div>
              <div className="today-block-label">
                {b.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
