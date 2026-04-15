// /src/components/LevelUpBadge.jsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import useDocumentTitle from "../hooks/useDocumentTitle";

const LevelUpBadge = ({ newTier, onClose }) => {
  useDocumentTitle("Level Up");
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-6 rounded-xl bg-yellow-200 border-2 border-yellow-500 text-yellow-900 shadow-2xl font-bold text-xl"
    >
      🎉 Level Up! You've reached <span className="text-yellow-800">{newTier}</span> Tier!
    </motion.div>
  );
};

export default LevelUpBadge;