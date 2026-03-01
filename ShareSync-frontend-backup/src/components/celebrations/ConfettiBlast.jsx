// src/components/celebrations/ConfettiBlast.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 4.2: Student-mode confetti + emoji rain animation
// Pure CSS/DOM animation — no canvas dependency
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useRef } from 'react';

const CONFETTI_COLORS = [
  '#7C3AED', '#A855F7', '#EC4899', '#F59E0B',
  '#10B981', '#3B82F6', '#06B6D4', '#F43F5E',
];

const EMOJIS = ['🎉', '🔥', '⚡', '🚀', '✨', '💎', '��', '🎮', '💪', '⭐'];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// ── Single confetti particle ─────────────────────────────────────────────
function ConfettiParticle({ color, delay, duration }) {
  const style = {
    position: 'absolute',
    top: '-10px',
    left: `${randomBetween(5, 95)}%`,
    width: `${randomBetween(6, 12)}px`,
    height: `${randomBetween(6, 12)}px`,
    backgroundColor: color,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    opacity: 0,
    animation: `confetti-fall ${duration}ms ${delay}ms ease-out forwards`,
    transform: `rotate(${randomBetween(0, 360)}deg)`,
    pointerEvents: 'none',
  };

  return <div style={style} />;
}

// ── Single emoji particle ────────────────────────────────────────────────
function EmojiParticle({ emoji, delay, duration }) {
  const style = {
    position: 'absolute',
    top: '-30px',
    left: `${randomBetween(10, 90)}%`,
    fontSize: `${randomBetween(16, 28)}px`,
    opacity: 0,
    animation: `emoji-rain ${duration}ms ${delay}ms ease-out forwards`,
    pointerEvents: 'none',
    userSelect: 'none',
  };

  return <span style={style}>{emoji}</span>;
}

export default function ConfettiBlast({
  show = false,
  duration = 3000,
  particleCount = 40,
  showEmojiRain = true,
  emojiCount = 12,
  onComplete,
}) {
  const [particles, setParticles] = useState([]);
  const [emojis, setEmojis] = useState([]);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!show) {
      setParticles([]);
      setEmojis([]);
      completedRef.current = false;
      return;
    }

    // Generate confetti
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: `c-${i}`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: randomBetween(0, duration * 0.3),
      duration: randomBetween(duration * 0.5, duration),
    }));
    setParticles(newParticles);

    // Generate emoji rain
    if (showEmojiRain) {
      const newEmojis = Array.from({ length: emojiCount }, (_, i) => ({
        id: `e-${i}`,
        emoji: EMOJIS[i % EMOJIS.length],
        delay: randomBetween(100, duration * 0.4),
        duration: randomBetween(duration * 0.6, duration),
      }));
      setEmojis(newEmojis);
    }

    // Cleanup after duration
    const timer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }, duration + 500);

    return () => clearTimeout(timer);
  }, [show, duration, particleCount, showEmojiRain, emojiCount, onComplete]);

  if (!show && particles.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      {/* Confetti */}
      {particles.map((p) => (
        <ConfettiParticle key={p.id} {...p} />
      ))}

      {/* Emoji rain */}
      {emojis.map((e) => (
        <EmojiParticle key={e.id} {...e} />
      ))}

      {/* Screen flash for student mode */}
      {show && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
            animation: 'celebration-flash 400ms ease-out forwards',
          }}
        />
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(${randomBetween(360, 1080)}deg) scale(0.3);
          }
        }

        @keyframes emoji-rain {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.5);
          }
          30% {
            opacity: 1;
            transform: translateY(20vh) scale(1.2);
          }
          80% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(90vh) scale(0.6);
          }
        }

        @keyframes celebration-flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
