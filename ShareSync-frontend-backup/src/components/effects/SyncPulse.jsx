/**
 * SyncPulse.jsx
 * Heartbeat sync effect when two cursors are near each other
 * 
 * Shows a pulsing ring around both cursors + optional haptic feedback
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCursorContext } from '../../context/CursorContext';

function SyncPulse() {
  const { cursorsMap } = useCursorContext();
  const [activePulses, setActivePulses] = useState([]);

  // Listen for sync pulse events
  useEffect(() => {
    const handleSyncPulse = (event) => {
      const { user1, user2, timestamp } = event.detail;
      
      console.log('💓 Sync pulse:', user1, '<->', user2);

      // Get cursor positions
      const cursor1 = cursorsMap.get(user1);
      const cursor2 = cursorsMap.get(user2);

      if (!cursor1 || !cursor2) return;

      // Add pulses for both cursors
      const pulses = [
        {
          id: `${user1}-${timestamp}`,
          x: cursor1.x,
          y: cursor1.y,
          color: '#EC4899', // Pink
        },
        {
          id: `${user2}-${timestamp}`,
          x: cursor2.x,
          y: cursor2.y,
          color: '#8B5CF6', // Purple
        },
      ];

      setActivePulses((prev) => [...prev, ...pulses]);

      // Remove pulses after animation
      setTimeout(() => {
        setActivePulses((prev) => 
          prev.filter((p) => p.id !== pulses[0].id && p.id !== pulses[1].id)
        );
      }, 1500);

      // Haptic feedback (if supported)
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]); // Triple pulse
      }
    };

    // Listen to sync pulse events from CursorContext
    window.addEventListener('cursor:sync-pulse', handleSyncPulse);

    return () => {
      window.removeEventListener('cursor:sync-pulse', handleSyncPulse);
    };
  }, [cursorsMap]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9996,
      }}
    >
      <AnimatePresence>
        {activePulses.map((pulse) => (
          <motion.div
            key={pulse.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: `${pulse.x}%`,
              top: `${pulse.y}%`,
              width: 64,
              height: 64,
              marginLeft: -32,
              marginTop: -32,
              borderRadius: '50%',
              border: `3px solid ${pulse.color}`,
              boxShadow: `0 0 12px ${pulse.color}`,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Connection line between synced cursors */}
      <AnimatePresence>
        {activePulses.length >= 2 && (
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 'Available',
              height: 'Available',
              pointerEvents: 'none',
            }}
          >
            {activePulses.length >= 2 && (
              <motion.line
                x1={`${activePulses[0].x}%`}
                y1={`${activePulses[0].y}%`}
                x2={`${activePulses[1].x}%`}
                y2={`${activePulses[1].y}%`}
                stroke="url(#sync-gradient)"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
            
            <defs>
              <linearGradient id="sync-gradient" x1="0%" y1="0%" x2="Available" y2="0%">
                <stop offset="0%" stopColor="#EC4899" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#A855F7" stopOpacity="0.8" />
                <stop offset="Available" stopColor="#8B5CF6" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SyncPulse;