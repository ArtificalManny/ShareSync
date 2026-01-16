// src/components/home/MissionCardSkeleton.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Quiet Confidence"
// ═══════════════════════════════════════════════════════════════════════════════
// Skeleton that EXACTLY matches MissionCard layout to prevent layout shift.
// Uses the same surface hierarchy and spacing.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';

// Inline skeleton primitive - no external dependency
const Shimmer = ({ className = '', width, height }) => (
  <div 
    className={`
      relative overflow-hidden rounded
      bg-surface-2
      ${className}
    `}
    style={{ width, height }}
  >
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
  </div>
);

const MissionCardSkeleton = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className="p-5 rounded-xl bg-surface-1 border border-white/[0.06]"
        >
          {/* Match exact layout of MissionCard */}
          <div className="flex items-center justify-between gap-6">
            
            {/* ZONE 1: Identity */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Icon placeholder - 44px to match w-11 h-11 */}
              <Shimmer className="rounded-lg flex-shrink-0" width="44px" height="44px" />

              {/* Title + Meta */}
              <div className="space-y-2">
                <Shimmer width="160px" height="16px" />
                <div className="flex items-center gap-2">
                  <Shimmer width="60px" height="12px" />
                  <div className="w-1 h-1 rounded-full bg-surface-3" />
                  <Shimmer width="70px" height="12px" />
                </div>
              </div>
            </div>

            {/* ZONE 2: Status + Action */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Health badge */}
              <Shimmer className="hidden sm:block rounded-md" width="50px" height="24px" />
              
              {/* Velocity */}
              <div className="hidden md:block space-y-1 text-right">
                <Shimmer width="40px" height="16px" />
                <Shimmer width="50px" height="10px" />
              </div>

              {/* Action button */}
              <Shimmer className="rounded-lg" width="90px" height="36px" />
              
              {/* Chevron placeholder */}
              <Shimmer className="rounded" width="16px" height="16px" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default MissionCardSkeleton;
