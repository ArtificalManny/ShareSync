import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LevelUpFlash = ({ tier, show }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-300 to-amber-500 text-white px-6 py-3 rounded-xl shadow-xl font-bold text-lg font-orbitron"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          🎉 Level Up! New Tier: {tier}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpFlash;
