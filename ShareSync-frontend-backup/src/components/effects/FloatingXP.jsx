import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const FloatingXP = ({ amount = 10, x = 0, y = 0 }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.8 }}
      animate={{ opacity: 0, y: -40, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 9999,
        color: '#7C3AED',
        fontWeight: 700,
        fontSize: '16px',
        textShadow: '0 2px 8px rgba(124,58,237,0.3)'
      }}
    >
      +{amount} XP
    </motion.div>
  </AnimatePresence>
);

export default FloatingXP;
