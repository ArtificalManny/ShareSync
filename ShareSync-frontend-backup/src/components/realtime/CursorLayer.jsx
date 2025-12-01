/**
 * CursorLayer.jsx
 * Canvas overlay for rendering all live cursors
 * 
 * Features:
 * - Full-screen overlay (doesn't block interactions)
 * - Renders all cursors from CursorContext
 * - Handles ship flash celebrations
 * - Manages cursor visibility
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useCursorContext } from '../../context/CursorContext';
import { useAuth } from '../../context/AuthContext';
import LiveCursor from './LiveCursor';

function CursorLayer() {
  const { cursors, isConnected } = useCursorContext();
  const { user } = useAuth();

  // Ship celebration state
  const [shipFlash, setShipFlash] = useState(null);

  // ============================================
  // SHIP FLASH CELEBRATION
  // ============================================

  useEffect(() => {
    const handleShipFlash = (event) => {
      const { userId, timestamp } = event.detail;

      setShipFlash({ userId, timestamp });

      // Clear after animation
      setTimeout(() => {
        setShipFlash(null);
      }, 1000);
    };

    window.addEventListener('cursor:ship', handleShipFlash);

    return () => {
      window.removeEventListener('cursor:ship', handleShipFlash);
    };
  }, []);

  // ============================================
  // FILTER CURSORS
  // ============================================

  // Don't show user's own cursor
  const visibleCursors = cursors.filter((cursor) => cursor.userId !== user?.id);

  // ============================================
  // CONNECTION STATUS
  // ============================================

  if (!isConnected) {
    return null; // Don't render cursors when disconnected
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* Cursor overlay layer */}
      <div
        className="cursor-layer"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none', // Don't block clicks
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {/* Render all cursors */}
        <AnimatePresence>
          {visibleCursors.map((cursor) => (
            <LiveCursor key={cursor.userId} cursor={cursor} />
          ))}
        </AnimatePresence>

        {/* Global ship flash celebration */}
        {shipFlash && <ShipFlashOverlay />}
      </div>

      {/* Cursor count indicator (bottom-right corner) */}
      {visibleCursors.length > 0 && (
        <div
          className="cursor-count-indicator"
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            padding: '8px 16px',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 999,
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            pointerEvents: 'none',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 1)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          {visibleCursors.length} {visibleCursors.length === 1 ? 'person' : 'people'} online
        </div>
      )}
    </>
  );
}

// ============================================
// SHIP FLASH OVERLAY (Gold celebration)
// ============================================

function ShipFlashOverlay() {
  return (
    <div
      className="ship-flash-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
        animation: 'ship-flash 1s ease-out forwards',
        pointerEvents: 'none',
      }}
    />
  );
}

// ============================================
// ANIMATIONS (Add to your CSS)
// ============================================

const styles = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
  }

  @keyframes ship-flash {
    0% {
      opacity: 1;
      transform: scale(0);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.5);
    }
  }

  /* Cursor layer shouldn't interfere with interactions */
  .cursor-layer * {
    pointer-events: none;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);
}

export default CursorLayer;