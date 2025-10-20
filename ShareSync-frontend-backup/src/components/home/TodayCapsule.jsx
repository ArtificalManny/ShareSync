import React from "react";
import { Play } from "lucide-react";
import Card from "../ui/Card.jsx";
import { track } from "../../utils/telemetry";

/**
 * TodayCapsule
 * A single, opinionated next step for the user.
 *
 * Props:
 * - action: {
 *     title: string,             // e.g., "Finish onboarding flow"
 *     projectName?: string,      // optional context
 *     eta?: string,              // "~45m" or "Fri 2:30p"
 *     hint?: string,             // short 'why' copy
 *   }
 * - onStart?: () => void         // called when user starts
 * - onDismiss?: () => void       // optional
 */
export default function TodayCapsule({
  action = {
    title: "Pick your next outcome",
    hint: "Prioritize the smallest outcome that moves the project.",
  },
  onStart,
  onDismiss,
}) {
  return (
    <Card className="relative overflow-hidden border border-white/10 rounded-2xl p-4 bg-[rgba(255,255,255,.75)] dark:bg-[rgba(8,12,24,.85)]">
      {/* subtle animated gradient rim */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "radial-gradient(1200px 200px at 20% -40%, rgba(91,116,255,.18), rgba(255,255,255,0) 60%), radial-gradient(900px 200px at 90% 140%, rgba(44,221,255,.12), rgba(255,255,255,0) 60%)",
        }}
      />
      <div className="flex items-center justify-between gap-3 relative">
        <div className="min-w-0">
          <div className="text-sm opacity-70 mb-0.5">Next best action</div>
          <h3 className="text-base font-semibold truncate">
            {action.title}
            {action.projectName ? (
              <span className="opacity-70 font-normal">
                {" "}
                · {action.projectName}
              </span>
            ) : null}
          </h3>
          <div className="mt-1 text-xs opacity-70">
            {action.eta ? <>ETA {action.eta} · </> : null}
            {action.hint || "Stay small. Ship something observable today."}
          </div>
        </div>

        <button
          className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-white shadow-[0_0_24px_rgba(88,128,255,.45)]"
          style={{
            background:
              "linear-gradient(90deg,var(--action-primary,#4f46e5),var(--accent-aqua,#22d3ee))",
          }}
          onClick={() => {
            track("today_capsule_action_started");
            onStart && onStart();
          }}
        >
          <span className="inline-flex items-center gap-1">
            <Play size={14} />
            Start
          </span>
        </button>
      </div>

      {onDismiss && (
        <button
          className="absolute right-3 bottom-3 text-[11px] opacity-70 hover:opacity-100 underline underline-offset-2"
          onClick={() => {
            track("today_capsule_dismissed");
            onDismiss();
          }}
        >
          Not today
        </button>
      )}
    </Card>
  );
}
