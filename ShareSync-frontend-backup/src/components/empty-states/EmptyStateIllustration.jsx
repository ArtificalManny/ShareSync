// src/components/empty-states/EmptyStateIllustration.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE D: Empty States That Inspire - Momentum-Responsive Illustrations
// ═══════════════════════════════════════════════════════════════════════════════
//
// SVG illustrations that respond to momentum level:
// - Level 0-1: Subtle, minimal animation
// - Level 2-3: Gentle glow, slight movement
// - Level 4-5: Enhanced glow, active animations
// - Fire Mode: Energy accent color, particles
//
// Each illustration has:
// - Base shapes with brand colors
// - Glow effects that intensify with momentum
// - Floating elements that animate at high levels
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY: Get glow filter based on momentum
// ═══════════════════════════════════════════════════════════════════════════════
const getGlowFilter = (glowLevel, isFireMode) => {
  if (glowLevel < 2) return 'none';
  const intensity = 2 + glowLevel * 2;
  const color = isFireMode ? '244, 63, 94' : '139, 92, 246'; // energy or brand
  return `drop-shadow(0 0 ${intensity}px rgba(${color}, ${0.2 + glowLevel * 0.1}))`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ILLUSTRATION: Rocket Launch (for EmptyProjects)
// ═══════════════════════════════════════════════════════════════════════════════
export function RocketIllustration({ glowLevel = 2, accentColor = 'brand', isFireMode = false }) {
  const glowFilter = getGlowFilter(glowLevel, isFireMode);
  const shouldAnimate = glowLevel >= 2;
  const primaryColor = isFireMode ? '#F43F5E' : '#8B5CF6';
  const secondaryColor = isFireMode ? '#FB7185' : '#A78BFA';
  
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
        <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      {/* Background circle */}
      <circle cx="80" cy="80" r="70" fill="url(#rocketGradient)" opacity="0.1" />
      
      {/* Orbit rings */}
      <motion.ellipse
        cx="80" cy="80" rx="55" ry="20"
        stroke={primaryColor}
        strokeWidth="1"
        strokeOpacity="0.3"
        fill="none"
        strokeDasharray="4 4"
        animate={shouldAnimate ? { rotate: 360 } : {}}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '80px 80px' }}
      />
      
      {/* Rocket body */}
      <motion.g
        style={{ filter: glowFilter }}
        animate={shouldAnimate ? { y: [0, -5, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Main body */}
        <path
          d="M80 30 L95 70 L95 100 L80 110 L65 100 L65 70 Z"
          fill="url(#rocketGradient)"
        />
        
        {/* Window */}
        <circle cx="80" cy="60" r="8" fill="#1A1A1D" />
        <circle cx="80" cy="60" r="5" fill="#06B6D4" opacity="0.5" />
        
        {/* Fins */}
        <path d="M65 85 L50 105 L65 100 Z" fill={primaryColor} opacity="0.8" />
        <path d="M95 85 L110 105 L95 100 Z" fill={primaryColor} opacity="0.8" />
        
        {/* Flame */}
        <motion.path
          d="M75 110 L80 130 L85 110"
          fill="url(#flameGradient)"
          animate={shouldAnimate ? { 
            scaleY: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8] 
          } : {}}
          transition={{ duration: 0.3, repeat: Infinity }}
          style={{ transformOrigin: '80px 110px' }}
        />
      </motion.g>
      
      {/* Stars */}
      {[
        { x: 25, y: 40, size: 3, delay: 0 },
        { x: 135, y: 50, size: 2, delay: 0.5 },
        { x: 40, y: 130, size: 2, delay: 1 },
        { x: 120, y: 120, size: 3, delay: 1.5 },
        { x: 30, y: 80, size: 2, delay: 0.3 },
      ].map((star, i) => (
        <motion.circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.size}
          fill={secondaryColor}
          animate={shouldAnimate ? { 
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1]
          } : { opacity: 0.5 }}
          transition={{ duration: 2, delay: star.delay, repeat: Infinity }}
        />
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ILLUSTRATION: Canvas/Blank Page (for EmptyTasks)
// ═══════════════════════════════════════════════════════════════════════════════
export function CanvasIllustration({ glowLevel = 2, accentColor = 'brand', isFireMode = false }) {
  const glowFilter = getGlowFilter(glowLevel, isFireMode);
  const shouldAnimate = glowLevel >= 2;
  const primaryColor = isFireMode ? '#F43F5E' : '#8B5CF6';
  const secondaryColor = isFireMode ? '#FB7185' : '#A78BFA';
  
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="canvasGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>
      
      {/* Easel */}
      <motion.g style={{ filter: glowFilter }}>
        {/* Canvas frame */}
        <rect x="35" y="25" width="90" height="75" rx="4" fill="#1A1A1D" stroke={primaryColor} strokeWidth="2" />
        
        {/* Canvas inner (white) */}
        <rect x="42" y="32" width="76" height="61" rx="2" fill="#2A2A2D" />
        
        {/* Cursor/Brush */}
        <motion.g
          animate={shouldAnimate ? {
            x: [0, 20, 40, 20, 0],
            y: [0, 10, 0, -10, 0],
          } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx="65" cy="55" r="4" fill={primaryColor} />
          <path d="M65 59 L65 75" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
        </motion.g>
        
        {/* Paint strokes appearing */}
        {shouldAnimate && (
          <>
            <motion.path
              d="M55 45 Q65 40 75 48"
              stroke={primaryColor}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
            />
            <motion.path
              d="M85 55 Q95 50 105 58"
              stroke="#06B6D4"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ duration: 2, delay: 1.5, repeat: Infinity, repeatDelay: 3 }}
            />
          </>
        )}
      </motion.g>
      
      {/* Easel legs */}
      <line x1="50" y1="100" x2="40" y2="140" stroke="#3A3A3D" strokeWidth="3" strokeLinecap="round" />
      <line x1="110" y1="100" x2="120" y2="140" stroke="#3A3A3D" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="100" x2="80" y2="145" stroke="#3A3A3D" strokeWidth="3" strokeLinecap="round" />
      
      {/* Paint palette */}
      <motion.g
        animate={shouldAnimate ? { rotate: [0, 5, 0, -5, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ transformOrigin: '130px 130px' }}
      >
        <ellipse cx="130" cy="130" rx="20" ry="12" fill="#2A2A2D" stroke="#3A3A3D" strokeWidth="1" />
        <circle cx="120" cy="128" r="4" fill={primaryColor} />
        <circle cx="130" cy="125" r="3" fill="#06B6D4" />
        <circle cx="138" cy="130" r="3" fill="#10B981" />
      </motion.g>
      
      {/* Sparkles */}
      {[
        { x: 20, y: 30, delay: 0 },
        { x: 145, y: 45, delay: 0.8 },
        { x: 25, y: 100, delay: 1.2 },
      ].map((spark, i) => (
        <motion.text
          key={i}
          x={spark.x}
          y={spark.y}
          fontSize="16"
          animate={shouldAnimate ? { 
            opacity: [0.2, 0.8, 0.2],
            scale: [0.8, 1.1, 0.8]
          } : { opacity: 0.3 }}
          transition={{ duration: 2, delay: spark.delay, repeat: Infinity }}
          style={{ transformOrigin: `${spark.x}px ${spark.y}px` }}
        >
          ✨
        </motion.text>
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ILLUSTRATION: Inbox Zero / Celebration (for EmptyInbox)
// ═══════════════════════════════════════════════════════════════════════════════
export function InboxZeroIllustration({ glowLevel = 2, accentColor = 'brand', isFireMode = false }) {
  const glowFilter = getGlowFilter(glowLevel, isFireMode);
  const shouldAnimate = glowLevel >= 2;
  const primaryColor = isFireMode ? '#F43F5E' : '#10B981'; // Success green for inbox zero
  const secondaryColor = isFireMode ? '#FB7185' : '#34D399';
  
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="inboxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>
      
      {/* Celebration burst */}
      <motion.g
        animate={shouldAnimate ? { 
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ transformOrigin: '80px 80px' }}
      >
        {[...Array(8)].map((_, i) => (
          <line
            key={i}
            x1="80"
            y1="80"
            x2={80 + Math.cos((i * 45 * Math.PI) / 180) * 60}
            y2={80 + Math.sin((i * 45 * Math.PI) / 180) * 60}
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
          />
        ))}
      </motion.g>
      
      {/* Main checkmark circle */}
      <motion.g style={{ filter: glowFilter }}>
        <circle cx="80" cy="80" r="40" fill="url(#inboxGradient)" opacity="0.15" />
        <circle cx="80" cy="80" r="35" stroke={primaryColor} strokeWidth="3" fill="none" />
        
        {/* Animated checkmark */}
        <motion.path
          d="M60 80 L75 95 L105 65"
          stroke={primaryColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
      </motion.g>
      
      {/* Floating envelopes (cleared) */}
      {[
        { x: 25, y: 35, rotation: -15, delay: 0 },
        { x: 125, y: 40, rotation: 20, delay: 0.3 },
        { x: 30, y: 115, rotation: -10, delay: 0.6 },
        { x: 130, y: 120, rotation: 15, delay: 0.9 },
      ].map((env, i) => (
        <motion.g
          key={i}
          animate={shouldAnimate ? {
            y: [0, -8, 0],
            opacity: [0.3, 0.5, 0.3],
            rotate: [env.rotation, env.rotation + 5, env.rotation],
          } : { opacity: 0.3 }}
          transition={{ duration: 3, delay: env.delay, repeat: Infinity }}
          style={{ transformOrigin: `${env.x}px ${env.y}px` }}
        >
          <rect 
            x={env.x - 12} 
            y={env.y - 8} 
            width="24" 
            height="16" 
            rx="2" 
            fill="#2A2A2D" 
            stroke="#3A3A3D"
          />
          <path 
            d={`M${env.x - 10} ${env.y - 6} L${env.x} ${env.y + 2} L${env.x + 10} ${env.y - 6}`}
            stroke="#3A3A3D"
            fill="none"
          />
        </motion.g>
      ))}
      
      {/* Party elements */}
      {shouldAnimate && (
        <>
          <motion.text
            x="45" y="50"
            fontSize="20"
            animate={{ y: [0, -5, 0], rotate: [-10, 10, -10] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ transformOrigin: '45px 50px' }}
          >
            🎉
          </motion.text>
          <motion.text
            x="110" y="55"
            fontSize="16"
            animate={{ y: [0, -8, 0], rotate: [10, -10, 10] }}
            transition={{ duration: 2.5, delay: 0.5, repeat: Infinity }}
            style={{ transformOrigin: '110px 55px' }}
          >
            ⭐
          </motion.text>
          <motion.text
            x="40" y="125"
            fontSize="14"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨
          </motion.text>
        </>
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ILLUSTRATION: Magnifying Glass (for EmptySearch)
// ═══════════════════════════════════════════════════════════════════════════════
export function SearchIllustration({ glowLevel = 2, accentColor = 'brand', isFireMode = false }) {
  const glowFilter = getGlowFilter(glowLevel, isFireMode);
  const shouldAnimate = glowLevel >= 2;
  const primaryColor = isFireMode ? '#F43F5E' : '#8B5CF6';
  
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      
      {/* Magnifying glass */}
      <motion.g
        style={{ filter: glowFilter }}
        animate={shouldAnimate ? { rotate: [0, 5, 0, -5, 0] } : {}}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ transformOrigin: '70px 70px' }}
      >
        {/* Glass circle */}
        <circle cx="65" cy="65" r="35" stroke={primaryColor} strokeWidth="4" fill="none" />
        <circle cx="65" cy="65" r="30" fill={primaryColor} opacity="0.1" />
        
        {/* Shine */}
        <motion.path
          d="M45 50 Q55 40 60 45"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
          animate={shouldAnimate ? { opacity: [0.2, 0.5, 0.2] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Handle */}
        <line x1="90" y1="90" x2="125" y2="125" stroke={primaryColor} strokeWidth="8" strokeLinecap="round" />
      </motion.g>
      
      {/* Question marks floating */}
      {[
        { x: 20, y: 40, size: 18, delay: 0 },
        { x: 130, y: 35, size: 14, delay: 0.5 },
        { x: 25, y: 120, size: 16, delay: 1 },
      ].map((q, i) => (
        <motion.text
          key={i}
          x={q.x}
          y={q.y}
          fontSize={q.size}
          fill={primaryColor}
          opacity="0.4"
          animate={shouldAnimate ? {
            y: [0, -10, 0],
            opacity: [0.2, 0.5, 0.2],
          } : {}}
          transition={{ duration: 3, delay: q.delay, repeat: Infinity }}
        >
          ?
        </motion.text>
      ))}
      
      {/* Dots suggesting content */}
      <g opacity="0.3">
        <rect x="50" y="55" width="30" height="3" rx="1.5" fill="#3A3A3D" />
        <rect x="50" y="65" width="20" height="3" rx="1.5" fill="#3A3A3D" />
        <rect x="50" y="75" width="25" height="3" rx="1.5" fill="#3A3A3D" />
      </g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ILLUSTRATION: Trophy/Victory (for AllShipped)
// ═══════════════════════════════════════════════════════════════════════════════
export function TrophyIllustration({ glowLevel = 2, accentColor = 'brand', isFireMode = false }) {
  const glowFilter = getGlowFilter(glowLevel, isFireMode);
  const shouldAnimate = glowLevel >= 2 || isFireMode;
  const primaryColor = isFireMode ? '#F43F5E' : '#F59E0B'; // Gold/warning for trophy
  const secondaryColor = isFireMode ? '#FB7185' : '#FBBF24';
  
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={secondaryColor} />
          <stop offset="100%" stopColor={primaryColor} />
        </linearGradient>
      </defs>
      
      {/* Glow behind trophy */}
      <motion.circle
        cx="80" cy="70" r="45"
        fill={primaryColor}
        opacity="0.15"
        animate={shouldAnimate ? { 
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Trophy */}
      <motion.g
        style={{ filter: glowFilter }}
        animate={shouldAnimate ? { y: [0, -3, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Cup body */}
        <path
          d="M55 35 L55 70 Q55 90 80 95 Q105 90 105 70 L105 35 Z"
          fill="url(#trophyGradient)"
        />
        
        {/* Handles */}
        <path
          d="M55 45 Q35 45 35 60 Q35 75 55 75"
          stroke={primaryColor}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M105 45 Q125 45 125 60 Q125 75 105 75"
          stroke={primaryColor}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Star on trophy */}
        <motion.path
          d="M80 50 L83 58 L92 58 L85 64 L88 72 L80 67 L72 72 L75 64 L68 58 L77 58 Z"
          fill="#1A1A1D"
          animate={shouldAnimate ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ transformOrigin: '80px 61px' }}
        />
        
        {/* Base */}
        <rect x="70" y="95" width="20" height="8" fill={primaryColor} />
        <rect x="60" y="103" width="40" height="10" rx="2" fill={primaryColor} opacity="0.8" />
        <rect x="55" y="113" width="50" height="12" rx="2" fill="#2A2A2D" stroke={primaryColor} strokeWidth="2" />
      </motion.g>
      
      {/* Confetti / sparkles */}
      {shouldAnimate && (
        <>
          {[
            { x: 30, y: 30, emoji: '🎊', delay: 0 },
            { x: 125, y: 35, emoji: '✨', delay: 0.3 },
            { x: 25, y: 100, emoji: '⭐', delay: 0.6 },
            { x: 130, y: 95, emoji: '🎉', delay: 0.9 },
          ].map((item, i) => (
            <motion.text
              key={i}
              x={item.x}
              y={item.y}
              fontSize="16"
              animate={{
                y: [0, -8, 0],
                rotate: [-10, 10, -10],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, delay: item.delay, repeat: Infinity }}
              style={{ transformOrigin: `${item.x}px ${item.y}px` }}
            >
              {item.emoji}
            </motion.text>
          ))}
        </>
      )}
      
      {/* "#1" text */}
      <text x="72" y="140" fontSize="10" fill="#5A5A5D" fontWeight="bold">#1</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ILLUSTRATION: Team/People (for EmptyTeam)
// ═══════════════════════════════════════════════════════════════════════════════
export function TeamIllustration({ glowLevel = 2, accentColor = 'brand', isFireMode = false }) {
  const glowFilter = getGlowFilter(glowLevel, isFireMode);
  const shouldAnimate = glowLevel >= 2;
  const primaryColor = isFireMode ? '#F43F5E' : '#8B5CF6';
  const secondaryColor = '#06B6D4';
  
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Connection lines */}
      <motion.g
        opacity="0.3"
        animate={shouldAnimate ? { opacity: [0.2, 0.4, 0.2] } : {}}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <line x1="80" y1="60" x2="45" y2="95" stroke={primaryColor} strokeWidth="2" strokeDasharray="4 4" />
        <line x1="80" y1="60" x2="115" y2="95" stroke={secondaryColor} strokeWidth="2" strokeDasharray="4 4" />
      </motion.g>
      
      {/* Main user (you) */}
      <motion.g
        style={{ filter: glowFilter }}
        animate={shouldAnimate ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ transformOrigin: '80px 50px' }}
      >
        <circle cx="80" cy="40" r="18" fill={primaryColor} />
        <circle cx="80" cy="35" r="8" fill="#1A1A1D" />
        <path d="M68 50 Q80 65 92 50" fill="#1A1A1D" />
      </motion.g>
      
      {/* Empty teammate slots */}
      {[
        { x: 45, y: 105, delay: 0 },
        { x: 115, y: 105, delay: 0.5 },
      ].map((slot, i) => (
        <motion.g
          key={i}
          animate={shouldAnimate ? { 
            y: [0, -3, 0],
            opacity: [0.5, 0.8, 0.5]
          } : { opacity: 0.5 }}
          transition={{ duration: 2, delay: slot.delay, repeat: Infinity }}
        >
          <circle 
            cx={slot.x} 
            cy={slot.y} 
            r="20" 
            fill="none" 
            stroke="#3A3A3D" 
            strokeWidth="2" 
            strokeDasharray="8 4"
          />
          <text 
            x={slot.x} 
            y={slot.y + 5} 
            fontSize="24" 
            textAnchor="middle" 
            fill="#3A3A3D"
          >
            +
          </text>
        </motion.g>
      ))}
      
      {/* "Invite" sparkle */}
      {shouldAnimate && (
        <motion.text
          x="80" y="145"
          fontSize="12"
          textAnchor="middle"
          fill={primaryColor}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨ Invite teammates
        </motion.text>
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ILLUSTRATION: Timeline/Activity (for EmptyActivity)
// ═══════════════════════════════════════════════════════════════════════════════
export function ActivityIllustration({ glowLevel = 2, accentColor = 'brand', isFireMode = false }) {
  const glowFilter = getGlowFilter(glowLevel, isFireMode);
  const shouldAnimate = glowLevel >= 2;
  const primaryColor = isFireMode ? '#F43F5E' : '#8B5CF6';
  
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Timeline line */}
      <line x1="40" y1="30" x2="40" y2="130" stroke="#2A2A2D" strokeWidth="3" strokeLinecap="round" />
      
      {/* Timeline dots (empty) */}
      {[40, 65, 90, 115].map((y, i) => (
        <motion.g key={i}>
          <circle 
            cx="40" 
            cy={y} 
            r="8" 
            fill="#1A1A1D" 
            stroke="#3A3A3D" 
            strokeWidth="2"
            strokeDasharray={i === 0 ? "0" : "4 2"}
          />
          {i === 0 && (
            <motion.circle
              cx="40"
              cy={y}
              r="4"
              fill={primaryColor}
              animate={shouldAnimate ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.g>
      ))}
      
      {/* Content placeholders */}
      <motion.g style={{ filter: glowFilter }}>
        {/* First item (highlighted - "Start here") */}
        <rect x="55" y="30" width="90" height="20" rx="4" fill={primaryColor} opacity="0.2" />
        <rect x="60" y="36" width="50" height="3" rx="1.5" fill={primaryColor} opacity="0.5" />
        <rect x="60" y="42" width="30" height="2" rx="1" fill={primaryColor} opacity="0.3" />
        
        {/* Empty placeholders */}
        {[65, 90, 115].map((y, i) => (
          <g key={i} opacity="0.3">
            <rect x="55" y={y - 5} width="80" height="15" rx="3" fill="#2A2A2D" />
            <rect x="60" y={y} width="40" height="2" rx="1" fill="#3A3A3D" />
          </g>
        ))}
      </motion.g>
      
      {/* Animated pen/cursor */}
      {shouldAnimate && (
        <motion.g
          animate={{
            x: [0, 5, 0],
            y: [0, 2, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <path
            d="M150 25 L145 35 L155 35 Z"
            fill={primaryColor}
          />
          <rect x="147" y="35" width="6" height="20" fill={primaryColor} opacity="0.8" />
        </motion.g>
      )}
      
      {/* "Your story starts now" */}
      <text x="80" y="150" fontSize="10" textAnchor="middle" fill="#5A5A5D">
        Your story begins...
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL ILLUSTRATIONS
// ═══════════════════════════════════════════════════════════════════════════════
export default {
  Rocket: RocketIllustration,
  Canvas: CanvasIllustration,
  InboxZero: InboxZeroIllustration,
  Search: SearchIllustration,
  Trophy: TrophyIllustration,
  Team: TeamIllustration,
  Activity: ActivityIllustration,
};
