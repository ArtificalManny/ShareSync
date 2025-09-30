import React, { useEffect, useMemo, useState, useId } from "react";
import { AlertCircle, ArrowRight, Brain, CalendarDays, Eye, X } from "lucide-react";
import useMentor from "../../hooks/useMentor";
import NudgeCard from "./NudgeCard";
import "../../styles/mentor.css";
import { toast } from "../ui/Toaster.jsx";
import { track } from "../../utils/telemetry";
import { focusTaskById } from "../../utils/focusTask";

/**
 * CoachPanel
 * Inline assistance card for ProjectHome.
 *
 * Props:
 *  - projectId (required)
 *  - mentor?: object from useMentor (optional; if omitted, this component will call useMentor itself)
 *  - onViewAtRisk?: () => void   (e.g. navigate to Tasks filtered by risk)
 *  - onAdjustPlan?: () => void   (e.g. open scheduler)
 *  - className?: string
 *
 * Safe usage:
 *  Prefer calling useMentor in ProjectHome and passing it in as {mentor} to keep a single source of truth.
 *  If you don’t pass mentor, this component will call useMentor(projectId) unconditionally.
 */
export default function CoachPanel({ projectId, mentor: externalMentor, onViewAtRisk, onAdjustPlan, className = "" }) {
  // Always call hooks in the same order; if no external mentor, instantiate one locally.
  const internalMentor = useMentor(projectId);
  const m = externalMentor || internalMentor;

  const {
    loading,
    error,
    weeklyDone,
    forecast,
    suggestions,
    atRiskTasks,
    refetch,
  } = m || {};

  const [dismissed, setDismissed] = useState(false);
  const panelId = useId().replace(/:/g, "");
  const containerRef = React.useRef(null);

  // Track first visible impression
  const shownOnceRef = React.useRef(false);
  useEffect(() => {
    if (!shownOnceRef.current && !loading && !error && projectId) {
      shownOnceRef.current = true;
      try {
        track("mentor_nudge_shown", {
          projectId,
          suggestionCount: suggestions?.length || 0,
          riskCount: atRiskTasks?.length || 0,
        });
      } catch {}
    }
  }, [loading, error, projectId, suggestions?.length, atRiskTasks?.length]);

  // Focus the panel when it becomes ready (a11y)
  useEffect(() => {
    if (!loading && !error && containerRef.current) {
      try { containerRef.current.focus(); } catch {}
    }
  }, [loading, error]);

  if (dismissed || !projectId) return null;

  const projectedDate = forecast?.projectedCompletionDate
    ? new Date(forecast.projectedCompletionDate).toLocaleDateString()
    : null;
  const confidence = typeof forecast?.confidence === "number" ? Math.round(forecast.confidence * 100) : null;
  const riskCount = Array.isArray(atRiskTasks) ? atRiskTasks.length : 0;

  const onDismiss = () => {
    setDismissed(true);
    try { track("mentor_dismissed", { projectId }); } catch {}
  };

  const onPanelKeyDown = (e) => {
    if (e.key === "Escape" && !e.defaultPrevented) {
      e.preventDefault();
      onDismiss();
    }
  };

  const viewRisk = () => {
    try { track("mentor_nudge_clicked", { projectId, action: "view_at_risk" }); } catch {}
    if (typeof onViewAtRisk === "function") onViewAtRisk();
    else toast({ title: "Showing at-risk tasks…", variant: "info" });
  };

  const adjustPlan = () => {
    try { track("mentor_nudge_clicked", { projectId, action: "adjust_plan" }); } catch {}
    if (typeof onAdjustPlan === "function") onAdjustPlan();
    else toast({ title: "Open planner to adjust schedule", variant: "info" });
  };

  const header = useMemo(() => {
    if (loading) return "Analyzing velocity…";
    if (error) return "Mentor unavailable";
    return "Mentor recommendations";
  }, [loading, error]);

  return (
    <section
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={onPanelKeyDown}
      className={`mentor-panel rounded-2xl border border-border bg-surface p-4 hover-raise ${className}`}
      aria-labelledby={`coach-title-${panelId}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          <h3 id={`coach-title-${panelId}`} className="text-sm font-semibold text-text">
            {header}
          </h3>
        </div>
        <button
          className="btn btn--ghost press-shrink"
          onClick={onDismiss}
          aria-label="Dismiss mentor panel"
        >
          <X className="w-5 h-5 text-muted" />
        </button>
      </div>

      {/* Meta line */}
      <div className="mt-2 text-xs text-muted">
        {loading && "Fetching velocity and forecast…"}
        {error && (
          <span className="inline-flex items-center gap-1 text-rose-700">
            <AlertCircle className="w-3 h-3" /> {String(error)}
          </span>
        )}
        {!loading && !error && (
          <>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="w-3 h-3" />
              <span>
                Weekly completion rate: <strong>{weeklyDone ?? 0}/wk</strong>
              </span>
            </span>
            {projectedDate ? (
              <span className="ml-3">
                Projected completion: <strong>{projectedDate}</strong>
                {typeof confidence === "number" ? ` (${confidence}% conf.)` : ""}
              </span>
            ) : null}
          </>
        )}
      </div>

      {/* Suggestions / Actions */}
      {!loading && !error && (
        <>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Primary CTA card */}
            <NudgeCard
              kind="task"
              title="Review at-risk tasks"
              message={
                riskCount > 0
                  ? `${riskCount} task${riskCount > 1 ? "s are" : " is"} trending at risk. Let’s triage.`
                  : "No tasks are currently flagged as at risk. Great job keeping pace!"
              }
              actions={[
                ...(riskCount > 0
                  ? [{ label: "View at-risk", onClick: viewRisk }]
                  : []),
                { label: "Adjust plan", onClick: adjustPlan },
                { label: "Refresh", onClick: () => refetch?.() },
              ]}
              onDismiss={onDismiss}
            />

            {/* Extra suggestions list */}
            {Array.isArray(suggestions) && suggestions.length > 0 ? (
              <div className="space-y-2">
                {suggestions.slice(0, 3).map((sug, i) => {
                  // Build context-aware actions: prefer focusing a task if taskId present
                  const actions = [];
                  if (sug?.taskId) {
                    actions.push({
                      label: "Go to task",
                      onClick: () => {
                        try {
                          track("mentor_nudge_clicked", {
                            projectId,
                            action: "go_to_task",
                            suggestionId: sug.id || null,
                            taskId: sug.taskId,
                          });
                        } catch {}
                        const ok = focusTaskById(sug.taskId);
                        if (!ok) toast({ title: "Couldn't locate task in view.", variant: "warning" });
                      },
                    });
                  } else if (sug?.cta) {
                    actions.push({
                      label: sug.cta.label || "Open",
                      onClick: () => {
                        try {
                          track("mentor_nudge_clicked", {
                            projectId,
                            action: "suggestion_cta",
                            suggestionId: sug.id || null,
                          });
                        } catch {}
                        toast({ title: sug.cta.label || "Open", variant: "info" });
                      },
                    });
                  }

                  return (
                    <NudgeCard
                      key={sug.id || i}
                      kind={sug.type === "schedule" ? "sprint" : "custom"}
                      title={sug.title || "Suggestion"}
                      message={sug.reason || sug.body || ""}
                      actions={actions}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-3 text-xs text-muted">
                No additional suggestions at the moment.
              </div>
            )}
          </div>

          {/* Footer help */}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
            <Eye className="w-3 h-3" />
            Mentor is a preview feature using recent velocity to estimate delivery and risk.
            <a
              className="inline-flex items-center gap-1 text-brand underline ml-1"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                track("mentor_nudge_clicked", { projectId, action: "learn_more" });
                toast({ title: "Mentor uses recent completion rate to forecast pace.", variant: "info" });
              }}
            >
              Learn more <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </>
      )}
    </section>
  );
}
