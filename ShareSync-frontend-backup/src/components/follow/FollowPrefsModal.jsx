// src/components/follow/FollowPrefsModal.jsx
import React, { useEffect } from "react";
import { X } from "lucide-react";
import FollowPrefsForm from "./FollowPrefsForm";

export default function FollowPrefsModal({
  open,
  onClose,
  projectId,
  projectName,
  initialPreferences = null,
  onSaved,
}) {
  useEffect(() => {
    if (!open) return;

    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      onMouseDown={(e) => {
        // click outside to close
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-slate-900/70 border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <div className="text-sm text-slate-400">Follow Preferences</div>
            <div className="text-lg font-bold text-white">
              {projectName || "Project"}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-200" />
          </button>
        </div>

        <div className="p-5">
          <FollowPrefsForm
            projectId={projectId}
            initialPreferences={initialPreferences}
            onCancel={onClose}
            onSaved={(prefs) => {
              onSaved?.(prefs);
              onClose?.();
            }}
          />
        </div>
      </div>
    </div>
  );
}
