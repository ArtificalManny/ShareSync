// src/components/handoff/HandoffButton.jsx - Week 8 Day 5-6
import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * HandoffButton - "I'm stuck" button for tasks
 * Compact button that triggers hand-off request
 */
const HandoffButton = ({ onClick, compact = false }) => {
  if (compact) {
    return (
      <button
        onClick={onClick}
        className="p-1.5 hover:bg-orange-500/20 rounded-lg transition-all group"
        title="Request help"
      >
        <AlertCircle className="w-4 h-4 text-slate-400 group-hover:text-orange-400 transition-colors" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/30 rounded-lg text-xs font-semibold text-orange-400 transition-all flex items-center gap-1.5"
    >
      <AlertCircle className="w-3.5 h-3.5" />
      I'm Stuck
    </button>
  );
};

export default HandoffButton;
