// src/components/ship/ShipButton.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8: Ship Ceremony Enhancement
// ═══════════════════════════════════════════════════════════════════════════════
// 
// ENHANCEMENTS:
// - Lift effect on hover (button rises slightly)
// - More dramatic preparing → shipping transition
// - Rocket tilts during shipping
// - Satisfying "landed" feel on shipped state
// 
// States:
// - idle: "🚀 Ship" - ready to click, lifts on hover
// - preparing: Button rises, pulses
// - shipping: "Shipping..." with tilted rocket
// - shipped: "✓ Shipped!" drops down with success
// - error: "Try Again" with shake
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Rocket, Loader2, Check, AlertCircle } from 'lucide-react';
import { PHASES } from '../../hooks/useShipCeremony';

export default function ShipButton({ 
  onClick, 
  phase = PHASES.IDLE,
  size = 'default', // 'sm' | 'default' | 'lg'
  className = '',
  disabled = false,
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isIdle = phase === PHASES.IDLE;
  const isPreparing = phase === PHASES.PREPARING;
  const isShipping = phase === PHASES.SHIPPING;
  const isShipped = phase === PHASES.SHIPPED;
  const isError = phase === PHASES.ERROR;
  
  const isDisabled = disabled || !isIdle;

  // Size variants
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    default: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Phase-based styling
  const getPhaseStyles = () => {
    if (isShipped) {
      return 'bg-success text-white shadow-glow-success';
    }
    if (isError) {
      return 'bg-error/10 text-error border-error/20 animate-shake';
    }
    if (isShipping) {
      return 'bg-brand text-white shadow-glow-brand';
    }
    if (isPreparing) {
      return 'bg-brand text-white shadow-glow-brand';
    }
    // Idle
    return 'bg-brand text-white hover:bg-brand-600 hover:shadow-glow-brand';
  };

  // Transform based on phase and hover
  const getTransform = () => {
    if (isShipped) return 'translateY(1px) scale(0.98)'; // Landed
    if (isShipping) return 'translateY(-4px) scale(1.02)'; // Flying
    if (isPreparing) return 'translateY(-6px) scale(1.05)'; // Lifting off
    if (isHovered && isIdle) return 'translateY(-2px)'; // Hover lift
    return 'translateY(0)';
  };

  // Get button content based on phase
  const getContent = () => {
    if (isShipped) {
      return (
        <>
          <Check className={`${iconSizes[size]} animate-scale-in`} />
          <span>Shipped!</span>
        </>
      );
    }
    
    if (isError) {
      return (
        <>
          <AlertCircle className={iconSizes[size]} />
          <span>Try Again</span>
        </>
      );
    }
    
    if (isShipping) {
      return (
        <>
          <Rocket className={`${iconSizes[size]} -rotate-45 animate-pulse`} />
          <span>Shipping...</span>
        </>
      );
    }
    
    if (isPreparing) {
      return (
        <>
          <Rocket className={`${iconSizes[size]} -rotate-12 transition-transform`} />
          <span>Ship</span>
        </>
      );
    }
    
    // Idle
    return (
      <>
        <Rocket className={`${iconSizes[size]} transition-transform ${isHovered ? '-rotate-12' : ''}`} />
        <span>Ship</span>
      </>
    );
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ transform: getTransform() }}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        border border-transparent
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${getPhaseStyles()}
        ${className}
      `}
    >
      {getContent()}
    </button>
  );
}
