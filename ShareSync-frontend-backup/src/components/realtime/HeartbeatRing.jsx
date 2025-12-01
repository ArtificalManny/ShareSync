/**
 * HeartbeatRing.jsx
 * Sidebar pulse animation that shows user activity
 * 
 * Pulses when user takes actions (typing, clicking, shipping)
 * Visual feedback that user is actively working
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCursorContext } from '../../context/CursorContext';

function HeartbeatRing({
  size = 48,
  strokeWidth = 3,
  className = '',
  showText = false,
}) {
  const { activity } = useCursorContext();
  const [pulses, setPulses] = useState([]);
  const pulseCount = useRef(0);

  // Listen for activity changes
  useEffect(() => {
    // Trigger pulse on activity
    if (activity !== 'idle') {
      triggerPulse();
    }
  }, [activity]);

  // Listen for heartbeat events
  useEffect(() => {
    const handleHeartbeat = () => {
      triggerPulse();
    };

    window.addEventListener('cursor:heartbeat', handleHeartbeat);

    return () => {
      window.removeEventListener('cursor:heartbeat', handleHeartbeat);
    };
  }, []);

  // Trigger a pulse animation
  const triggerPulse = () => {
    const pulseId = Date.now();
    pulseCount.current += 1;

    setPulses((prev) => [...prev, pulseId]);

    // Remove pulse after animation
    setTimeout(() => {
      setPulses((prev) => prev.filter((id) => id !== pulseId));
    }, 1000);
  };

  // Get color based on activity
  const getColor = () => {
    switch (activity) {
      case 'typing':
        return '#8B5CF6'; // Purple
      case 'clicking':
        return '#EC4899'; // Pink
      case 'dragging':
        return '#6366F1'; // Indigo
      default:
        return '#10B981'; // Green (online)
    }
  };

  return (
    <div className={`heartbeat-ring ${className}`} style={{ position: 'relative' }}>
      {/* Base ring */}
      <svg
        width={size}
        height={size}
        style={{
          transform: 'rotate(-90deg)',
        }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth={strokeWidth}
        />

        {/* Animated progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{
            pathLength: activity === 'idle' ? 0.2 : 1,
          }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
          style={{
            strokeDasharray: '0 1',
            filter: `drop-shadow(0 0 4px ${getColor()})`,
          }}
        />
      </svg>

      {/* Pulse rings */}
      {pulses.map((pulseId) => (
        <motion.div
          key={pulseId}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: size,
            height: size,
            border: `${strokeWidth}px solid ${getColor()}`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Activity count (optional) */}
      {showText && pulseCount.current > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 11,
            fontWeight: 700,
            color: getColor(),
          }}
        >
          {pulseCount.current}
        </div>
      )}
    </div>
  );
}

export default HeartbeatRing;