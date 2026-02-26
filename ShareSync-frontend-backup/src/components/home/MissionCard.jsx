// src/components/home/MissionCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v3.1 - Ship Ceremony Audit
// UPGRADED: Added active:scale-95 to the Ship container so the action feels 
// like a physical button press before the ceremony begins.
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Clock, ChevronRight, CheckCircle2, Rocket } from "lucide-react";
import { ShipButton, ShippableCard } from "../ship";
import useShipCeremony, { PHASES } from "../../hooks/useShipCeremony";
import { tryShipProject } from "../../api/home";

export default function MissionCard({ project, onClick, onShipped }) {
  const { ship, phase, isItemShipping, isItemShipped } = useShipCeremony({
    onShip: async (projectId) => {
      const result = await tryShipProject(projectId);
      if (result === null) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    },
    onComplete: (projectId) => {
      onShipped?.(projectId);
    },
    broadcastToTeam: true,
  });

  const projectId = project?.id || project?._id;
  const isThisShipping = isItemShipping(projectId);
  const isThisShipped = isItemShipped(projectId);
  const currentPhase = isThisShipping || isThisShipped ? phase : PHASES.IDLE;

  const getProgressFillClass = (percentage) => {
    if (percentage >= 100) return "bg-emerald-500";
    if (percentage >= 67) return "bg-violet-400";
    if (percentage >= 34) return "bg-violet-500";
    return "bg-violet-600";
  };

  const handleShip = (e) => {
    e.stopPropagation();
    ship(project);
  };

  const progressValue = project.velocity ?? project.health ?? 0;

  return (
    <ShippableCard phase={phase} isThisItem={isThisShipping || isThisShipped}>
      <div
        onClick={() => onClick?.(project)}
        className={`
          group relative p-4 rounded-xl cursor-pointer
          bg-white border border-slate-200/60
          hover:border-violet-200/60 hover:shadow-md
          transition-all duration-200
        `}
      >
        <div className="flex items-center gap-4">
          {/* ZONE 1 */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                transition-all duration-300
                ${
                  isThisShipped
                    ? "bg-emerald-50 text-emerald-500"
                    : isThisShipping
                    ? "bg-violet-50 text-violet-600"
                    : "bg-slate-50 group-hover:bg-violet-50 group-hover:scale-110 group-hover:text-violet-600 text-slate-400"
                }
              `}
            >
              {isThisShipped ? (
                <CheckCircle2 strokeWidth={1.5} className="w-5 h-5" />
              ) : isThisShipping ? (
                <Rocket strokeWidth={1.5} className="w-5 h-5 animate-pulse" />
              ) : (
                <span className="text-lg transition-colors duration-300">{project.emoji || "◎"}</span>
              )}
            </div>

            <div className="min-w-0">
              <h4
                className={`
                  text-sm font-semibold truncate transition-colors leading-tight
                  ${
                    isThisShipped
                      ? "text-slate-400 line-through"
                      : "text-slate-800 group-hover:text-violet-600"
                  }
                `}
              >
                {project.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-400">
                <Clock strokeWidth={1.5} className="w-3 h-3 relative -top-[0.5px]" />
                <span>{project.eta}</span>
                <span className="opacity-50">·</span>
                <span>{project.category}</span>
              </div>
            </div>
          </div>

          {/* ZONE 2 */}
          <div className="hidden sm:flex items-center gap-3 w-32">
            <div className="flex-1">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`
                    h-full rounded-full
                    transition-all duration-500 ease-out
                    ${getProgressFillClass(progressValue)}
                  `}
                  style={{ width: `${Math.min(progressValue, 100)}%` }}
                />
              </div>
            </div>
            <span
              className={`
                text-xs font-bold w-8 text-right
                ${progressValue >= 100 ? "text-emerald-600" : "text-slate-500"}
              `}
            >
              {progressValue}%
            </span>
          </div>

          {/* ZONE 3: Ship Button container gets physical press physics */}
          <div className="flex items-center gap-2 shrink-0 active:scale-95 transition-transform duration-75">
            <ShipButton onClick={handleShip} phase={currentPhase} size="sm" />
            <ChevronRight
              strokeWidth={1.5}
              className="
                w-4 h-4 text-slate-300
                opacity-0 group-hover:opacity-100
                transition-opacity duration-200 ml-1
              "
            />
          </div>
        </div>
      </div>
    </ShippableCard>
  );
}
