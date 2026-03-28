// src/components/gamification/ShippingCeremony.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4: Signature - The Shipping Ceremony
// ═══════════════════════════════════════════════════════════════════════════════
// A world-class reward mechanic. When a user ships, we take over the screen 
// for exactly 2.5 seconds to deliver a concentrated dose of dopamine.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Star } from 'lucide-react';

const ConfettiParticle = ({ delay, xOffset, color }) => {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: 0, scale: 0, rotate: 0 }}
      animate={{ 
        opacity: [1, 1, 0], 
        y: -300 - Math.random() * 200, 
        x: xOffset, 
        scale: [0, 1.5, 0.5],
        rotate: 360 * (Math.random() > 0.5 ? 1 : -1)
      }}
      transition={{ duration: 1.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute top-1/2 left-1/2 w-3 h-3 rounded-sm ${color}`}
      style={{ marginLeft: '-6px', marginTop: '-6px' }}
    />
  );
};

export default function ShippingCeremony({ 
  isActive, 
  projectName, 
  xpEarned = 50, 
  onComplete 
}) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (isActive) {
      // Generate 40 deterministic particles for performance
      const colors = ['bg-[var(--theme-accent-primary)]', 'bg-fuchsia-500', 'bg-amber-400', 'bg-emerald-400'];
      const newParticles = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        delay: Math.random() * 0.2,
        xOffset: (Math.random() - 0.5) * 400,
        color: colors[i % colors.length]
      }));
      setParticles(newParticles);

      // Auto-dismiss after 2.5s
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md pointer-events-none"
        >
          {/* Confetti Burst */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map(p => (
              <ConfettiParticle key={p.id} delay={p.delay} xOffset={p.xOffset} color={p.color} />
            ))}
          </div>

          {/* Main Content Modal */}
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative bg-white dark:bg-[#1f1f23] p-10 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col items-center text-center max-w-sm w-full mx-4"
            style={{
              boxShadow: '0 20px 60px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <motion.div 
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--theme-accent-primary)] to-fuchsia-500 flex items-center justify-center shadow-lg mb-6"
            >
              <Rocket className="w-10 h-10 text-white fill-white/20" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-[var(--theme-accent-primary)] mb-2">
                Mission Accomplished
              </h2>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                {projectName}
              </h3>
              <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">
                Shipped successfully.
              </p>
            </motion.div>

            {/* XP Reward Ribbon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="mt-8 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-2 rounded-full flex items-center gap-2"
            >
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-black text-amber-600 dark:text-amber-400">+{xpEarned} XP</span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
