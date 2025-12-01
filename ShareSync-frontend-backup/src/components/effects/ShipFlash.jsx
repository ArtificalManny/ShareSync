/**
 * ShipFlash.jsx
 * Gold flash + confetti celebration when someone ships
 * 
 * Triggered by 'cursor:ship' window event
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfettiGenerator } from '../../utils/cursorAnimations';

const confettiGen = new ConfettiGenerator();

function ShipFlash() {
  const [isActive, setIsActive] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [shipUser, setShipUser] = useState(null);

  // Listen for ship events
  useEffect(() => {
    const handleShip = (event) => {
      const { userId } = event.detail;
      
      console.log('🚢 Ship flash triggered by:', userId);
      
      setShipUser(userId);
      setIsActive(true);

      // Generate confetti
      const newConfetti = confettiGen.generate(150, { x: 50, y: 50 });
      setConfetti(newConfetti);

      // Hide flash after 1 second
      setTimeout(() => {
        setIsActive(false);
      }, 1000);

      // Clear confetti after 3 seconds
      setTimeout(() => {
        setConfetti([]);
        setShipUser(null);
      }, 3000);
    };

    window.addEventListener('cursor:ship', handleShip);

    return () => {
      window.removeEventListener('cursor:ship', handleShip);
    };
  }, []);

  // Animate confetti
  useEffect(() => {
    if (confetti.length === 0) return;

    const interval = setInterval(() => {
      setConfetti((prev) => confettiGen.update(prev));
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [confetti.length]);

  return (
    <>
      {/* Gold flash overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 9997,
            }}
          />
        )}
      </AnimatePresence>

      {/* Confetti particles */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9998,
          overflow: 'hidden',
        }}
      >
        {confetti.map((piece) => (
          <div
            key={piece.id}
            style={{
              position: 'absolute',
              left: `${piece.x}%`,
              top: `${piece.y}%`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg)`,
              opacity: piece.opacity,
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
            }}
          />
        ))}
      </div>

      {/* Optional: Ship notification banner */}
      <AnimatePresence>
        {shipUser && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
              position: 'fixed',
              top: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
              borderRadius: 999,
              color: '#000',
              fontWeight: 700,
              fontSize: 16,
              boxShadow: '0 8px 24px rgba(251, 191, 36, 0.4)',
              pointerEvents: 'none',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 24 }}>🚢</span>
            <span>Someone just shipped!</span>
            <span style={{ fontSize: 24 }}>✨</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ShipFlash;