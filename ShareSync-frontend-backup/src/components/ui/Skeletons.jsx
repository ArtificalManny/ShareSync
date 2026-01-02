import React from 'react';

/**
 * Comprehensive Skeleton Loading Components
 * These replace "Loading..." text with professional skeleton screens
 */

export function SkeletonCard() {
  return (
    <div className="modern-card p-6 space-y-4 animate-pulse">
      <div className="skeleton h-6 w-32" />
      <div className="space-y-2">
        <div className="skeleton-text" />
        <div className="skeleton-text w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="stat-card-modern animate-pulse">
      <div className="skeleton h-4 w-20 mb-2" />
      <div className="skeleton h-8 w-16" />
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="modern-card p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="skeleton-avatar" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonMomentumRing() {
  return (
    <div className="modern-card p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-10 w-10 rounded-lg" />
      </div>
      <div className="flex items-center gap-6">
        <div className="skeleton h-36 w-36 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="skeleton-text w-full" />
          <div className="skeleton-text w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProjectCard() {
  return (
    <div className="modern-card p-6 space-y-4 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="skeleton h-10 w-10 rounded-lg" />
        <div className="skeleton h-5 w-12" />
      </div>
      <div className="skeleton h-6 w-48 mb-2" />
      <div className="skeleton-text w-full" />
      <div className="skeleton-text w-3/4" />
      <div className="skeleton h-10 w-full rounded-lg mt-4" />
    </div>
  );
}

/**
 * Usage Examples:
 * 
 * <SkeletonMomentumRing /> - Replaces MomentumIndex loading
 * <SkeletonStat /> - Replaces stat card loading
 * <SkeletonCard /> - Generic card skeleton
 * <SkeletonList count={5} /> - List with avatars
 * <SkeletonProjectCard /> - Project card skeleton
 */
