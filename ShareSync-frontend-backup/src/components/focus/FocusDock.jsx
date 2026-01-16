// src/components/focus/FocusDock.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// Dock has: 1) Timer  2) Play/Pause  3) Complete/Cancel
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Play, Pause, X, Check } from "lucide-react";
import { track } from "../../utils/telemetry";

/* ─────────────────────────────────────────────────────────────────────────
   ICON BUTTON
───────────────────────────────────────────────────────────────────────── */
function IconBtn({ label, onClick, variant = "default", children }) {
  const variants = {
    default: "bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary",
    success: "bg-success/10 hover:bg-success/20 text-success",
    danger: "bg-surface-2 hover:bg-danger/10 text-text-tertiary hover:text-danger",
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`
        w-8 h-8 rounded-lg flex items-center justify-center
        transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand
        ${variants[variant]}
      `}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
export default function FocusDock(props = {}) {
  const {
    status = "idle",
    remainingSeconds = 25 * 60,
    project,
    start,
    pause,
    resume,
    cancel,
    complete,
  } = props;

  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const ss = String(Math.floor(remainingSeconds % 60)).padStart(2, "0");

  // Idle state - just show start button
  if (status === "idle") {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]">
        <button
          onClick={() => {
            track("focus_start_clicked", { source: "dock", minutes: 25 });
            start && start(25);
          }}
          className="
            px-5 py-2.5 rounded-full
            bg-brand text-white text-sm font-medium
            hover:bg-brand-600 hover:shadow-glow-brand
            transition-all
          "
        >
          Start 25:00
        </button>
      </div>
    );
  }

  // Active/Paused state - show full dock
  return (
    <div className="
      fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]
      px-4 py-2 rounded-full
      bg-surface-1/95 backdrop-blur-xl
      border border-white/[0.08]
      shadow-2xl
      flex items-center gap-3
    ">
      {/* Project name (optional) */}
      {project?.name && (
        <span className="text-xs text-text-tertiary hidden sm:inline max-w-[14ch] truncate">
          {project.name}
        </span>
      )}

      {/* Element 1: Timer */}
      <span className="font-semibold tabular-nums text-lg text-text-primary">
        {mm}:{ss}
      </span>

      {/* Element 2: Play/Pause */}
      {status === "running" ? (
        <IconBtn
          label="Pause focus"
          onClick={() => {
            track("focus_paused");
            pause && pause();
          }}
        >
          <Pause className="w-4 h-4" />
        </IconBtn>
      ) : (
        <IconBtn
          label="Resume focus"
          onClick={() => {
            track("focus_resumed");
            resume && resume();
          }}
        >
          <Play className="w-4 h-4" />
        </IconBtn>
      )}

      {/* Element 3a: Complete */}
      <IconBtn
        label="Complete session"
        variant="success"
        onClick={() => {
          track("focus_completed");
          complete && complete();
        }}
      >
        <Check className="w-4 h-4" />
      </IconBtn>

      {/* Element 3b: Cancel */}
      <IconBtn
        label="Cancel session"
        variant="danger"
        onClick={() => {
          track("focus_canceled");
          cancel && cancel();
        }}
      >
        <X className="w-4 h-4" />
      </IconBtn>
    </div>
  );
}
