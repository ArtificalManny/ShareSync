// src/components/today/TodayPlanner.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// Outcomes: 1) Checkbox  2) Title  3) Project tag
// Time blocks: 1) Time  2) Label  3) Type indicator
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Card, { CardBadge } from "../common/Card";
import { PlayCircle, RefreshCcw, CalendarDays, Clock, Target, Check } from "lucide-react";
import { getTodayPlan, suggestTopOutcomes } from "../../services/planner.ts";
import { createTask } from "../../api/tasks";
import { track } from "../../utils/telemetry";
import { toast } from "../ui/Toaster.jsx";

function fmtTime(d) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/* ─────────────────────────────────────────────────────────────────────────
   OUTCOME ITEM - 3 Element Rule
───────────────────────────────────────────────────────────────────────── */
function OutcomeItem({ outcome, completed, onToggle, index }) {
  return (
    <div 
      className={`
        flex items-center gap-3 p-3 rounded-lg
        ${completed ? 'bg-success/5' : 'bg-surface-2'}
        transition-colors
      `}
    >
      {/* Element 1: Checkbox */}
      <button
        onClick={onToggle}
        className={`
          w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0
          transition-all
          ${completed 
            ? 'bg-success border-success text-white' 
            : 'border-surface-3 hover:border-brand'
          }
        `}
        aria-label={`Mark outcome ${index + 1} as done`}
      >
        {completed && <Check className="w-3 h-3" />}
      </button>
      
      {/* Element 2: Title */}
      <span className={`
        flex-1 text-sm
        ${completed ? 'text-text-tertiary line-through' : 'text-text-primary'}
      `}>
        {outcome.title}
      </span>
      
      {/* Element 3: Project tag (optional) */}
      {outcome.projectName && (
        <CardBadge variant="default">#{outcome.projectName}</CardBadge>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   TIME BLOCK - 3 Element Rule
───────────────────────────────────────────────────────────────────────── */
function TimeBlock({ block }) {
  const typeStyles = {
    focus: 'border-l-brand bg-brand/5',
    meeting: 'border-l-warning bg-warning/5',
    break: 'border-l-success bg-success/5',
    default: 'border-l-text-tertiary bg-surface-2',
  };
  
  const style = typeStyles[block.type] || typeStyles.default;
  
  return (
    <div className={`p-3 rounded-lg border-l-2 ${style}`}>
      {/* Element 1: Time */}
      <div className="text-xs text-text-tertiary mb-1">
        {fmtTime(block.start)} — {fmtTime(block.end)}
      </div>
      {/* Element 2: Label */}
      <div className="text-sm font-medium text-text-primary">
        {block.label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────────────────────────────────── */
function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-text-tertiary" />
      <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
        {children}
      </h4>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
export default function TodayPlanner({ userId = "me", projectId = null }) {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState({});

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
        const dueDate = new Date();
        const payload = { title: o.title, dueDate, projectId: o.projectId || projectId || undefined };
        const res = await createTask(o.projectId || projectId, payload);
        created.push(res);
      } catch (e) {}
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
      toast?.({ title: "Couldn't regenerate", description: e?.message || "Try again.", variant: "error" });
    }
  };

  const isEmpty = !plan || (!plan.tasksDueToday?.length && !plan.eventsToday?.length && !outcomes.length);

  // Loading State
  if (loading) {
    return (
      <Card variant="ambient" padding="none" role="region" aria-label="Today planner" aria-busy="true">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-brand" />
            <span className="text-sm font-semibold text-text-primary">Plan my day</span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="h-12 rounded-lg bg-surface-2 animate-pulse" />
          <div className="h-12 rounded-lg bg-surface-2 animate-pulse" />
          <div className="h-12 rounded-lg bg-surface-2 animate-pulse" />
        </div>
      </Card>
    );
  }

  // Error State
  if (error) {
    return (
      <Card variant="ambient" padding="none">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-brand" />
            <span className="text-sm font-semibold text-text-primary">Plan my day</span>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="text-3xl mb-2">🗓️</div>
          <p className="text-sm font-medium text-text-secondary mb-1">Couldn't load your plan</p>
          <p className="text-xs text-text-tertiary mb-4">{error}</p>
          <button 
            onClick={refresh}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm hover:bg-brand-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  // Empty State
  if (isEmpty) {
    return (
      <Card variant="ambient" padding="none">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-brand" />
            <span className="text-sm font-semibold text-text-primary">Plan my day</span>
          </div>
          <button 
            onClick={refresh}
            className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
        <div className="p-8 text-center">
          <div className="text-3xl mb-2">✨</div>
          <p className="text-sm font-medium text-text-secondary mb-1">Nothing urgent today</p>
          <p className="text-xs text-text-tertiary mb-4">Create a task or add due dates to see suggestions here.</p>
          <button 
            onClick={startSprint}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm hover:bg-brand-600 transition-colors"
          >
            Start a 25:00
          </button>
        </div>
      </Card>
    );
  }

  // Main Content
  return (
    <Card variant="ambient" padding="none" role="region" aria-label="Today planner">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-brand" />
          <span className="text-sm font-semibold text-text-primary">Plan my day</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={regenerate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Regenerate
          </button>
          <button 
            onClick={startSprint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-brand text-white hover:bg-brand-600 transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Start 25:00
          </button>
        </div>
      </div>

      {/* Top 3 Outcomes */}
      <div className="p-4 border-b border-white/[0.06]">
        <SectionTitle icon={Target}>Top 3 outcomes</SectionTitle>
        <div className="space-y-2">
          {outcomes.map((o, idx) => (
            <OutcomeItem
              key={idx}
              outcome={o}
              index={idx}
              completed={!!completed[idx]}
              onToggle={() => toggleOutcome(idx)}
            />
          ))}
        </div>
        <button 
          onClick={createOutcomeTasks}
          className="mt-3 text-xs text-text-tertiary hover:text-brand transition-colors"
        >
          Insert to tasks
        </button>
      </div>

      {/* Time Blocks */}
      {plan.blocks && plan.blocks.length > 0 && (
        <div className="p-4">
          <SectionTitle icon={Clock}>Time blocks</SectionTitle>
          <div className="space-y-2">
            {plan.blocks.map((b, i) => (
              <TimeBlock key={i} block={b} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
