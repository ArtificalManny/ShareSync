// src/components/ship/ShippableCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8: Ship Ceremony Enhancement
// ═══════════════════════════════════════════════════════════════════════════════
// 
// ENHANCEMENTS:
// - Card lifts up before sliding off
// - Particle trail during shipping phase
// - Smoother height collapse
// 
// Animation sequence:
// 1. PREPARING: Card lifts up (translateY -4px), glow appears
// 2. SHIPPING: Card continues rising, particles emit from left edge
// 3. SHIPPED: Card slides right + fades, particles trail behind
// 4. COLLAPSE: Height smoothly collapses to 0
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useRef, useEffect, useState } from 'react';
import { PHASES } from '../../hooks/useShipCeremony';
import ParticleTrail from './ParticleTrail';

export default function ShippableCard({
  children,
  phase = PHASES.IDLE,
  isThisItem = false,
  onAnimationComplete,
  className = '',
}) {
  const cardRef = useRef(null);
  const [height, setHeight] = useState('auto');
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // Capture height before animation starts
  useEffect(() => {
    if (cardRef.current && isThisItem && phase === PHASES.PREPARING) {
      setHeight(`${cardRef.current.offsetHeight}px`);
    }
  }, [phase, isThisItem]);

  // Trigger particles during shipping
  useEffect(() => {
    if (isThisItem && phase === PHASES.SHIPPING) {
      setShowParticles(true);
    } else if (phase === PHASES.IDLE) {
      setShowParticles(false);
    }
  }, [phase, isThisItem]);

  // Trigger collapse after slide-out
  useEffect(() => {
    if (isThisItem && phase === PHASES.SHIPPED) {
      // Keep particles visible briefly during slide
      const particleTimer = setTimeout(() => {
        setShowParticles(false);
      }, 300);
      
      // Start collapse after slide completes
      const collapseTimer = setTimeout(() => {
        setIsCollapsing(true);
        setHeight('0px');
      }, 400);
      
      return () => {
        clearTimeout(particleTimer);
        clearTimeout(collapseTimer);
      };
    }
  }, [phase, isThisItem]);

  // Notify when collapse is complete
  useEffect(() => {
    if (isCollapsing && height === '0px') {
      const timer = setTimeout(() => {
        onAnimationComplete?.();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isCollapsing, height, onAnimationComplete]);

  const getAnimationClasses = () => {
    if (!isThisItem) return '';
    
    switch (phase) {
      case PHASES.PREPARING:
        // Lift up, subtle glow
        return `
          -translate-y-1 
          ring-2 ring-brand/30 ring-offset-2 ring-offset-surface-0
          shadow-lg
        `;
      case PHASES.SHIPPING:
        // Higher lift, stronger glow
        return `
          -translate-y-2 
          ring-2 ring-brand/50 ring-offset-2 ring-offset-surface-0 
          scale-[1.01]
          shadow-xl shadow-brand/20
        `;
      case PHASES.SHIPPED:
        // Slide right and fade
        return `
          translate-x-[120%] 
          opacity-0 
          scale-95
          -translate-y-1
        `;
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
        relative
        transition-all duration-300 ease-out
        ${isCollapsing ? 'overflow-hidden' : ''}
        ${className}
      `}
    >
      {/* Particle trail - positioned at left edge */}
      <ParticleTrail 
        active={showParticles}
        originX={0}
        originY="50%"
        count={15}
      />
      
      {/* The actual card */}
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
