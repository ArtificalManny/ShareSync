// src/components/project/hero/ShipUpdateButton.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: Ship Update Button with Particle Animation
// ═══════════════════════════════════════════════════════════════════════════════
//
// The primary action button for shipping updates.
// - Glows at high momentum levels
// - Shows particle burst on click
// - Opens ship modal
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback } from 'react';
import { Rocket, X, Loader2, Sparkles } from 'lucide-react';

export default function ShipUpdateButton({ 
  onShip, 
  loading = false,
  momentumLevel = 0,
  variant = 'primary',
}) {
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [particles, setParticles] = useState([]);
  const buttonRef = useRef(null);

  // Particle burst animation
  const triggerParticles = useCallback(() => {
    const newParticles = [];
    const count = 12;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      newParticles.push({
        id: Date.now() + i,
        angle,
        distance: 40 + Math.random() * 30,
      });
    }
    
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 600);
  }, []);

  const handleShip = async () => {
    if (!description.trim()) return;
    
    triggerParticles();
    
    try {
      await onShip?.(description);
      setDescription('');
      setShowModal(false);
    } catch (error) {
      console.error('Ship failed:', error);
    }
  };

  // Dynamic styles based on momentum level
  const getButtonStyles = () => {
    const base = `
      relative h-11 px-5 rounded-xl
      font-medium text-sm
      flex items-center gap-2
      transition-all duration-200
      overflow-visible
    `;

    if (momentumLevel >= 5) {
      // Fire mode
      return `${base} bg-gradient-to-r from-energy-500 to-brand text-white shadow-glow-energy animate-pulse`;
    }
    if (momentumLevel >= 4) {
      // Surging
      return `${base} bg-gradient-to-r from-brand to-cyan-500 text-white shadow-glow-brand`;
    }
    if (momentumLevel >= 3) {
      // Flowing
      return `${base} bg-brand text-white hover:bg-brand-600 hover:shadow-glow-brand`;
    }
    
    // Default
    return `${base} bg-brand text-white hover:bg-brand-600 hover:shadow-glow-brand`;
  };

  return (
    <>
      {/* Ship Button */}
      <button
        ref={buttonRef}
        onClick={() => setShowModal(true)}
        disabled={loading}
        className={getButtonStyles()}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : momentumLevel >= 5 ? (
          <Sparkles className="w-4 h-4" />
        ) : (
          <Rocket className="w-4 h-4" />
        )}
        Ship Update
        
        {/* Particles */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute w-2 h-2 rounded-full bg-brand pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              animation: 'particle-burst 600ms ease-out forwards',
              '--angle': `${p.angle}rad`,
              '--distance': `${p.distance}px`,
            }}
          />
        ))}
      </button>

      {/* Ship Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="
            w-full max-w-xl p-8 rounded-2xl
            bg-surface-1 border border-white/[0.08]
            shadow-2xl
            animate-in fade-in zoom-in-95 duration-200
          ">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary">Ship Update</h2>
                <p className="text-sm text-text-tertiary mt-1">
                  Share what you built with your team
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
              >
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>

            {/* Input */}
            <textarea
              className="
                w-full p-4 rounded-xl
                bg-surface-2 border border-white/[0.06]
                text-text-primary text-base
                placeholder:text-text-tertiary
                focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/20
                resize-none h-40 mb-6
                transition-all
              "
              placeholder="What did you build today? What's the impact?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />

            {/* Commitment Prompt */}
            <div className="mb-6 p-4 rounded-xl bg-surface-2/50 border border-white/[0.04]">
              <p className="text-xs text-text-tertiary mb-2">
                💡 What will you ship before the next check-in?
              </p>
              <input
                type="text"
                className="
                  w-full p-3 rounded-lg
                  bg-surface-3 border border-white/[0.04]
                  text-text-primary text-sm
                  placeholder:text-text-tertiary
                  focus:outline-none focus:border-brand/30
                  transition-colors
                "
                placeholder="e.g., Complete user flow documentation..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="
                  flex-1 py-3 rounded-xl
                  bg-surface-2 text-text-secondary font-medium
                  hover:bg-surface-3
                  transition-colors
                "
              >
                Cancel
              </button>
              <button 
                onClick={handleShip}
                disabled={loading || !description.trim()}
                className="
                  flex-1 py-3 rounded-xl
                  bg-brand text-white font-medium
                  hover:bg-brand-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all
                  flex items-center justify-center gap-2
                "
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4" />
                )}
                Broadcast Ship
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Particle Animation Styles */}
      <style>{`
        @keyframes particle-burst {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translateX(0);
            opacity: 1;
            scale: 1;
          }
          Available {
            transform: translate(-50%, -50%) rotate(calc(var(--angle) * 1rad)) translateX(var(--distance));
            opacity: 0;
            scale: 0;
          }
        }
      `}</style>
    </>
  );
}
