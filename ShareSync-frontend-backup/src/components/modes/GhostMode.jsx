/**
 * GhostMode.jsx
 * Anonymous cursor viewing mode
 * 
 * Features:
 * - View other cursors without showing yours
 * - "Lurking" mode for observers
 * - Invisible to other users
 * - Can still interact with app
 * - Toggle on/off easily
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Eye, EyeOff, Users, Sparkles } from 'lucide-react';
import { useCursorContext } from '../../context/CursorContext';
import usePresenceStore from '../../store/presenceSlice';

// ============================================
// GHOST MODE
// ============================================

export function GhostMode() {
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  
  const { socket, isConnected } = useCursorContext();
  const { updateOwnPresence } = usePresenceStore();

  // ============================================
  // LOAD GHOST MODE STATE
  // ============================================

  useEffect(() => {
    const saved = localStorage.getItem('cursor_ghost_mode');
    if (saved === 'true') {
      setIsGhostMode(true);
      updateOwnPresence({ mode: 'ghost' });
    }
  }, [updateOwnPresence]);

  // ============================================
  // TOGGLE GHOST MODE
  // ============================================

  const toggleGhostMode = () => {
    const newState = !isGhostMode;
    setIsGhostMode(newState);
    
    // Save to localStorage
    localStorage.setItem('cursor_ghost_mode', newState.toString());
    
    // Update presence
    updateOwnPresence({
      mode: newState ? 'ghost' : 'team',
      status: newState ? 'idle' : 'online',
    });
    
    // Notify server
    if (socket && isConnected) {
      socket.emit('cursor:mode', {
        mode: newState ? 'ghost' : 'team',
      });
    }
    
    // Show notification
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    
    console.log(`👻 Ghost Mode: ${newState ? 'ON' : 'OFF'}`);
  };

  // ============================================
  // KEYBOARD SHORTCUT
  // ============================================

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Cmd/Ctrl + Shift + G = Toggle ghost mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'g') {
        e.preventDefault();
        toggleGhostMode();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isGhostMode]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* Ghost mode toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleGhostMode}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: isGhostMode
            ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
            : 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: isGhostMode
            ? '2px solid rgba(139, 92, 246, 0.5)'
            : '2px solid rgba(255, 255, 255, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isGhostMode
            ? '0 4px 16px rgba(139, 92, 246, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.2)',
          zIndex: 9999,
          transition: 'all 0.3s ease',
        }}
        title={isGhostMode ? 'Exit Ghost Mode (⌘⇧G)' : 'Enter Ghost Mode (⌘⇧G)'}
      >
        {isGhostMode ? (
          <Ghost size={20} color="white" />
        ) : (
          <Eye size={20} color="white" />
        )}
        
        {/* Active indicator */}
        {isGhostMode && (
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
            }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px solid rgba(139, 92, 246, 0.5)',
            }}
          />
        )}
      </motion.button>

      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 80,
              right: 20,
              padding: '12px 20px',
              background: isGhostMode
                ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              borderRadius: 12,
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {isGhostMode ? (
              <>
                <Ghost size={16} />
                <span>Ghost Mode Active</span>
              </>
            ) : (
              <>
                <Users size={16} />
                <span>Visible to Team</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ghost mode overlay (subtle indicator) */}
      <AnimatePresence>
        {isGhostMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #6366F1 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s linear infinite',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Info tooltip */}
      <AnimatePresence>
        {isGhostMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.5 }}
            style={{
              position: 'fixed',
              top: 80,
              right: 20,
              padding: '12px 16px',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: 12,
              color: 'white',
              fontSize: 13,
              maxWidth: 280,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              zIndex: 9998,
              pointerEvents: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ghost size={16} color="#8B5CF6" />
              <strong style={{ color: '#8B5CF6' }}>Ghost Mode Active</strong>
            </div>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5 }}>
              You can see everyone's cursors, but yours is hidden. Perfect for observing without distracting.
            </p>
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255, 255, 255, 0.5)' }}>
              Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>⌘⇧G</kbd> to toggle
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// GHOST MODE HOOK
// ============================================

export function useGhostMode() {
  const [isGhostMode, setIsGhostMode] = useState(() => {
    return localStorage.getItem('cursor_ghost_mode') === 'true';
  });

  const enableGhostMode = () => {
    setIsGhostMode(true);
    localStorage.setItem('cursor_ghost_mode', 'true');
  };

  const disableGhostMode = () => {
    setIsGhostMode(false);
    localStorage.setItem('cursor_ghost_mode', 'false');
  };

  const toggleGhostMode = () => {
    if (isGhostMode) {
      disableGhostMode();
    } else {
      enableGhostMode();
    }
  };

  return {
    isGhostMode,
    enableGhostMode,
    disableGhostMode,
    toggleGhostMode,
  };
}

// ============================================
// STYLES
// ============================================

const styles = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('ghost-mode-styles');
  if (!existingStyle) {
    const styleTag = document.createElement('style');
    styleTag.id = 'ghost-mode-styles';
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);
  }
}

export default GhostMode;