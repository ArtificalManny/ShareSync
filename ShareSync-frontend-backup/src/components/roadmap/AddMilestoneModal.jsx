import React, { useMemo, useState } from "react";
import { X, Calendar, Flag, Loader2 } from "lucide-react";
import { createMilestone } from "../../api/milestones";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AddMilestoneModal({ projectId, onClose }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const canSave = useMemo(() => title.trim().length >= 2 && !!projectId && !saving, [title, projectId, saving]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!canSave) return;

    setSaving(true);
    setErr("");

    try {
      // Minimal + safe payload (backend can ignore fields it doesn't use)
      await createMilestone(projectId, {
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: "planned",
        order: Date.now(),
      });

      // Tell RoadmapPanel to refetch
      window.dispatchEvent(new CustomEvent("milestones:refresh"));
      onClose?.();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create milestone";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/60"
        onClick={() => onClose?.()}
        aria-label="Close"
      />

      {/* Modal */}
      <div className="relative w-[92vw] max-w-[520px] rounded-2xl border border-white/[0.10] bg-surface-1 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-brand-300" />
            <h3 className="text-base font-semibold text-text-primary">Create Milestone</h3>
          </div>

          <button
            onClick={() => onClose?.()}
            className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-text-tertiary">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MVP Demo, Beta Launch, Sprint 1 Finish"
              className="
                mt-2 w-full px-3 py-2 rounded-xl
                bg-surface-2 border border-white/[0.10]
                text-text-secondary
                focus:outline-none focus:ring-2 focus:ring-brand-500/30
              "
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-text-tertiary flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Due date (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              min={todayISO()}
              onChange={(e) => setDueDate(e.target.value)}
              className="
                mt-2 w-full px-3 py-2 rounded-xl
                bg-surface-2 border border-white/[0.10]
                text-text-secondary
                focus:outline-none focus:ring-2 focus:ring-brand-500/30
              "
            />
          </div>

          {err && (
            <div className="p-3 rounded-xl bg-error-500/10 border border-error-500/15 text-sm text-error-200">
              {err}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onClose?.()}
              className="
                px-4 py-2 rounded-xl
                bg-surface-2 border border-white/[0.10]
                text-text-secondary text-sm
                hover:bg-surface-1 transition-colors
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSave}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-xl
                text-sm font-medium text-white
                transition-colors
                ${canSave ? "bg-brand-500 hover:bg-brand-400" : "bg-white/[0.10] text-white/40"}
              `}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
