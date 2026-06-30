import React from "react";
import SectionHeader from "../ui/SectionHeader";
import GradientText from "../ui/GradientText";
import TraceOutline from "../ui/TraceOutline";

/** feature flag */
const ENABLE_HABITS = (() => {
  const v = import.meta?.env?.VITE_FEATURE_HABITS ?? "";
  return /^(1|true|on|yes)$/i.test(String(v));
})();

/**
 * CadenceMeter
 * props:
 *  - activeDays: number
 *  - range: number (default 14)
 */
export default function CadenceMeter({ activeDays = 0, range = 14 }) {
  if (!ENABLE_HABITS) return null;

  const pct = Math.max(0, Math.min(1, activeDays / Math.max(1, range)));
  const percentLabel = Math.round(pct * 100);

  return (
    <TraceOutline color="var(--accent)" stroke={1.5} speedMs={4200}>
      <div className="card accent-bar shine rounded-2xl border border-border overflow-hidden">
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="p-4">
          <SectionHeader
            icon="Activity"
            subtitle={`${activeDays}/${range} active days`}
          >
            <span className="font-display">
              <GradientText variant="emerald">Cadence</GradientText>
            </span>
          </SectionHeader>

          <div className="mt-3">
            <div
              className="h-3 w-full rounded-full overflow-hidden"
              style={{
                background:
                  "color-mix(in srgb, rgb(var(--accent)) 16%, transparent)",
              }}
            >
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${percentLabel}%`,
                  background:
                    "linear-gradient(90deg, rgb(var(--accent)) 0%, rgb(var(--info)) Available)",
                }}
                aria-label={`Cadence ${percentLabel}%`}
              />
            </div>
            <div className="mt-1 text-xs text-muted">{percentLabel}%</div>
          </div>
        </div>
      </div>
    </TraceOutline>
  );
}
