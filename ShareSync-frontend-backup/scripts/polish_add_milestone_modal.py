#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/components/roadmap/AddMilestoneModal.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

NEW_FILE = """import React, { useMemo, useState } from "react";
import { X, Calendar, Flag, Loader2, AlertCircle } from "lucide-react";
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

export default function AddMilestoneModal({ projectId, onClose }) {
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
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
      // ✅ Only send fields that exist in CreateMilestoneDto
      // - title (required)
      // - projectId (added by createMilestone helper)
      // - targetDate (optional, must be IsDateString => YYYY-MM-DD is safest)
      // - status (optional enum)
      await createMilestone(projectId, {
        title: title.trim(),
        targetDate: targetDate || undefined,
        status: "planned",
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-md">
      {/* Backdrop */}
      <button
        className="absolute inset-0 cursor-default"
        onClick={() => onClose?.()}
        aria-label="Close"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] dark:border-white/[0.08] dark:bg-[#101827]">
        {/* Soft surface atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.95),rgba(255,255,255,0.78)_35%,rgba(139,92,246,0.045)_100%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.12),rgba(15,23,42,0)_58%)]" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-300/10 blur-3xl dark:bg-violet-500/10" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl dark:bg-cyan-500/10" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/[0.06]">
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

          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/45">
                Title
              </label>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. MVP Demo, Beta Launch, Sprint 1 Finish"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/35 dark:focus:border-violet-400/40 dark:focus:ring-violet-500/15"
                autoFocus
              />
            </div>

            {/* Target Date */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/45">
                <Calendar className="h-4 w-4 text-slate-400 dark:text-white/35" />
                Target date
                <span className="font-medium tracking-normal text-slate-400 dark:text-white/30">
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

            {err && (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{err}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-white/[0.06]">
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
                className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                  canSave
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/35"
                    : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-white/[0.08] dark:text-white/30"
                }`}
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
"""


def fail(message):
    print(f"\\n[polish_add_milestone_modal] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[polish_add_milestone_modal] starting")

    if not TARGET.exists():
        fail(f"Could not find {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_before = [
        "AddMilestoneModal",
        "createMilestone",
        "title.trim()",
        "targetDate",
        'status: "planned"',
        "milestones:refresh",
        "Create Milestone",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    if "shadow-[0_24px_80px_rgba(15,23,42,0.24)]" in source and "text-slate-950" in source:
        print("[polish_add_milestone_modal] modal already appears polished")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-polish-add-milestone-modal-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[polish_add_milestone_modal] backup created: {backup}")

    TARGET.write_text(NEW_FILE, encoding="utf-8")
    print(f"[polish_add_milestone_modal] patched: {TARGET}")

    updated = TARGET.read_text(encoding="utf-8")

    required_after = [
        "AddMilestoneModal",
        "createMilestone",
        "targetDate",
        'status: "planned"',
        "milestones:refresh",
        "text-slate-950",
        "bg-violet-600",
        "Create Milestone",
        "Cancel",
    ]

    for marker in required_after:
        if marker not in updated:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "Create Milestone|text-slate-950|bg-violet-600|targetDate|status: \\"planned\\"|milestones:refresh|shadow-\\[0_24px_80px" src/components/roadmap/AddMilestoneModal.jsx -C 5')
    print("  git diff -- src/components/roadmap/AddMilestoneModal.jsx")


if __name__ == "__main__":
    main()
