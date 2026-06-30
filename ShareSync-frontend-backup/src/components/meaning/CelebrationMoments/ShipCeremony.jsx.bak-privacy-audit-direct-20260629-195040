// src/components/meaning/CelebrationMoments/ShipCeremony.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MEANING LAYER: Ship Ceremony
// The ultimate celebration - when a project is shipped!
// Full ceremony with countdown, sounds, and team celebration
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  X, Rocket, Zap, Users, Star, Trophy,
  Sparkles, ChevronRight, Share2, Camera, 
  Play, Volume2, VolumeX, PartyPopper
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTDOWN DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

function CountdownDisplay({ count, onComplete }) {
  const [current, setCurrent] = useState(count);
  
  useEffect(() => {
    if (current <= 0) {
      onComplete?.();
      return;
    }
    
    const timer = setTimeout(() => {
      setCurrent(c => c - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [current, onComplete]);
  
  if (current <= 0) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="text-center">
        <div
          className="text-9xl font-bold text-brand-400 animate-bounce"
          style={{
            textShadow: '0 0 60px rgba(124, 58, 237, 0.5)',
          }}
        >
          {current}
        </div>
        <div className="text-2xl text-text-secondary mt-4">
          Get ready to ship! 🚀
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIREWORK EXPLOSION
// ═══════════════════════════════════════════════════════════════════════════════

function Fireworks({ active }) {
  const [explosions, setExplosions] = useState([]);
  
  useEffect(() => {
    if (!active) {
      setExplosions([]);
      return;
    }
    
    // Generate firework explosions at random positions
    const interval = setInterval(() => {
      setExplosions(prev => [
        ...prev.slice(-10), // Keep last 10
        {
          id: Date.now(),
          x: Math.random() * 80 + 10,
          y: Math.random() * 60 + 10,
          color: ['#7C3AED', '#10B981', '#F59E0B', '#06B6D4', '#EC4899'][
            Math.floor(Math.random() * 5)
          ],
        },
      ]);
    }, 300);
    
    return () => clearInterval(interval);
  }, [active]);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {explosions.map(exp => (
        <div
          key={exp.id}
          className="absolute"
          style={{
            left: `${exp.x}%`,
            top: `${exp.y}%`,
          }}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: exp.color,
                animation: `firework-particle 1s ease-out forwards`,
                transform: `rotate(${i * 30}deg)`,
                '--angle': `${i * 30}deg`,
              }}
            />
          ))}
        </div>
      ))}
      
      <style>{`
        @keyframes firework-particle {
          0% {
            transform: rotate(var(--angle)) translateY(0);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--angle)) translateY(100px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM CLAP REACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function TeamClaps({ members = [], active }) {
  const [claps, setClaps] = useState([]);
  
  useEffect(() => {
    if (!active || members.length === 0) return;
    
    // Simulate team members clapping
    const interval = setInterval(() => {
      const member = members[Math.floor(Math.random() * members.length)];
      setClaps(prev => [
        ...prev.slice(-20),
        {
          id: Date.now(),
          name: member.name,
          avatar: member.avatar,
          emoji: ['👏', '🎉', '🚀', '⭐', '��'][Math.floor(Math.random() * 5)],
          x: Math.random() * 60 + 20,
        },
      ]);
    }, 400);
    
    return () => clearInterval(interval);
  }, [active, members]);
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-40 pointer-events-none overflow-hidden z-40">
      {claps.map(clap => (
        <div
          key={clap.id}
          className="absolute bottom-0 flex flex-col items-center"
          style={{
            left: `${clap.x}%`,
            animation: 'clap-rise 2s ease-out forwards',
          }}
        >
          <span className="text-2xl">{clap.emoji}</span>
          <span className="text-xs text-text-tertiary">{clap.name}</span>
        </div>
      ))}
      
      <style>{`
        @keyframes clap-rise {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-160px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SHIP CEREMONY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ShipCeremony - Full ship ceremony experience
 */
export function ShipCeremony({
  isOpen,
  onClose,
  onShip,
  project,
  stats = {},
  teamMembers = [],
  showCountdown = true,
}) {
  const [phase, setPhase] = useState('idle'); // idle | countdown | celebration
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [screenshotTaken, setScreenshotTaken] = useState(false);
  
  const {
    totalXP = 0,
    tasksCompleted = 0,
    sprints = 0,
    daysWorked = 0,
    contributors = [],
  } = stats;
  
  // Handle ship button click
  const handleShipClick = useCallback(() => {
    if (showCountdown) {
      setPhase('countdown');
    } else {
      setPhase('celebration');
      onShip?.();
    }
  }, [showCountdown, onShip]);
  
  // Handle countdown complete
  const handleCountdownComplete = useCallback(() => {
    setPhase('celebration');
    onShip?.();
    
    // Play ship sound
    if (soundEnabled) {
      // TODO: Integrate with sound system
      // playShipSound();
    }
  }, [onShip, soundEnabled]);
  
  // Handle close
  const handleClose = useCallback(() => {
    setPhase('idle');
    setScreenshotTaken(false);
    onClose?.();
  }, [onClose]);
  
  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setPhase('idle');
      setScreenshotTaken(false);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  // Countdown phase
  if (phase === 'countdown') {
    return (
      <CountdownDisplay 
        count={3} 
        onComplete={handleCountdownComplete}
      />
    );
  }
  
  // Celebration phase
  if (phase === 'celebration') {
    return (
      <div className="fixed inset-0 z-50">
        {/* Fireworks */}
        <Fireworks active={true} />
        
        {/* Team claps */}
        <TeamClaps members={teamMembers} active={true} />
        
        {/* Content */}
        <div className="relative h-full flex items-center justify-center p-4">
          <div className="
            relative z-10 w-full max-w-lg
            bg-surface-0/95 backdrop-blur-md
            border border-white/[0.08] rounded-2xl
            overflow-hidden shadow-2xl
          ">
            {/* Header */}
            <div className="relative h-32 bg-gradient-to-b from-brand-500/30 to-transparent flex items-center justify-center">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
              
              <div className="text-center">
                <div className="text-6xl mb-2 animate-bounce">🚀</div>
                <h2 className="text-3xl font-bold text-text-primary">
                  SHIPPED!
                </h2>
              </div>
            </div>
            
            {/* Project info */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-xl font-semibold text-brand-400 mb-1">
                  {project?.name || 'Project'}
                </div>
                <div className="text-sm text-text-tertiary">
                  {project?.description || 'Successfully shipped to the world!'}
                </div>
              </div>
              
              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="text-center p-3 rounded-xl bg-surface-1">
                  <Zap className="w-5 h-5 text-warning-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-text-primary">{totalXP}</div>
                  <div className="text-[10px] text-text-tertiary">XP Earned</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-surface-1">
                  <Trophy className="w-5 h-5 text-success-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-text-primary">{tasksCompleted}</div>
                  <div className="text-[10px] text-text-tertiary">Tasks</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-surface-1">
                  <Rocket className="w-5 h-5 text-cyan-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-text-primary">{sprints}</div>
                  <div className="text-[10px] text-text-tertiary">Sprints</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-surface-1">
                  <Users className="w-5 h-5 text-brand-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-text-primary">{contributors.length || teamMembers.length}</div>
                  <div className="text-[10px] text-text-tertiary">Team</div>
                </div>
              </div>
              
              {/* Contributors */}
              {(contributors.length > 0 || teamMembers.length > 0) && (
                <div className="mb-6 p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
                  <div className="text-xs text-text-tertiary mb-3">🎉 Ship Crew</div>
                  <div className="flex flex-wrap gap-2">
                    {(contributors.length > 0 ? contributors : teamMembers).map((member, idx) => (
                      <div
                        key={member.id || idx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2"
                      >
                        <span className="text-sm">{member.avatar || '👤'}</span>
                        <span className="text-xs text-text-secondary">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="
                    flex-1 py-3 rounded-xl
                    bg-brand-500 text-white font-medium
                    hover:bg-brand-400 transition-colors
                    flex items-center justify-center gap-2
                  "
                >
                  <PartyPopper className="w-5 h-5" />
                  <span>Celebrate!</span>
                </button>
                
                <button
                  onClick={() => setScreenshotTaken(true)}
                  className="
                    px-4 py-3 rounded-xl
                    bg-surface-1 text-text-secondary
                    border border-white/[0.06]
                    hover:bg-surface-2 transition-colors
                  "
                  title="Screenshot"
                >
                  <Camera className="w-5 h-5" />
                </button>
                
                <button
                  className="
                    px-4 py-3 rounded-xl
                    bg-surface-1 text-text-secondary
                    border border-white/[0.06]
                    hover:bg-surface-2 transition-colors
                  "
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Pre-ship phase (idle)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Content */}
      <div className="
        relative z-10 w-full max-w-md
        bg-surface-0 border border-white/[0.08] rounded-2xl
        overflow-hidden shadow-2xl
      ">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.06]">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-1 transition-colors"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Rocket className="w-8 h-8 text-brand-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Ready to Ship?
              </h2>
              <p className="text-sm text-text-tertiary">
                {project?.name || 'This project'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Summary */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-surface-1 text-center">
              <div className="text-2xl font-bold text-success-400">{tasksCompleted}</div>
              <div className="text-xs text-text-tertiary">Tasks Completed</div>
            </div>
            <div className="p-4 rounded-xl bg-surface-1 text-center">
              <div className="text-2xl font-bold text-warning-500">+{totalXP}</div>
              <div className="text-xs text-text-tertiary">XP to Earn</div>
            </div>
          </div>
          
          {/* Sound toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-1 mb-6">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-text-tertiary" />
              ) : (
                <VolumeX className="w-4 h-4 text-text-tertiary" />
              )}
              <span className="text-sm text-text-secondary">Ship sounds</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`
                w-10 h-6 rounded-full transition-colors
                ${soundEnabled ? 'bg-brand-500' : 'bg-surface-2'}
              `}
            >
              <div className={`
                w-4 h-4 rounded-full bg-white shadow transition-transform
                ${soundEnabled ? 'translate-x-5' : 'translate-x-1'}
              `} />
            </button>
          </div>
          
          {/* Ship button */}
          <button
            onClick={handleShipClick}
            className="
              w-full py-4 rounded-xl
              bg-gradient-to-r from-brand-500 to-brand-600
              text-white text-lg font-bold
              hover:from-brand-400 hover:to-brand-500
              transition-all duration-200
              transform hover:scale-[1.02]
              shadow-lg shadow-brand-500/25
              flex items-center justify-center gap-3
            "
          >
            <Rocket className="w-6 h-6" />
            <span>SHIP IT!</span>
            <Sparkles className="w-6 h-6" />
          </button>
          
          <p className="text-center text-xs text-text-tertiary mt-4">
            {showCountdown 
              ? 'A 3-second countdown will begin' 
              : 'Click to ship and celebrate!'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default ShipCeremony;
