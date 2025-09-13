import React from "react";
import SectionHeader from "../ui/SectionHeader";
import TraceOutline from "../ui/TraceOutline";

/**
 * CadenceMeter
 * props:
 *  - activeDays: number
 *  - range: number (default 14)
 */
export default function CadenceMeter({ activeDays = 0, range = 14 }) {
  const pct = Math.max(0, Math.min(1, activeDays / Math.max(1, range)));
  const percentLabel = Math.round(pct * 100);

  return (
    <TraceOutline color="var(--accent)" stroke={1.5} speedMs={4200}>
      <div className="card accent-bar shine rounded-2xl border border-border overflow-hidden">
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="p-4">
          <SectionHeader icon="Activity" subtitle={`${activeDays}/${range} active days`}>
            Cadence
          </SectionHeader>

          <div className="mt-3">
            <div className="h-3 w-full rounded-full bg-[color-mix(in_srgb,var(--accent-50)_60%,transparent)] overflow-hidden">
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${percentLabel}%`,
                  background:
                    "linear-gradient(90deg, var(--accent) 0%, var(--info) 100%)",
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
