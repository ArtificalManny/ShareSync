// src/components/ship/ShippableCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHIP CEREMONY - Animated Card Wrapper
// ═══════════════════════════════════════════════════════════════════════════════
// Wraps any card/task item to add the ship animation:
// 1. Normal state: Card renders normally
// 2. Shipping state: Subtle glow appears
// 3. Shipped state: Card slides off to the right, then height collapses
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useRef, useEffect, useState } from 'react';
import { PHASES } from '../../hooks/useShipCeremony';

export default function ShippableCard({
  children,
  phase = PHASES.IDLE,
  isThisItem = false, // Is THIS card the one being shipped?
  onAnimationComplete,
  className = '',
}) {
  const cardRef = useRef(null);
  const [height, setHeight] = useState('auto');
  const [isCollapsing, setIsCollapsing] = useState(false);

  // Capture height before animation starts
  useEffect(() => {
    if (cardRef.current && isThisItem && phase === PHASES.PREPARING) {
      setHeight(`${cardRef.current.offsetHeight}px`);
    }
  }, [phase, isThisItem]);

  // Trigger collapse after slide-out
  useEffect(() => {
    if (isThisItem && phase === PHASES.SHIPPED) {
      // Wait for slide animation, then collapse
      const timer = setTimeout(() => {
        setIsCollapsing(true);
        setHeight('0px');
      }, 400); // Match slide duration
      
      return () => clearTimeout(timer);
    }
  }, [phase, isThisItem]);

  // Notify when collapse is complete
  useEffect(() => {
    if (isCollapsing && height === '0px') {
      const timer = setTimeout(() => {
        onAnimationComplete?.();
      }, 300); // Match collapse duration
      
      return () => clearTimeout(timer);
    }
  }, [isCollapsing, height, onAnimationComplete]);

  const getAnimationClasses = () => {
    if (!isThisItem) return '';
    
    switch (phase) {
      case PHASES.PREPARING:
        return 'ring-2 ring-brand/30 ring-offset-2 ring-offset-surface-0';
      case PHASES.SHIPPING:
        return 'ring-2 ring-brand/50 ring-offset-2 ring-offset-surface-0 scale-[1.02]';
      case PHASES.SHIPPED:
        return 'translate-x-[120%] opacity-0 scale-95';
      default:
        return '';
    }
  };

  return (
    <div
      ref={cardRef}
      style={{ 
        height: isCollapsing ? height : 'auto',
        marginBottom: isCollapsing ? '0px' : undefined,
        paddingTop: isCollapsing ? '0px' : undefined,
        paddingBottom: isCollapsing ? '0px' : undefined,
      }}
      className={`
        transition-all duration-300 ease-out
        ${isCollapsing ? 'overflow-hidden' : ''}
        ${className}
      `}
    >
      <div
        className={`
          transition-all duration-400 ease-out
          ${getAnimationClasses()}
        `}
      >
        {children}
      </div>
    </div>
  );
}
