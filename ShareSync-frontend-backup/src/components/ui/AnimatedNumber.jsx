import React from 'react';
import { useSpring, animated } from '@react-spring/web';

/**
 * AnimatedNumber - Smoothly animates number changes
 */
export default function AnimatedNumber({ 
  value = 0,
  decimals = 0, 
  suffix = '', 
  prefix = '',
  className = ''
}) {
  // Spring animation configuration
  const props = useSpring({ 
    val: value, 
    from: { val: 0 },
    config: { 
      tension: 280, 
      friction: 60
    }
  });

  return (
    <animated.span className={className}>
      {props.val.to(n => {
        // Format number with specified decimal places
        const formatted = n.toFixed(decimals);
        // Add commas for thousands (e.g., 1,234)
        const withCommas = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        // Return complete string with prefix/suffix
        return `${prefix}${withCommas}${suffix}`;
      })}
    </animated.span>
  );
}
