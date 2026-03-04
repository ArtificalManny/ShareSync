import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } 
  },
  exit: { 
    opacity: 0, 
    y: -4, 
    transition: { duration: 0.15 } 
  }
};

export const PageTransition = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="enter"
    exit="exit"
    className="w-full h-full"
  >
    {children}
  </motion.div>
);
