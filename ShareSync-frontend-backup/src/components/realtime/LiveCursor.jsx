/**
 * LiveCursor.jsx
 * Individual animated cursor component
 * 
 * Features:
 * - Breathing animation (pulsing)
 * - Sparkle trail on movement
 * - Activity flashes (white burst)
 * - Smooth position transitions
 * - Avatar photo next to cursor
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CursorAvatar from './CursorAvatar';

function LiveCursor({ cursor }) {
  const {
    userId,
    userName,
    userAvatar,
    x,
    y,
    activity,
    mode,
    flashType,
    flashTimestamp,
    syncPulse,
  } = cursor;

  // Animation states
  const [isFlashing, setIsFlashing] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const lastPosition = useRef({ x, y });

  // ============================================
  // ACTIVITY FLASH
  // ============================================

  useEffect(() => {
    if (!flashTimestamp) return;

    // Trigger flash animation
    setIsFlashing(true);

    const duration = flashType === 'ship' ? 1000 : 200;

    setTimeout(() => {
      setIsFlashing(false);
    }, duration);
  }, [flashTimestamp, flashType]);

  // ============================================
  // SPARKLE TRAIL
  // ============================================

  useEffect(() => {
    // Only show trail if cursor is moving
    const dx = Math.abs(x - lastPosition.current.x);
    const dy = Math.abs(y - lastPosition.current.y);

    if (dx > 0.5 || dy > 0.5) {
      // Add sparkle at previous position
      const sparkle = {
        id: Date.now() + Math.random(),
        x: lastPosition.current.x,
        y: lastPosition.current.y,
      };

      setSparkles((prev) => [...prev, sparkle]);

      // Remove sparkle after fade duration
      setTimeout(() => {
        setSparkles((prev) => prev.filter((s) => s.id !== sparkle.id));
      }, 300);
    }

    lastPosition.current = { x, y };
  }, [x, y]);

  // ============================================
  // ACTIVITY STYLES
  // ============================================

  const getActivityColor = () => {
    switch (activity) {
      case 'typing':
        return 'rgba(139, 92, 246, 0.8)'; // Purple
      case 'clicking':
        return 'rgba(236, 72, 153, 0.8)'; // Pink
      case 'dragging':
        return 'rgba(99, 102, 241, 0.8)'; // Indigo
      default:
        return 'rgba(148, 163, 184, 0.6)'; // Muted
    }
  };

  const getBreathingSpeed = () => {
    switch (activity) {
      case 'typing':
        return 0.8; // Fast breathing
      case 'clicking':
      case 'dragging':
        return 1.0;
      default:
        return 2.0; // Slow breathing
    }
  };

  const getOpacity = () => {
    if (activity === 'idle') return 0.3;
    if (mode === 'ghost') return 0.5;
    return 1.0;
  };

  // ============================================
  // GHOST MODE (anonymous)
  // ============================================

  const isGhost = mode === 'ghost';

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* Cursor itself */}
      <motion.div
        className="live-cursor"
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          pointerEvents: 'none',
          zIndex: 1000,
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: getOpacity(),
          scale: isFlashing ? 1.5 : 1,
        }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300,
        }}
      >
        {/* Sync pulse ring (when two cursors are near) */}
        <AnimatePresence>
          {syncPulse && (
            <motion.div
              className="sync-pulse-ring"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: -8,
                left: -8,
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2px solid rgba(236, 72, 153, 0.6)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Flash effect (white burst) */}
        <AnimatePresence>
          {isFlashing && (
            <motion.div
              className="cursor-flash"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: flashType === 'ship' ? 1 : 0.2,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                top: -8,
                left: -8,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background:
                  flashType === 'ship'
                    ? 'radial-gradient(circle, rgba(251, 191, 36, 1) 0%, rgba(251, 191, 36, 0) 70%)'
                    : 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 70%)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Main cursor dot with breathing animation */}
        <motion.div
          className="cursor-dot"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: getBreathingSpeed(),
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: getActivityColor(),
            boxShadow: `0 0 12px ${getActivityColor()}`,
            border: '2px solid white',
          }}
        />

        {/* Avatar (unless in ghost mode) */}
        {!isGhost && (
          <CursorAvatar
            userName={userName}
            userAvatar={userAvatar}
            activity={activity}
            isFlashing={isFlashing}
          />
        )}
      </motion.div>

      {/* Sparkle trail */}
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            className="cursor-sparkle"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 0, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background:
                activity === 'typing'
                  ? 'rgba(139, 92, 246, 0.6)'
                  : 'rgba(255, 255, 255, 0.4)',
              pointerEvents: 'none',
              zIndex: 999,
            }}
          />
        ))}
      </AnimatePresence>
    </>
  );
}

export default LiveCursor;