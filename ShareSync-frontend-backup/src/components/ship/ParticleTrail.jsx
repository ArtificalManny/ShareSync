// src/components/ship/ParticleTrail.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8: Rocket Exhaust Particle Effect
// ═══════════════════════════════════════════════════════════════════════════════
// 
// NOT confetti - this is rocket exhaust.
// Subtle particles that trail behind the card as it ships off.
// 
// Design:
// - Small particles (2-4px)
// - Brand purple + white colors
// - Fade and drift left as card moves right
// - Short lifespan (400-600ms)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';

// Single particle
function Particle({ x, y, color, size, duration, delay }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
        animation: `particle-drift ${duration}ms ease-out ${delay}ms forwards`,
        opacity: 0,
      }}
    />
  );
}

export default function ParticleTrail({ 
  active = false,
  originX = 0, // Starting X position (left edge of card)
  originY = '50%', // Starting Y position (middle of card)
  count = 12, // Number of particles
  className = '',
}) {
  const [particles, setParticles] = useState([]);

  // Generate particles when active
  const generateParticles = useCallback(() => {
    const colors = [
      'var(--brand-400)',
      'var(--brand-500)',
      'var(--brand-300)',
      'rgba(255, 255, 255, 0.6)',
      'rgba(255, 255, 255, 0.4)',
    ];

    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      x: originX + Math.random() * 20, // Slight horizontal spread
      y: typeof originY === 'string' 
        ? `calc(${originY} + ${(Math.random() - 0.5) * 40}px)` 
        : originY + (Math.random() - 0.5) * 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 3, // 2-5px
      duration: 400 + Math.random() * 200, // 400-600ms
      delay: i * 30, // Stagger slightly
    }));

    setParticles(newParticles);
  }, [originX, originY, count]);

  // Trigger particles when active changes to true
  useEffect(() => {
    if (active) {
      generateParticles();
      
      // Clear particles after animation completes
      const timer = setTimeout(() => {
        setParticles([]);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [active, generateParticles]);

  if (!active && particles.length === 0) return null;

  return (
    <div className={`absolute inset-0 overflow-visible pointer-events-none ${className}`}>
      {particles.map(particle => (
        <Particle key={particle.id} {...particle} />
      ))}
      
      {/* Inline keyframes for particle animation */}
      <style>{`
        @keyframes particle-drift {
          0% {
            opacity: 0.8;
            transform: translateX(0) translateY(0) scale(1);
          }
          50% {
            opacity: 0.6;
          }
          100% {
            opacity: 0;
            transform: translateX(-60px) translateY(${Math.random() > 0.5 ? '-' : ''}${10 + Math.random() * 20}px) scale(0.3);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * ParticleBurst - For celebration moments (level up, etc.)
 * More dramatic than trail - explodes outward
 */
export function ParticleBurst({
  active = false,
  x = '50%',
  y = '50%',
  count = 20,
  colors = ['var(--brand-400)', 'var(--success-400)', 'var(--warning-400)'],
}) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (active) {
      const newParticles = Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const velocity = 50 + Math.random() * 50;
        
        return {
          id: `burst-${Date.now()}-${i}`,
          angle,
          velocity,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 4,
          duration: 600 + Math.random() * 300,
        };
      });

      setParticles(newParticles);
      
      const timer = setTimeout(() => setParticles([]), 1000);
      return () => clearTimeout(timer);
    }
  }, [active, count, colors]);

  if (!active && particles.length === 0) return null;

  return (
    <div 
      className="absolute pointer-events-none"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            animation: `burst-particle ${particle.duration}ms ease-out forwards`,
            '--burst-x': `${Math.cos(particle.angle) * particle.velocity}px`,
            '--burst-y': `${Math.sin(particle.angle) * particle.velocity}px`,
          }}
        />
      ))}
      
      <style>{`
        @keyframes burst-particle {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--burst-x), var(--burst-y)) scale(0);
          }
        }
      `}</style>
    </div>
  );
}
