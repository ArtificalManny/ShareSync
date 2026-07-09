import React, { useMemo, useState } from "react";
import { X, Calendar, Flag, Loader2, AlertCircle, AlignLeft, Clock, Target, CheckCircle2, AlertTriangle } from "lucide-react";
import { createMilestone } from "../../api/milestones";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeErrMessage(msg) {
  // Nest/validation sometimes returns message: string | string[]
  if (Array.isArray(msg)) return msg.join(" • ");
  if (typeof msg === "string") return msg;
  return "";
}

const STATUS_OPTIONS = [
  {
    value: "planned",
    label: "Planned",
    icon: Clock,
    className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/25 dark:bg-violet-500/10 dark:text-violet-200",
  },
  {
    value: "in_progress",
    label: "In Progress",
    icon: Target,
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/25 dark:bg-blue-500/10 dark:text-blue-200",
  },
  {
    value: "completed",
    label: "Completed",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-200",
  },
  {
    value: "at_risk",
    label: "At Risk",
    icon: AlertTriangle,
    className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-200",
  },
];

export default function AddMilestoneModal({ projectId, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState("planned");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const canSave = useMemo(() => {
    return title.trim().length >= 2 && !!projectId && !saving;
  }, [title, projectId, saving]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!canSave) return;

    setSaving(true);
    setErr("");

    try {
      // ✅ Only send fields that exist in the milestone create/update contract
      // - title (required)
      // - projectId (added by createMilestone helper)
      // - description (optional)
      // - targetDate (optional, must be IsDateString => YYYY-MM-DD is safest)
      // - status (optional enum)
      await createMilestone(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate || undefined,
        status,
      });

      window.dispatchEvent(new CustomEvent("milestones:refresh"));
      onClose?.();
    } catch (error) {
      const msg =
        normalizeErrMessage(error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create milestone";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="roadmap-create-milestone-clean-labels-v1 roadmap-add-milestone-contrast-final-v9 roadmap-add-milestone-modal-contrast-v1 roadmap-add-milestone-final-readable-v7 roadmap-create-milestone-modal-v2 roadmap-create-milestone-modal fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-md">
        <style>{`
          /* roadmap-create-milestone-clean-labels-v1 */
          .roadmap-create-milestone-clean-labels-v1 .roadmap-field-label-plain-v1 {
            display: inline-flex !important;
            width: auto !important;
            max-width: max-content !important;
            padding: 0 !important;
            margin: 0 0 0.5rem 0 !important;
            background: transparent !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            color: rgb(71, 85, 105) !important;
            -webkit-text-fill-color: rgb(71, 85, 105) !important;
            text-shadow: none !important;
            opacity: 1 !important;
          }

          .dark .roadmap-create-milestone-clean-labels-v1 .roadmap-field-label-plain-v1 {
            color: rgba(255, 255, 255, 0.92) !important;
            -webkit-text-fill-color: rgba(255, 255, 255, 0.92) !important;
            text-shadow: 0 1px 12px rgba(0, 0, 0, 0.55) !important;
          }
        `}</style>





      <style className="roadmap-create-final-button-visibility-style">
        {`
          .roadmap-create-milestone-modal-v2 button.roadmap-create-hard-purple-button,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-hard-purple-button:disabled,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-hard-purple-button[disabled],
          .roadmap-create-milestone-modal button.roadmap-create-hard-purple-button,
          .roadmap-create-milestone-modal button.roadmap-create-hard-purple-button:disabled,
          .roadmap-create-milestone-modal button.roadmap-create-hard-purple-button[disabled],
          .roadmap-create-milestone-modal-v2 button.roadmap-create-force-visible-button-v2,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-force-visible-button-v2:disabled,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-force-visible-button-v2[disabled],
          .roadmap-create-milestone-modal-v2 button.roadmap-create-button,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-button:disabled,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-button[disabled] {
            background-color: #7c3aed !important;
            background-image: linear-gradient(135deg, #a855f7 0%, #7c3aed 46%, #5b21b6 Available) !important;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            opacity: 1 !important;
            filter: none !important;
            mix-blend-mode: normal !important;
            border: 1px solid rgba(221, 214, 254, 0.96) !important;
            box-shadow:
              0 18px 42px rgba(109, 40, 217, 0.46),
              inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
            text-shadow: 0 1px 8px rgba(0, 0, 0, 0.28) !important;
          }

          .roadmap-create-milestone-modal-v2 button.roadmap-create-hard-purple-button *,
          .roadmap-create-milestone-modal button.roadmap-create-hard-purple-button *,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-force-visible-button-v2 *,
          .roadmap-create-milestone-modal-v2 button.roadmap-create-button * {
            color: #ffffff !important;
            stroke: #ffffff !important;
            fill: none !important;
            -webkit-text-fill-color: #ffffff !important;
            opacity: 1 !important;
            filter: none !important;
            mix-blend-mode: normal !important;
          }

          .roadmap-create-milestone-modal-v2 button.roadmap-create-hard-purple-button:hover:not(:disabled),
          .roadmap-create-milestone-modal button.roadmap-create-hard-purple-button:hover:not(:disabled),
          .roadmap-create-milestone-modal-v2 button.roadmap-create-force-visible-button-v2:hover:not(:disabled),
          .roadmap-create-milestone-modal-v2 button.roadmap-create-button:hover:not(:disabled) {
            transform: translateY(-1px) !important;
            background-image: linear-gradient(135deg, #9333ea 0%, #6d28d9 48%, #4c1d95 Available) !important;
            box-shadow:
              0 22px 50px rgba(109, 40, 217, 0.54),
              inset 0 1px 0 rgba(255, 255, 255, 0.36) !important;
          }
        `}
      </style>
      <style className="roadmap-create-button-inline-visibility-v3-style">
        {`
          .roadmap-create-hard-purple-button,
          .roadmap-create-hard-purple-button span,
          .roadmap-create-hard-purple-button svg,
          .roadmap-create-hard-purple-button * {
            color: #ffffff !important;
            stroke: #ffffff !important;
            opacity: 1 !important;
          }

          .roadmap-create-hard-purple-button:disabled {
            opacity: 0.92 !important;
            cursor: not-allowed !important;
          }

          .roadmap-create-hard-purple-button:hover:not(:disabled) {
            filter: brightness(1.04) saturate(1.08);
            transform: translateY(-1px);
          }
        `}
      </style>
      <style className="roadmap-create-button-visibility-v2-style">
        {`
          .roadmap-create-force-visible-button-v2 {
            position: relative !important;
            isolation: isolate !important;
            overflow: hidden !important;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 Available) !important;
            color: #ffffff !important;
            opacity: 1 !important;
            border: 1px solid rgba(221, 214, 254, 0.92) !important;
            box-shadow:
              0 16px 36px rgba(109, 40, 217, 0.40),
              inset 0 1px 0 rgba(255, 255, 255, 0.30) !important;
            text-shadow: 0 1px 8px rgba(0, 0, 0, 0.24) !important;
          }

          .roadmap-create-force-visible-button-v2:hover:not(:disabled) {
            transform: translateY(-1px) !important;
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 Available) !important;
            box-shadow:
              0 20px 44px rgba(109, 40, 217, 0.48),
              inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
          }

          .roadmap-create-force-visible-button-v2:disabled {
            background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed Available) !important;
            color: #ffffff !important;
            opacity: 0.88 !important;
            cursor: not-allowed !important;
            box-shadow:
              0 12px 28px rgba(109, 40, 217, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.26) !important;
          }

          .roadmap-create-force-visible-button-v2,
          .roadmap-create-force-visible-button-v2 span,
          .roadmap-create-force-visible-button-v2 svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
            opacity: 1 !important;
          }
        `}
      </style>
      <style className="roadmap-create-modal-visual-style">
        {`
          .roadmap-create-milestone-modal > div {
            border-color: rgba(124, 58, 237, 0.18) !important;
            box-shadow:
              0 34px 110px rgba(15, 23, 42, 0.30),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .roadmap-create-milestone-modal > div {
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 34px 120px rgba(0, 0, 0, 0.58),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .roadmap-create-milestone-modal footer,
          .roadmap-create-milestone-modal [class*="sticky"][class*="bottom"] {
            background:
              linear-gradient(180deg, rgba(248, 250, 252, 0.82), rgba(226, 232, 240, 0.74)) !important;
            border-color: rgba(148, 163, 184, 0.20) !important;
            backdrop-filter: blur(20px);
          }

          .dark .roadmap-create-milestone-modal footer,
          .dark .roadmap-create-milestone-modal [class*="sticky"][class*="bottom"] {
            background:
              linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.82)) !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
          }

          .roadmap-create-button {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 Available) !important;
            color: #ffffff !important;
            border-color: rgba(221, 214, 254, 0.88) !important;
            box-shadow:
              0 16px 36px rgba(109, 40, 217, 0.36),
              inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
            opacity: 1 !important;
          }

          .roadmap-create-button:hover:not(:disabled) {
            transform: translateY(-1px);
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 Available) !important;
            box-shadow:
              0 20px 44px rgba(109, 40, 217, 0.44),
              inset 0 1px 0 rgba(255, 255, 255, 0.30) !important;
          }

          .roadmap-create-button:disabled {
            background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed Available) !important;
            color: #ffffff !important;
            opacity: 0.82 !important;
            cursor: not-allowed !important;
            box-shadow:
              0 12px 28px rgba(109, 40, 217, 0.24),
              inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
          }

          .roadmap-create-button,
          .roadmap-create-button span,
          .roadmap-create-button svg {
            color: #ffffff !important;
            opacity: 1 !important;
            text-shadow: 0 1px 8px rgba(0, 0, 0, 0.22);
          }
        `}
      </style>
      {/* Backdrop */}
      <button
        className="absolute inset-0 cursor-default"
        onClick={() => onClose?.()}
        aria-label="Close"
      />

      {/* Modal */}
      <div className="relative flex max-h-[calc(100vh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] dark:border-white/[0.08] dark:bg-[#101827]">
        {/* Soft surface atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.95),rgba(255,255,255,0.78)_35%,rgba(139,92,246,0.045)_Available)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.12),rgba(15,23,42,0)_58%)]" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-300/10 blur-3xl dark:bg-violet-500/10" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl dark:bg-cyan-500/10" />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20">
                <Flag className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
                  Roadmap
                </p>
                <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                  Create Milestone
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onClose?.()}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-white/45 dark:hover:bg-white/[0.06] dark:hover:text-white"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {/* Title */}
            <div>
              <label className="roadmap-field-label-plain-v1 block text-xs font-black uppercase tracking-[0.16em]">Title</label>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. MVP Demo, Beta Launch, Sprint 1 Finish"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/35 dark:focus:border-violet-400/40 dark:focus:ring-violet-500/15"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/45">
                <AlignLeft className="h-4 w-4 text-slate-400 dark:text-violet-100" />
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this milestone..."
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/35 dark:focus:border-violet-400/40 dark:focus:ring-violet-500/15"
              />
            </div>

            {/* Target Date */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/45">
                <Calendar className="h-4 w-4 text-slate-400 dark:text-violet-100" />
                Target date
                <span className="font-medium tracking-normal text-slate-400 dark:text-violet-100">
                  optional
                </span>
              </label>

              <input
                type="date"
                value={targetDate}
                min={todayISO()}
                onChange={(e) => setTargetDate(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:focus:border-violet-400/40 dark:focus:ring-violet-500/15"
              />
            </div>

            {/* Status */}
            <div>
              <label className="roadmap-field-label-plain-v1 block text-xs font-black uppercase tracking-[0.16em]">Status</label>

              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STATUS_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = status === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      className={`flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? option.className
                          : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/45 dark:hover:bg-white/[0.07] dark:hover:text-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {err && (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{err}</span>
              </div>
            )}

            {/* Actions */}
            <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-6 pt-5 pb-1 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#101827]/95">
              <button
                type="button"
                onClick={() => onClose?.()}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950 dark:text-white/45 dark:hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!canSave}
                className={`roadmap-create-hard-purple-button roadmap-create-force-visible-button-v2 roadmap-create-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                  canSave
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/35"
                    : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-white/[0.08] dark:text-violet-100"
                }`}
              
                style={{
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 Available)",
                  color: "#ffffff",
                  opacity: 1,
                  border: "1px solid rgba(221, 214, 254, 0.92)",
                  boxShadow:
                    "0 16px 36px rgba(109, 40, 217, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.30)",
                  textShadow: "0 1px 8px rgba(0, 0, 0, 0.24)",
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                Create Milestone
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
