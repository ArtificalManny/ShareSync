import React from "react";
import { CheckCircle2, Clock, AlertTriangle, TimerReset } from "lucide-react";
import "../../styles/chips.css";

/**
 * StateChip
 * Compact, contrast-safe chip to show scheduleState.
 *
 * Props:
 *  - state: 'early'|'on_time'|'late'|'at_risk'
 *  - className?: string
 *  - ariaLabel?: string (override)
 */
export default function StateChip({ state, className = "", ariaLabel }) {
  if (!state) return null;

  const map = {
    early: {
      label: "Early",
      icon: CheckCircle2,
      cls: "chip--early",
    },
    on_time: {
      label: "On time",
      icon: Clock,
      cls: "chip--ontime",
    },
    late: {
      label: "Late",
      icon: AlertTriangle,
      cls: "chip--late",
    },
    at_risk: {
      label: "At risk",
      icon: TimerReset,
      cls: "chip--atrisk",
    },
  };

  const cfg = map[state] || map.on_time;
  const Icon = cfg.icon;

  return (
    <span
      className={`chip ${cfg.cls} ${className}`}
      role="status"
      aria-label={ariaLabel || `Schedule state: ${cfg.label}`}
      title={cfg.label}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="chip__text">{cfg.label}</span>
    </span>
  );
}
