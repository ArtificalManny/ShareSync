// src/components/ship/ShipButton.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHIP CEREMONY - The Ceremonial Button
// ═══════════════════════════════════════════════════════════════════════════════
// This isn't just a button. It's the moment of triumph.
// 
// States:
// - idle: "🚀 Ship" - ready to click
// - preparing: Button pulses briefly
// - shipping: "Shipping..." with spinner
// - shipped: "✓ Shipped!" with success state
// - error: "Try Again" with error state
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Rocket, Loader2, Check, AlertCircle } from 'lucide-react';
import { PHASES } from '../../hooks/useShipCeremony';

export default function ShipButton({ 
  onClick, 
  phase = PHASES.IDLE,
  size = 'default', // 'sm' | 'default' | 'lg'
  className = '',
  disabled = false,
}) {
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
      return 'bg-success text-white';
    }
    if (isError) {
      return 'bg-danger/10 text-danger border-danger/20';
    }
    if (isShipping || isPreparing) {
      return 'bg-brand/20 text-brand border-brand/30';
    }
    // Idle - the main state
    return 'bg-brand text-white hover:bg-brand/90';
  };

  // Get button content based on phase
  const getContent = () => {
    if (isShipped) {
      return (
        <>
          <Check className={iconSizes[size]} />
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
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
          <span>Shipping...</span>
        </>
      );
    }
    
    if (isPreparing) {
      return (
        <>
          <Rocket className={`${iconSizes[size]} animate-pulse`} />
          <span>Ship</span>
        </>
      );
    }
    
    // Idle
    return (
      <>
        <Rocket className={iconSizes[size]} />
        <span>Ship</span>
      </>
    );
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        border border-transparent
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${getPhaseStyles()}
        ${isPreparing ? 'scale-105' : ''}
        ${isShipped ? 'scale-95' : ''}
        ${className}
      `}
    >
      {getContent()}
    </button>
  );
}
