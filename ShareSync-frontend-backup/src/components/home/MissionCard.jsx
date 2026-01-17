// src/components/home/MissionCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v3.0 - PHASE 7: Visual Cohesion + Ship Ceremony
// ═══════════════════════════════════════════════════════════════════════════════
// 
// PROGRESS BAR FIX:
// - No longer uses red/green "traffic light" colors
// - Uses purple intensity based on completion percentage
// - 100% complete = teal celebration
//
// 3-ZONE PATTERN + SHIP CEREMONY
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Clock, ChevronRight, CheckCircle2, Rocket } from "lucide-react";
import { ShipButton, ShippableCard } from "../ship";
import useShipCeremony, { PHASES } from "../../hooks/useShipCeremony";

export default function MissionCard({ project, onClick, onShipped }) {
  // Ship ceremony hook
  const { ship, phase, isItemShipping, isItemShipped } = useShipCeremony({
    onShip: async (projectId) => {
      // TODO: Replace with your actual API call
      await new Promise(resolve => setTimeout(resolve, 800));
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

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 7 FIX: Progress color based on completion, NOT health status
  // Uses purple intensity, not red/green emotional signals
  // ═══════════════════════════════════════════════════════════════════════════
  const getProgressFillClass = (percentage) => {
    if (percentage >= 100) return 'bg-success';      // Teal celebration
    if (percentage >= 67) return 'bg-brand-400';     // Bright purple
    if (percentage >= 34) return 'bg-brand';         // Standard purple
    return 'bg-brand-700';                           // Darker purple
  };

  const handleShip = (e) => {
    e.stopPropagation();
    ship(project);
  };

  // Use velocity for progress display (or health if velocity isn't available)
  const progressValue = project.velocity ?? project.health ?? 0;

  return (
    <ShippableCard
      phase={phase}
      isThisItem={isThisShipping || isThisShipped}
    >
      <div 
        onClick={() => onClick?.(project)}
        className={`
          group relative p-4 rounded-xl cursor-pointer
          bg-surface-1 border border-white/[0.06]
          hover:bg-surface-2 hover:border-white/[0.1]
          transition-all duration-200
        `}
      >
        <div className="flex items-center gap-4">
          
          {/* ═══════════════════════════════════════════════════════════════════
              ZONE 1: Identity (What is this?)
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Icon */}
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center shrink-0
              transition-all duration-300
              ${isThisShipped 
                ? 'bg-success/10' 
                : isThisShipping 
                  ? 'bg-brand/20' 
                  : 'bg-surface-2 group-hover:bg-brand/10'
              }
            `}>
              {isThisShipped ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : isThisShipping ? (
                <Rocket className="w-4 h-4 text-brand animate-pulse" />
              ) : (
                <span className="text-lg">{project.emoji || '◎'}</span>
              )}
            </div>

            {/* Title + Meta */}
            <div className="min-w-0">
              <h4 className={`
                text-sm font-medium truncate transition-colors
                ${isThisShipped 
                  ? 'text-text-tertiary line-through' 
                  : 'text-text-primary group-hover:text-brand'
                }
              `}>
                {project.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-tertiary">
                <Clock className="w-3 h-3" />
                <span>{project.eta}</span>
                <span className="opacity-50">·</span>
                <span>{project.category}</span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              ZONE 2: Status (Progress bar + percentage)
              PHASE 7: Purple intensity, NOT red/green
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="hidden sm:flex items-center gap-3 w-32">
            {/* Progress Track */}
            <div className="flex-1">
              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
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
            {/* Percentage */}
            <span className={`
              text-xs font-medium w-8 text-right
              ${progressValue >= 100 ? 'text-success' : 'text-text-secondary'}
            `}>
              {progressValue}%
            </span>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              ZONE 3: Action (Ship button + chevron)
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 shrink-0">
            <ShipButton
              onClick={handleShip}
              phase={currentPhase}
              size="sm"
            />

            <ChevronRight className="
              w-4 h-4 text-text-tertiary
              opacity-0 group-hover:opacity-100
              transition-opacity duration-200
            " />
          </div>
        </div>
      </div>
    </ShippableCard>
  );
}
