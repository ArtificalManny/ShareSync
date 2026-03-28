// src/components/ui/AnimatedNumber.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2.6: Motion & Micro-Interactions (The Dopamine Counter)
// Uses refined spring physics to make number loading feel "alive".
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useSpring, animated } from '@react-spring/web';

export default function AnimatedNumber({ 
  value = 0,
  decimals = 0, 
  suffix = '', 
  prefix = '',
  className = '',
  delay = 0
}) {
  // Apple-grade spring physics for natural, satisfying deceleration
  const props = useSpring({ 
    from: { val: 0 },
    to: { val: value },
    delay,
    config: { 
      mass: 1, 
      tension: 170, 
      friction: 26,
      clamp: true // Prevents numbers from bouncing backward
    }
  });

  return (
    <animated.span className={`tabular-nums tracking-tight ${className}`}>
      {props.val.to(n => {
        const formatted = n.toFixed(decimals);
        const withCommas = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return `${prefix}${withCommas}${suffix}`;
      })}
    </animated.span>
  );
}
