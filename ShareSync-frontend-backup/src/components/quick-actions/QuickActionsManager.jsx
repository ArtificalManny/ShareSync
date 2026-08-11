// src/components/quick-actions/QuickActionsManager.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS MANAGER & TELEMETRY LIFELINE
// - Manages global keyboard shortcuts (Cmd+K, Cmd+Shift+A, Cmd+/)
// - Renders QuickShip, QuickAnnounce, and the new Frictionless Feedback Engine
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect } from 'react';
import QuickShipFAB from './QuickShipFAB';
import { useIsMobile } from '../../hooks/useMobile';

import PilotFeedback from '../feedback/PilotFeedback';
import { touchActivation } from '../../api/activation';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. THE SILENT INTERCEPTOR (Captures last 3 console errors for context)
// ═══════════════════════════════════════════════════════════════════════════════
const recentErrors = [];
if (typeof window !== 'undefined' && typeof console !== 'undefined') {
  const origError = console.error;
  console.error = (...args) => {
    try {
      const msg = args
        .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(' ');
      recentErrors.push(msg);
      if (recentErrors.length > 3) recentErrors.shift(); // Keep only last 3
    } catch (e) {
      // Ignore circular JSON parsing errors
    }
    origError.apply(console, args);
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. FRICTIONLESS FEEDBACK & FEATURE INTERCEPTOR
// ═══════════════════════════════════════════════════════════════════════════════
const FeedbackLifeline = () => (
  <PilotFeedback
    recentErrors={recentErrors}
    variant="floating"
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// 3. MAIN QUICK ACTIONS MANAGER
// ═══════════════════════════════════════════════════════════════════════════════
const QuickActionsManager = ({ projectId }) => {
  const isMobile = useIsMobile();

  // activation-funnel-return-touch-v1
  // The server decides whether this authenticated visit
  // qualifies as a later-day return. Fail silently because
  // analytics must never interrupt the product.
  useEffect(() => {
    void touchActivation().catch(() => {});
  }, []);

  useEffect(() => {
    // Keyboard shortcuts for Core Engine
    const handleKeyPress = (e) => {
      // Cmd/Ctrl + K for Quick Ship
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('[aria-label="Quick Ship"]')?.click();
      }
      
      // Cmd/Ctrl + Shift + A for Quick Announcement
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
        e.preventDefault();
        document.querySelector('[aria-label="Quick Announcement"]')?.click();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Don't show primary FABs on mobile if no project selected
  // BUT we still want the FeedbackLifeline accessible globally
  if (isMobile && !projectId) {
    return <FeedbackLifeline />;
  }

  return (
    <>
      {/* Universal Feedback Trigger */}
      <FeedbackLifeline />

      {/* Quick Ship FAB - Always visible (if not caught by mobile early return) */}
      <QuickShipFAB projectId={projectId} />
      
      {/* Quick Announce FAB - Only show if project is selected */}
</>
  );
};

export default QuickActionsManager;
