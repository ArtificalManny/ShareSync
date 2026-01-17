// src/components/home/MissionCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 6: Ship Ceremony Integration
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ZONE PATTERN + SHIP CEREMONY
//
// The "Deploy" button is now a ceremonial moment:
// 1. Click → Button transforms to "Shipping..."
// 2. Card gets subtle glow
// 3. Satisfying "thunk" sound plays
// 4. Card slides off screen
// 5. Team sees "🚀 Manny shipped X" in their feed
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Clock, ChevronRight, CheckCircle2, Rocket } from "lucide-react";
import { ShipButton, ShippableCard } from "../ship";
import useShipCeremony, { PHASES } from "../../hooks/useShipCeremony";

export default function MissionCard({ project, onClick, onShipped }) {
  // Ship ceremony hook - orchestrates the entire experience
  const { ship, phase, isItemShipping, isItemShipped } = useShipCeremony({
    onShip: async (projectId) => {
      // TODO: Replace with your actual API call
      // await api.shipProject(projectId);
      
      // Simulating API call for now
      await new Promise(resolve => setTimeout(resolve, 800));
    },
    onComplete: (projectId) => {
      // Notify parent to remove from list
      onShipped?.(projectId);
    },
    broadcastToTeam: true, // Send socket event to team
  });

  const projectId = project?.id || project?._id;
  const isThisShipping = isItemShipping(projectId);
  const isThisShipped = isItemShipped(projectId);
  const currentPhase = isThisShipping || isThisShipped ? phase : PHASES.IDLE;

  // Health determines the progress bar color
  const getProgressColor = (health) => {
    if (health > 80) return 'bg-success';
    if (health > 50) return 'bg-warning';
    return 'bg-danger';
  };

  const handleShip = (e) => {
    e.stopPropagation();
    ship(project);
  };

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
              ZONE 2: Status (How is it going?)
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="hidden sm:flex items-center gap-3 w-32">
            <div className="flex-1">
              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(project.health)}`}
                  style={{ width: `${project.health}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-medium text-text-secondary w-8 text-right">
              {project.velocity}%
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
