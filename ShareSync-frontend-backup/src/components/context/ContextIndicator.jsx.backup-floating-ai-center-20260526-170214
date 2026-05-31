import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Cloud, CloudOff, Loader2 } from 'lucide-react';

/**
 * ContextIndicator Component
 * 
 * Subtle, non-intrusive indicator showing context preservation status.
 * Appears briefly when context saves occur.
 * 
 * States:
 * - idle: Hidden
 * - saving: Shows spinner with "Syncing..."
 * - saved: Shows checkmark with "Synced"
 * - error: Shows error state (auto-dismisses)
 * 
 * Design: MetaLab 2026 - minimal, glassmorphic, micro-interactions
 */

// CONTEXT INDICATOR POPUP DISABLED
// Keeps the component import-safe while preventing the bottom-right
// "Syncing..." / "Synced" micro-toast from appearing.
const CONTEXT_INDICATOR_VISUALS_ENABLED = false;

const ContextIndicator = () => {
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [isHovered, setIsHovered] = useState(false);

  // Handle context save events
  const handleContextSaving = useCallback(() => {
    setStatus('saving');
  }, []);

  const handleContextSaved = useCallback(() => {
    setStatus('saved');
    // Auto-hide after 2 seconds (unless hovered)
    setTimeout(() => {
      if (!isHovered) {
        setStatus('idle');
      }
    }, 2000);
  }, [isHovered]);

  const handleContextError = useCallback(() => {
    setStatus('error');
    // Auto-hide error after 3 seconds
    setTimeout(() => setStatus('idle'), 3000);
  }, []);

  // Subscribe to custom events dispatched by useContextTracking
  useEffect(() => {
    if (!CONTEXT_INDICATOR_VISUALS_ENABLED) {
      return undefined;
    }

    window.addEventListener('context-saving', handleContextSaving);
    window.addEventListener('context-saved', handleContextSaved);
    window.addEventListener('context-error', handleContextError);

    return () => {
      window.removeEventListener('context-saving', handleContextSaving);
      window.removeEventListener('context-saved', handleContextSaved);
      window.removeEventListener('context-error', handleContextError);
    };
  }, [handleContextSaving, handleContextSaved, handleContextError]);

  // Hide when mouse leaves (if in saved state)
  useEffect(() => {
    if (!isHovered && status === 'saved') {
      const timer = setTimeout(() => setStatus('idle'), 500);
      return () => clearTimeout(timer);
    }
  }, [isHovered, status]);

  if (!CONTEXT_INDICATOR_VISUALS_ENABLED) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {status !== 'idle' && (
        <motion.div
          key="context-indicator"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="fixed bottom-6 right-6 z-50"
        >
          <motion.div
            layout
            className={`
              px-3 py-2
              bg-slate-900/80 backdrop-blur-xl
              border rounded-full
              shadow-lg shadow-black/20
              flex items-center gap-2
              text-xs font-medium
              cursor-default
              select-none
              transition-colors duration-200
              ${status === 'error' 
                ? 'border-red-500/30' 
                : status === 'saved' 
                  ? 'border-emerald-500/30' 
                  : 'border-white/10'
              }
            `}
          >
            <StatusIcon status={status} />
            <StatusText status={status} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * StatusIcon - Animated icon based on current status
 */
const StatusIcon = ({ status }) => {
  const iconClasses = "w-3.5 h-3.5";

  switch (status) {
    case 'saving':
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className={`${iconClasses} text-purple-400`} />
        </motion.div>
      );

    case 'saved':
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        >
          <Check className={`${iconClasses} text-emerald-400`} />
        </motion.div>
      );

    case 'error':
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        >
          <CloudOff className={`${iconClasses} text-red-400`} />
        </motion.div>
      );

    default:
      return <Cloud className={`${iconClasses} text-slate-500`} />;
  }
};

/**
 * StatusText - Text label based on current status
 */
const StatusText = ({ status }) => {
  const textMap = {
    saving: 'Syncing...',
    saved: 'Synced',
    error: 'Sync failed',
  };

  const colorMap = {
    saving: 'text-slate-400',
    saved: 'text-emerald-400',
    error: 'text-red-400',
  };

  return (
    <motion.span
      key={status}
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 5 }}
      className={colorMap[status] || 'text-slate-400'}
    >
      {textMap[status] || ''}
    </motion.span>
  );
};

export default ContextIndicator;
