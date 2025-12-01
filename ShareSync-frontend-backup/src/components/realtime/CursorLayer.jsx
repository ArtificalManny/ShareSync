/**
 * CursorLayer.jsx
 * Canvas overlay for rendering all live cursors
 * 
 * Features:
 * - Full-screen overlay (doesn't block interactions)
 * - Renders all cursors from CursorContext
 * - Handles ship flash celebrations
 * - Focus Together UI
 * - Ghost trails
 * - Manages cursor visibility
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useCursorContext } from '../../context/CursorContext';
import { useAuth } from '../../context/AuthContext';
import LiveCursor from './LiveCursor';
import FocusTogether from './FocusTogether';
import GhostTrail from './GhostTrail';

function CursorLayer() {
  const { cursors, isConnected } = useCursorContext();
  const { user } = useAuth();

  // Ship celebration state
  const [shipFlash, setShipFlash] = useState(null);

  // Load cursor settings from localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('cursor_settings');
      return saved
        ? JSON.parse(saved)
        : {
            enabled: true,
            showOwnCursor: false,
            ghostTrail: true,
            trailLength: 10,
            showNames: true,
          };
    } catch {
      return {
        enabled: true,
        showOwnCursor: false,
        ghostTrail: true,
        trailLength: 10,
        showNames: true,
      };
    }
  });

  // ============================================
  // LISTEN FOR SETTINGS CHANGES
  // ============================================

  useEffect(() => {
    const handleSettingsChange = (event) => {
      setSettings(event.detail);
    };

    window.addEventListener('cursor:settings-changed', handleSettingsChange);

    return () => {
      window.removeEventListener('cursor:settings-changed', handleSettingsChange);
    };
  }, []);

  // ============================================
  // SHIP FLASH CELEBRATION
  // ============================================

  useEffect(() => {
    const handleShipFlash = (event) => {
      const { userId, timestamp } = event.detail;

      console.log('🚢 Ship flash received in CursorLayer:', userId);

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

  // Don't show user's own cursor (unless enabled in settings)
  const visibleCursors = cursors.filter((cursor) => {
    if (cursor.userId === user?.id || cursor.userId === user?._id) {
      return settings.showOwnCursor;
    }
    return true;
  });

  // ============================================
  // CONNECTION STATUS
  // ============================================

  if (!isConnected || !settings.enabled) {
    return null; // Don't render cursors when disconnected or disabled
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
        {/* Ghost trails (behind cursors) */}
        {settings.ghostTrail && (
          <GhostTrail
            enabled={settings.ghostTrail}
            trailLength={settings.trailLength}
            fadeTime={3000}
          />
        )}

        {/* Render all cursors */}
        <AnimatePresence>
          {visibleCursors.map((cursor) => (
            <LiveCursor
              key={cursor.userId}
              cursor={cursor}
              showName={settings.showNames}
            />
          ))}
        </AnimatePresence>

        {/* Global ship flash celebration */}
        {shipFlash && <ShipFlashOverlay />}
      </div>

      {/* Focus Together UI (floating button + panels) */}
      <FocusTogether />

      {/* Cursor count indicator (bottom-left corner) */}
      {visibleCursors.length > 0 && (
        <div
          className="cursor-count-indicator"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
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

  /* Exception: FocusTogether buttons need pointer events */
  .focus-together-toggle,
  .focus-together-toggle *,
  .focus-together-panel,
  .focus-together-panel * {
    pointer-events: auto !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('cursor-layer-styles');
  if (!existingStyle) {
    const styleTag = document.createElement('style');
    styleTag.id = 'cursor-layer-styles';
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);
  }
}

export default CursorLayer;