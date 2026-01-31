// src/components/ceremony/ShipCeremony.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// CEREMONY MOMENTS: Ship Ceremony
// The dramatic "3... 2... 1... SHIP!" countdown
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { 
  Rocket, Play, Camera, Share2, X, Zap, Star,
  ChevronRight, Sparkles, Trophy
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTDOWN OVERLAY
// ═══════════════════════════════════════════════════════════════════════════════

function CountdownOverlay({ count, task }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        {/* Countdown number */}
        <div className="relative">
          <div className="absolute inset-0 bg-brand-500/30 blur-3xl rounded-full animate-pulse" />
          <div 
            className="relative text-[200px] font-black text-white leading-none animate-countdown-pulse"
            style={{ textShadow: '0 0 60px rgba(124, 58, 237, 0.8)' }}
          >
            {count}
          </div>
        </div>
        
        {/* Task name */}
        <div className="mt-8 text-2xl text-text-secondary">
          Shipping: "{task?.title}"
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHIP BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ShipButton - The dramatic ship button with countdown option
 */
export function ShipButton({
  task,
  onShip,
  onShipWithCountdown,
  size = 'md',
  showCountdownOption = true,
  disabled = false,
  className = '',
}) {
  const [isHovering, setIsHovering] = useState(false);
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => showCountdownOption ? null : onShip?.()}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={disabled}
        className={`
          relative overflow-hidden rounded-xl font-semibold
          bg-gradient-to-r from-brand-500 to-purple-500
          text-white shadow-lg shadow-brand-500/30
          hover:from-brand-400 hover:to-purple-400
          hover:shadow-xl hover:shadow-brand-500/40
          hover:-translate-y-0.5
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${sizeClasses[size]}
        `}
      >
        <span className="relative flex items-center gap-2">
          <Rocket className={`${iconSizes[size]} ${isHovering ? 'animate-bounce' : ''}`} />
          <span>Ship It!</span>
        </span>
        
        {/* Shine effect */}
        <div className="absolute inset-0 -translate-x-full animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </button>
      
      {/* Dropdown for countdown option */}
      {showCountdownOption && isHovering && (
        <div 
          className="absolute top-full left-0 mt-2 w-48 z-10"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="bg-surface-0 border border-white/[0.08] rounded-xl shadow-xl overflow-hidden">
            <button
              onClick={onShip}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left"
            >
              <Play className="w-4 h-4 text-brand-400" />
              <span className="text-sm text-text-primary">Quick Ship</span>
            </button>
            <button
              onClick={onShipWithCountdown}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left border-t border-white/[0.06]"
            >
              <Sparkles className="w-4 h-4 text-warning-400" />
              <span className="text-sm text-text-primary">3... 2... 1... SHIP!</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHIP CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ShipConfirmationModal - Pre-ship confirmation with options
 */
export function ShipConfirmationModal({
  isOpen,
  task,
  onConfirm,
  onConfirmWithCountdown,
  onCancel,
  onScreenshot,
  estimatedXP = 25,
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      <div className="relative w-full max-w-md bg-surface-0 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-brand-500/10 to-purple-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-text-primary">
                  Ready to Ship?
                </div>
                <div className="text-sm text-text-tertiary">
                  Confirm completion
                </div>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-white/10 text-text-tertiary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Task info */}
        <div className="p-6">
          <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06] mb-6">
            <div className="text-sm text-text-tertiary mb-1">Shipping</div>
            <div className="text-lg font-medium text-text-primary">
              {task?.title}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-brand-400">
              <Zap className="w-4 h-4" />
              <span>+{estimatedXP} XP (maybe more!)</span>
            </div>
          </div>
          
          {/* Screenshot option */}
          {onScreenshot && (
            <button
              onClick={onScreenshot}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-1 border border-white/[0.06] hover:bg-surface-2 transition-colors mb-4"
            >
              <Camera className="w-5 h-5 text-text-tertiary" />
              <span className="text-sm text-text-secondary">Capture screenshot</span>
              <ChevronRight className="w-4 h-4 text-text-tertiary ml-auto" />
            </button>
          )}
          
          {/* Ship buttons */}
          <div className="space-y-3">
            <button
              onClick={onConfirmWithCountdown}
              className="
                w-full py-4 rounded-xl
                bg-gradient-to-r from-brand-500 to-purple-500
                text-white font-bold text-lg
                hover:from-brand-400 hover:to-purple-400
                transition-all shadow-lg shadow-brand-500/30
                flex items-center justify-center gap-3
              "
            >
              <Sparkles className="w-5 h-5" />
              <span>3... 2... 1... SHIP!</span>
            </button>
            
            <button
              onClick={onConfirm}
              className="
                w-full py-3 rounded-xl
                bg-surface-2 text-text-secondary
                hover:bg-surface-3 transition-colors
                flex items-center justify-center gap-2
              "
            >
              <Play className="w-4 h-4" />
              <span>Quick Ship</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLAP BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ClapButton - React to teammate's ship
 */
export function ClapButton({
  onClap,
  clapCount = 0,
  hasClapped = false,
  className = '',
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleClap = () => {
    if (hasClapped) return;
    setIsAnimating(true);
    onClap?.();
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  return (
    <button
      onClick={handleClap}
      disabled={hasClapped}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl
        transition-all duration-200
        ${hasClapped 
          ? 'bg-brand-500/20 text-brand-400' 
          : 'bg-surface-2 text-text-secondary hover:bg-surface-3 hover:scale-105'
        }
        ${isAnimating ? 'scale-110' : ''}
        ${className}
      `}
    >
      <span className={`text-xl ${isAnimating ? 'animate-bounce' : ''}`}>👏</span>
      {clapCount > 0 && (
        <span className="text-sm font-medium">{clapCount}</span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT COUNTDOWN OVERLAY
// ═══════════════════════════════════════════════════════════════════════════════

export { CountdownOverlay };

export default ShipButton;
