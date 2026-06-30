/**
 * CursorLayer.jsx
 * Canvas overlay for rendering all live cursors
 * 
 * NOW WITH:
 * - Web Worker for heavy calculations
 * - Zustand state integration
 * - Performance monitoring
 * - Optimized rendering
 */

import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useCursorContext } from '../../context/CursorContext';
import { useAuth } from '../../context/AuthContext';
import useCursorStore from '../../store/cursorSlice';
import LiveCursor from './LiveCursor';
import FocusTogether from './FocusTogether';
import GhostTrail from './GhostTrail';
import { getCursorWorker } from '../../utils/cursorWorkerClient';

function CursorLayer() {
  const { cursors, isConnected } = useCursorContext();
  const { user } = useAuth();
  
  // ⭐ GET SETTINGS FROM ZUSTAND
  const settings = useCursorStore((state) => state.settings);

  // Ship celebration state
  const [shipFlash, setShipFlash] = useState(null);
  
  // ⭐ WEB WORKER
  const workerRef = useRef(null);
  const [workerReady, setWorkerReady] = useState(false);

  // ⭐ PERFORMANCE METRICS
  const [metrics, setMetrics] = useState({
    fps: 60,
    cursorCount: 0,
    workerLatency: 0,
  });

  // ============================================
  // ⭐ INITIALIZE WEB WORKER
  // ============================================

  useEffect(() => {
    let mounted = true;

    getCursorWorker()
      .then((worker) => {
        if (!mounted) return;
        
        workerRef.current = worker;
        setWorkerReady(true);
        console.log('✅ CursorLayer: Web Worker initialized');
        
        // Update viewport on resize
        const handleResize = () => {
          worker.updateViewport(window.innerWidth, window.innerHeight);
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', handleResize);
        };
      })
      .catch((error) => {
        console.error('❌ CursorLayer: Worker failed to initialize', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================
  // ⭐ UPDATE WORKER WHEN CURSORS CHANGE
  // ============================================

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker || !workerReady) return;

    // Batch update all cursors
    const updates = cursors.map((cursor) => ({
      cursorId: cursor.userId,
      x: cursor.x,
      y: cursor.y,
    }));

    if (updates.length > 0) {
      worker.batchUpdate(updates).catch((error) => {
        console.error('Worker batch update failed:', error);
      });
    }
  }, [cursors, workerReady]);

  // ============================================
  // ⭐ PROXIMITY CHECK IN WORKER
  // ============================================

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker || !workerReady || !settings.syncPulseEnabled) return;

    const interval = setInterval(async () => {
      try {
        const proximities = await worker.checkProximity();
        
        // Trigger sync pulse events
        proximities.forEach(({ cursor1Id, cursor2Id, distance }) => {
          window.dispatchEvent(new CustomEvent('cursor:sync-pulse', {
            detail: {
              user1: cursor1Id,
              user2: cursor2Id,
              distance,
              timestamp: Date.now(),
            },
          }));
        });
      } catch (error) {
        console.error('Proximity check failed:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [workerReady, settings.syncPulseEnabled]);

  // ============================================
  // ⭐ PERFORMANCE MONITORING
  // ============================================

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker || !workerReady) return;

    const interval = setInterval(async () => {
      try {
        const [stats, latency] = await Promise.all([
          worker.getStats(),
          worker.measureLatency(),
        ]);

        setMetrics({
          fps: 60,
          cursorCount: stats.cursorCount,
          workerLatency: latency,
        });
      } catch (error) {
        console.error('Failed to get metrics:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [workerReady]);

  // ============================================
  // SHIP FLASH CELEBRATION
  // ============================================

  useEffect(() => {
    const handleShipFlash = (event) => {
      const { userId, timestamp } = event.detail;
      console.log('🚢 Ship flash received:', userId);
      setShipFlash({ userId, timestamp });
      setTimeout(() => setShipFlash(null), 1000);
    };

    window.addEventListener('cursor:ship', handleShipFlash);
    return () => window.removeEventListener('cursor:ship', handleShipFlash);
  }, []);

  // ============================================
  // FILTER CURSORS
  // ============================================

  const visibleCursors = cursors.filter((cursor) => {
    if (cursor.userId === user?.id || cursor.userId === user?._id) {
      return settings.showOwnCursor;
    }
    return true;
  });

  // ============================================
  // RENDER
  // ============================================

  if (!isConnected || !settings.enabled) {
    return null;
  }

  return (
    <>
      {/* Cursor overlay */}
      <div className="cursor-layer" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
        {settings.ghostTrail && <GhostTrail enabled={settings.ghostTrail} trailLength={settings.trailLength} fadeTime={3000} />}
        <AnimatePresence>
          {visibleCursors.map((cursor) => (
            <LiveCursor key={cursor.userId} cursor={cursor} showName={settings.showNames} />
          ))}
        </AnimatePresence>
        {shipFlash && <ShipFlashOverlay />}
      </div>

      <FocusTogether />

      {visibleCursors.length > 0 && (
        <div className="cursor-count-indicator" style={{ position: 'fixed', bottom: 24, right: 24, padding: '8px 16px', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 999, color: 'white', fontSize: 12, fontWeight: 600, pointerEvents: 'none', zIndex: 9998, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(16, 185, 129, 1)', animation: 'pulse 2s ease-in-out infinite' }} />
          {visibleCursors.length} {visibleCursors.length === 1 ? 'person' : 'people'} online
        </div>
      )}

      {process.env.NODE_ENV === 'development' && workerReady && (
        <div style={{ position: 'fixed', top: 8, right: 8, padding: '8px 12px', background: 'rgba(0, 0, 0, 0.8)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 8, color: '#8B5CF6', fontSize: 10, fontFamily: 'monospace', pointerEvents: 'none', zIndex: 10000 }}>
          <div>FPS: {metrics.fps}</div>
          <div>Cursors: {metrics.cursorCount}</div>
          <div>Worker: {metrics.workerLatency}ms</div>
        </div>
      )}
    </>
  );
}

function ShipFlashOverlay() {
  return <div className="ship-flash-overlay" style={{ position: 'absolute', top: 0, left: 0, width: 'Available', height: 'Available', background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)', animation: 'ship-flash 1s ease-out forwards', pointerEvents: 'none' }} />;
}

const styles = `
  @keyframes pulse { 0%, Available { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
  @keyframes ship-flash { 0% { opacity: 1; transform: scale(0); } 50% { opacity: 1; transform: scale(1); } Available { opacity: 0; transform: scale(1.5); } }
  .cursor-layer * { pointer-events: none; }
  .focus-together-toggle, .focus-together-toggle *, .focus-together-panel, .focus-together-panel * { pointer-events: auto !important; }
`;

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