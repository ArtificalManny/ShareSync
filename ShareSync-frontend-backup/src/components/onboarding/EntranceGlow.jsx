// src/components/onboarding/EntranceGlow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ENTRANCE GLOW - The First 200ms
// ═══════════════════════════════════════════════════════════════════════════════
// A subtle Deep Violet glow that emanates from the center of the screen.
// This is the first thing users see - it says "something special is here."
//
// The glow is barely perceptible but sets an emotional tone immediately.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EntranceGlow({ 
  isActive = true,
  duration = 0.8,
  color = 'brand', // 'brand' | 'cyan' | 'success'
  intensity = 'normal', // 'subtle' | 'normal' | 'strong'
  onComplete,
}) {
  // Color configurations
  const colors = {
    brand: {
      inner: 'rgba(124, 58, 237, 0.15)',   // violet-600
      outer: 'rgba(139, 92, 246, 0.08)',   // violet-500
      ring: 'rgba(167, 139, 250, 0.05)',   // violet-400
    },
    cyan: {
      inner: 'rgba(6, 182, 212, 0.15)',
      outer: 'rgba(34, 211, 238, 0.08)',
      ring: 'rgba(103, 232, 249, 0.05)',
    },
    success: {
      inner: 'rgba(16, 185, 129, 0.15)',
      outer: 'rgba(52, 211, 153, 0.08)',
      ring: 'rgba(110, 231, 183, 0.05)',
    },
  };

  // Intensity multipliers
  const intensityMultiplier = {
    subtle: 0.5,
    normal: 1,
    strong: 1.5,
  };

  const colorSet = colors[color] || colors.brand;
  const multiplier = intensityMultiplier[intensity] || 1;

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isActive && (
        <motion.div
          className="entrance-glow fixed inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration * 0.3 }}
          aria-hidden="true"
        >
          {/* Outer ring - largest, most subtle */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 2, opacity: multiplier }}
            exit={{ scale: 2.5, opacity: 0 }}
            transition={{ 
              duration: duration,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <div 
              className="w-[600px] h-[600px] rounded-full blur-3xl"
              style={{ background: colorSet.ring }}
            />
          </motion.div>

          {/* Middle ring */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1.5, opacity: multiplier }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ 
              duration: duration * 0.8,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.05,
            }}
          >
            <div 
              className="w-[400px] h-[400px] rounded-full blur-2xl"
              style={{ background: colorSet.outer }}
            />
          </motion.div>

          {/* Inner core - brightest */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: 1, opacity: multiplier }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ 
              duration: duration * 0.6,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.1,
            }}
          >
            <div 
              className="w-[200px] h-[200px] rounded-full blur-xl"
              style={{ background: colorSet.inner }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simplified version for card-level glows
export function CardEntranceGlow({ isActive, color = 'brand' }) {
  const colorMap = {
    brand: 'rgba(124, 58, 237, 0.1)',
    cyan: 'rgba(6, 182, 212, 0.1)',
    success: 'rgba(16, 185, 129, 0.1)',
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            background: `radial-gradient(circle at center, ${colorMap[color]}, transparent 70%)`,
          }}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}
