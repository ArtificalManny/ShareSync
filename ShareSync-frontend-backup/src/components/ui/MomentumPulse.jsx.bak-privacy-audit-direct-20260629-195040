// src/components/ui/MomentumPulse.jsx
import React from 'react';
import { useMomentumContext } from '../../contexts/MomentumContext';

export default function MomentumPulse() {
  const { glowLevel, isFireMode } = useMomentumContext();

  // Dynamically calculate pulse properties based on current momentum
  let color = 'rgba(139, 92, 246, 0.4)'; // Level 0/1: Cool Violet
  let shadowColor = 'rgba(139, 92, 246, 0.6)';
  let duration = '4s'; // Slow, calm resting heartbeat
  let scaleBase = 0.9;
  let scalePeak = 1.1;

  if (isFireMode) {
    color = 'rgba(249, 115, 22, 0.8)'; // Fire Mode: Burning Orange
    shadowColor = 'rgba(249, 115, 22, 1)';
    duration = '0.8s'; // Rapid, energetic heartbeat
    scaleBase = 1.0;
    scalePeak = 1.3;
  } else if (glowLevel >= 4) {
    color = 'rgba(16, 185, 129, 0.7)'; // Level 4/5: High-velocity Emerald
    shadowColor = 'rgba(16, 185, 129, 0.9)';
    duration = '1.5s'; 
    scaleBase = 0.95;
    scalePeak = 1.2;
  } else if (glowLevel >= 2) {
    color = 'rgba(139, 92, 246, 0.7)'; // Level 2/3: Active Violet
    shadowColor = 'rgba(139, 92, 246, 0.9)';
    duration = '2.5s';
    scaleBase = 0.9;
    scalePeak = 1.15;
  }

  return (
    <div className="relative flex items-center justify-center w-6 h-6 mx-1" title="Momentum Heartbeat">
      {/* The Breathing Aura */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 12px ${shadowColor}`,
          animation: `orb-heartbeat ${duration} ease-in-out infinite`,
        }}
      />
      
      {/* The Solid Core */}
      <div 
        className="w-2 h-2 bg-white rounded-full relative z-10 transition-transform duration-500" 
        style={{ transform: isFireMode ? 'scale(1.2)' : 'scale(1)' }}
      />
      
      {/* Dynamic Keyframes to control the exact CSS scaling dynamically */}
      <style>{`
        @keyframes orb-heartbeat {
          0%, 100% { transform: scale(${scaleBase}); opacity: 0.6; }
          50% { transform: scale(${scalePeak}); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
