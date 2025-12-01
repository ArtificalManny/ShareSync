/**
 * GhostTrail.jsx
 * 3-second cursor trail that shows where a cursor has been
 * 
 * Leaves fading "ghost" copies of the cursor along its path
 * Useful for understanding someone's workflow or following their thought process
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCursorContext } from '../../context/CursorContext';

function GhostTrail({ enabled = true, trailLength = 10, fadeTime = 3000 }) {
  const { cursors } = useCursorContext();
  const [trails, setTrails] = useState({});
  const lastPositions = useRef({});

  useEffect(() => {
    if (!enabled) return;

    // Update trails for each cursor
    cursors.forEach((cursor) => {
      const lastPos = lastPositions.current[cursor.userId];
      
      // Check if cursor moved significantly
      if (lastPos) {
        const dx = Math.abs(cursor.x - lastPos.x);
        const dy = Math.abs(cursor.y - lastPos.y);
        
        // Only add trail if moved more than 2% of viewport
        if (dx > 2 || dy > 2) {
          addTrailPoint(cursor.userId, cursor.x, cursor.y, cursor.activity);
        }
      }

      // Update last position
      lastPositions.current[cursor.userId] = {
        x: cursor.x,
        y: cursor.y,
      };
    });
  }, [cursors, enabled]);

  // Add a trail point
  const addTrailPoint = (userId, x, y, activity) => {
    const point = {
      id: `${userId}-${Date.now()}`,
      userId,
      x,
      y,
      activity,
      birthTime: Date.now(),
    };

    setTrails((prev) => {
      const userTrail = prev[userId] || [];
      const newTrail = [...userTrail, point];
      
      // Keep only last N points
      const trimmed = newTrail.slice(-trailLength);
      
      return {
        ...prev,
        [userId]: trimmed,
      };
    });

    // Remove point after fade time
    setTimeout(() => {
      setTrails((prev) => ({
        ...prev,
        [userId]: (prev[userId] || []).filter((p) => p.id !== point.id),
      }));
    }, fadeTime);
  };

  // Get color based on activity
  const getTrailColor = (activity) => {
    switch (activity) {
      case 'typing':
        return 'rgba(139, 92, 246, 0.6)'; // Purple
      case 'clicking':
        return 'rgba(236, 72, 153, 0.6)'; // Pink
      case 'dragging':
        return 'rgba(99, 102, 241, 0.6)'; // Indigo
      default:
        return 'rgba(148, 163, 184, 0.4)'; // Gray
    }
  };

  // Calculate opacity based on age
  const getOpacity = (birthTime) => {
    const age = Date.now() - birthTime;
    const progress = age / fadeTime;
    return Math.max(0, 1 - progress);
  };

  if (!enabled) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 998, // Below cursors (999) but above content
      }}
    >
      {Object.entries(trails).map(([userId, userTrail]) =>
        userTrail.map((point, index) => {
          const opacity = getOpacity(point.birthTime);
          const size = 12 - index * 0.5; // Smaller as trail gets older
          
          return (
            <motion.div
              key={point.id}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{
                scale: 0.8,
                opacity: opacity * 0.6,
              }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                left: `${point.x}%`,
                top: `${point.y}%`,
                width: size,
                height: size,
                borderRadius: '50%',
                background: getTrailColor(point.activity),
                boxShadow: `0 0 ${size / 2}px ${getTrailColor(point.activity)}`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          );
        })
      )}
    </div>
  );
}

export default GhostTrail;