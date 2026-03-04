import React from 'react';
import { motion } from 'framer-motion';
import { Flame, ArrowRight } from 'lucide-react';

export default function EmptyStreak({ onSeeMoves }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-8 px-6 text-center"
    >
      <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mb-5">
        <Flame className="w-7 h-7 text-amber-500" />
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-2">Build your streak</h3>
      
      <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-xs mx-auto mb-8">
        Complete one move today to start. The longest streak on ShareSync is 47 days.
      </p>
      
      <button 
        onClick={onSeeMoves} 
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white hover:scale-105 transition-transform"
      >
        See Today's Moves 
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
