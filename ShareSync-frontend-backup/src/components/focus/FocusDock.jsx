import React from "react";
import { Play, Pause, X, Check } from "lucide-react";
import { track } from "../../utils/telemetry";
import Card from "../ui/Card.jsx";

/**
 * FocusDock
 * Sticky, minimal focus controller.
 *
 * Props (all optional; works with your future FocusContext or direct props):
 * - status: "idle" | "running" | "paused"
 * - remainingSeconds: number (defaults 25:00)
 * - project: { id, name } (optional context)
 * - start(minutes?: number)
 * - pause()
 * - resume()
 * - cancel()
 * - complete()
 */
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

  if (status === "idle") {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]">
        <button
          className="rounded-full px-5 py-2 text-sm font-medium text-white shadow-[0_0_24px_rgba(88,128,255,.45)]"
          style={{
            background:
              "linear-gradient(90deg,var(--action-primary,#4f46e5),var(--accent-aqua,#22d3ee))",
          }}
          onClick={() => {
            track("focus_start_clicked", { source: "dock", minutes: 25 });
            start && start(25);
          }}
        >
          Start 25:00
        </button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 flex items-center gap-3 rounded-full glass-strong border border-white/10 shadow-[0_6px_40px_rgba(0,0,0,.35)]">
      {project?.name ? (
        <span className="text-xs text-muted hidden sm:inline max-w-[14ch] truncate">
          {project.name}
        </span>
      ) : null}

      <span className="font-semibold tabular-nums text-lg">{mm}:{ss}</span>

      {status === "running" ? (
        <IconBtn
          label="Pause focus"
          onClick={() => {
            track("focus_paused");
            pause && pause();
          }}
        >
          <Pause size={16} />
        </IconBtn>
      ) : (
        <IconBtn
          label="Resume focus"
          onClick={() => {
            track("focus_resumed");
            resume && resume();
          }}
        >
          <Play size={16} />
        </IconBtn>
      )}

      <IconBtn
        label="Complete session"
        onClick={() => {
          track("focus_completed");
          complete && complete();
        }}
      >
        <Check size={16} />
      </IconBtn>

      <IconBtn
        label="Cancel session"
        onClick={() => {
          track("focus_canceled");
          cancel && cancel();
        }}
      >
        <X size={16} />
      </IconBtn>
    </Card>
  );
}

function IconBtn({ label, onClick, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="rounded-md border border-white/10 bg-white/5 hover:bg-white/10 p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
    >
      {children}
    </button>
  );
}
