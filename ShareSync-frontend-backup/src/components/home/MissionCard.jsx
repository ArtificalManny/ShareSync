// src/components/home/MissionCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Quiet Confidence"
// ═══════════════════════════════════════════════════════════════════════════════
// RULES APPLIED:
// 1. Surface hierarchy: surface-1 base, surface-2 on hover
// 2. ONE accent color (brand) - only on the action button
// 3. Text hierarchy: primary → secondary → tertiary
// 4. Glows are EARNED through interaction, not resting state
// 5. 3-element rule: Title, Status, Action - that's it
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Target, Clock, Zap, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";

export default function MissionCard({ project, onClick }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'deploying' | 'shipped'

  const handleDeploy = (e) => {
    e.stopPropagation();
    setStatus('deploying');
    setTimeout(() => setStatus('shipped'), 2000);
  };

  // Simplified health indicator - just the color, no noise
  const getHealthStyle = (score) => {
    if (score > 80) return "text-success bg-success/10";
    if (score > 50) return "text-warning bg-warning/10";
    return "text-danger bg-danger/10";
  };

  const isShipped = status === 'shipped';
  const isDeploying = status === 'deploying';

  return (
    <div 
      onClick={() => onClick(project)}
      className={`
        group relative p-5 rounded-xl cursor-pointer
        transition-all duration-200 ease-out
        
        /* Surface hierarchy */
        bg-surface-1 
        hover:bg-surface-2
        
        /* Border - subtle, strengthens on hover */
        border border-white/[0.06]
        hover:border-white/[0.12]
        
        /* Glow is EARNED - only on hover */
        hover:shadow-[0_0_0_1px_rgba(139,92,246,0.1)]
        
        /* Shipped state - quiet, done */
        ${isShipped ? 'opacity-60' : ''}
      `}
    >
      {/* ─────────────────────────────────────────────────────────────────────
          LAYOUT: Clean horizontal flow
          Zone 1 (left): Identity - icon + title + meta
          Zone 2 (right): Status + Action
      ───────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-6">
        
        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 1: Identity
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-4 min-w-0">
          
          {/* Icon - quiet until hover, celebrates on ship */}
          <div className={`
            w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0
            transition-all duration-200
            ${isShipped 
              ? 'bg-success/10' 
              : 'bg-surface-2 group-hover:bg-brand/10'
            }
          `}>
            {isShipped ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <Target className="w-5 h-5 text-text-tertiary group-hover:text-brand transition-colors" />
            )}
          </div>

          {/* Title + Meta */}
          <div className="min-w-0">
            {/* Title - primary text, truncate if needed */}
            <h4 className="text-sm font-semibold text-text-primary truncate">
              {project.title}
            </h4>
            
            {/* Meta row - secondary/tertiary text */}
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-xs text-text-tertiary">
                <Clock className="w-3 h-3" />
                {project.eta}
              </span>
              <span className="text-text-tertiary/50">·</span>
              <span className="text-xs text-text-tertiary">
                {project.category}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 2: Status + Action
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-4 flex-shrink-0">
          
          {/* Health Badge - semantic color, earned not decorative */}
          <div className={`
            hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium
            ${getHealthStyle(project.health)}
          `}>
            <span>{project.health}%</span>
          </div>

          {/* Velocity - tertiary importance */}
          <div className="hidden md:block text-right">
            <div className="text-sm font-semibold text-text-primary">
              {project.velocity}%
            </div>
            <div className="text-[10px] text-text-tertiary uppercase tracking-wider">
              Velocity
            </div>
          </div>

          {/* Action Button - THE brand moment */}
          <button 
            onClick={handleDeploy}
            disabled={status !== 'idle'}
            className={`
              px-4 py-2 rounded-lg text-xs font-semibold
              transition-all duration-200
              
              ${status === 'idle' ? `
                bg-brand text-white
                hover:bg-brand-600
                hover:shadow-glow-brand
              ` : status === 'deploying' ? `
                bg-surface-2 text-text-tertiary cursor-wait
              ` : `
                bg-success/10 text-success
              `}
            `}
          >
            {status === 'idle' && (
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                Deploy
              </span>
            )}
            {isDeploying && (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Deploying
              </span>
            )}
            {isShipped && "Shipped"}
          </button>

          {/* Chevron - appears on hover */}
          <ChevronRight className="
            w-4 h-4 text-text-tertiary
            opacity-0 group-hover:opacity-100
            -translate-x-1 group-hover:translate-x-0
            transition-all duration-200
          " />
        </div>
      </div>
    </div>
  );
}
