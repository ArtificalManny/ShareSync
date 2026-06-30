// src/components/home/AhaMomentToast.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9.3: The "Aha" Moment - Toast Notification
// ═══════════════════════════════════════════════════════════════════════════════
//
// A celebratory toast that appears when the user's first insight is ready.
// Clicking it opens the full insight modal.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Brain, ChevronRight } from 'lucide-react';

/**
 * AhaMomentToast - Toast notification for first insight
 * 
 * @param {boolean} show - Whether to show the toast
 * @param {object} insight - The insight preview
 * @param {function} onView - Callback to view full insight
 * @param {function} onDismiss - Callback to dismiss
 */
export default function AhaMomentToast({ 
  show, 
  insight, 
  onView, 
  onDismiss,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      // Delay for entrance animation
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onDismiss?.();
    }, 300);
  };

  const handleView = () => {
    handleDismiss();
    setTimeout(() => onView?.(), 350);
  };

  if (!show && !isVisible) return null;

  return (
    <div 
      className={`
        fixed bottom-24 right-6 z-50
        max-w-sm w-full
        transition-all duration-500 ease-out
        ${isVisible && !isExiting 
          ? 'opacity-100 translate-y-0 translate-x-0' 
          : 'opacity-0 translate-y-4 translate-x-4'
        }
      `}
    >
      <div className="
        relative p-4 rounded-2xl
        bg-surface-1 border border-brand/20
        shadow-2xl shadow-black/20
        backdrop-blur-xl
      ">
        {/* Glow effect */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand/20 to-accent-500/20 blur-xl opacity-50" />
        
        <div className="relative">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute -top-1 -right-1 p-1.5 rounded-full bg-surface-2 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-accent-500 flex items-center justify-center shadow-lg shadow-brand/25">
                <span className="text-2xl">{insight?.emoji || '🧠'}</span>
              </div>
              {/* Pulse animation */}
              <div className="absolute inset-0 rounded-xl bg-brand/30 animate-ping" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                <span className="text-xs font-medium text-brand">
                  Insight Unlocked!
                </span>
              </div>
              <h4 className="text-sm font-semibold text-text-primary mb-0.5">
                {insight?.title || 'Your First Insight'}
              </h4>
              <p className="text-xs text-text-secondary line-clamp-2">
                We noticed something about how you work...
              </p>
            </div>
          </div>

          {/* Action */}
          <button
            onClick={handleView}
            className="
              mt-3 w-full py-2.5 rounded-xl
              bg-brand/10 hover:bg-brand/20
              text-brand text-sm font-medium
              flex items-center justify-center gap-2
              transition-colors
            "
          >
            <Brain className="w-4 h-4" />
            View Your Insight
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * InsightUnlockedBanner - Inline banner version
 */
export function InsightUnlockedBanner({ insight, onView, onDismiss }) {
  return (
    <div className="
      relative p-4 rounded-xl overflow-hidden
      bg-gradient-to-r from-brand/10 via-accent-500/10 to-brand/10
      border border-brand/20
    ">
      {/* Background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
      
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center text-xl">
            {insight?.emoji || '🧠'}
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="w-3 h-3 text-brand" />
              <span className="text-xs font-medium text-brand">New Insight!</span>
            </div>
            <p className="text-sm text-text-primary font-medium">
              {insight?.title || 'Your work pattern revealed'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            View
          </button>
          <button
            onClick={onDismiss}
            className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          Available {
            transform: translateX(Available);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * MilestoneToast - Generic milestone achievement toast
 */
export function MilestoneToast({ 
  show,
  emoji = '🎉',
  title,
  message,
  onDismiss,
  duration = 5000,
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onDismiss]);

  if (!show && !isVisible) return null;

  return (
    <div className={`
      fixed bottom-6 right-6 z-50
      p-4 rounded-xl
      bg-surface-1 border border-white/[0.1]
      shadow-2xl shadow-black/20
      transition-all duration-300
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
          <p className="text-xs text-text-secondary">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss?.(), 300);
          }}
          className="p-1 rounded text-text-tertiary hover:text-text-primary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
