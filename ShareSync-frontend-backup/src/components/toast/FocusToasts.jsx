import React from "react";
import { Play } from "lucide-react";
import { track } from "../../utils/telemetry";

/**
 * FocusToasts
 * Listens to a window event and shows a small toast:
 *   window.dispatchEvent(new CustomEvent('ss:focus-started', { detail: { userName, projectId, projectName } }))
 *
 * Props:
 * - onJoin?: (projectId: string) => void
 * - durationMs?: number (default 5500)
 * - max?: number (default 3)
 */
export default function FocusToasts({ onJoin, durationMs = 5500, max = 3 }) {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    const onStart = (e) => {
      const detail = e?.detail || {};
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => {
        const next = [{ id, ...detail }, ...prev].slice(0, max);
        track("focus_toast_seen", {
          projectId: detail.projectId,
          projectName: detail.projectName,
        });
        return next;
      });
      // auto dismiss
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        durationMs
      );
    };
    window.addEventListener("ss:focus-started", onStart);
    return () => window.removeEventListener("ss:focus-started", onStart);
  }, [durationMs, max]);

  if (!toasts.length) return null;

  return (
    <div className="fixed right-4 bottom-4 z-[70] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-xl border border-white/10 bg-[rgba(8,12,24,.92)] text-xs shadow-[0_8px_50px_rgba(0,0,0,.45)] px-3 py-2 flex items-center gap-3"
        >
          <div
            className="h-6 w-6 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)",
            }}
          />
          <div className="min-w-0">
            <div className="font-medium truncate">
              {t.userName || "Someone"} started focus
            </div>
            <div className="opacity-70 truncate">
              {t.projectName ? `on ${t.projectName}` : "— join to help"}
            </div>
          </div>
          <button
            className="ml-2 rounded-md px-2 py-1 text-[11px] text-white border border-white/12"
            style={{
              background:
                "linear-gradient(90deg,var(--action-primary,#4f46e5),var(--accent-aqua,#22d3ee))",
            }}
            onClick={() => {
              track("focus_join_clicked", { projectId: t.projectId });
              onJoin && onJoin(t.projectId);
            }}
            title="Join focus"
          >
            <span className="inline-flex items-center gap-1">
              <Play size={12} /> Join
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
