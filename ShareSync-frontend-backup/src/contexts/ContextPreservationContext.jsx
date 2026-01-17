// src/contexts/ContextPreservationContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT PRESERVATION - Global Provider
// ═══════════════════════════════════════════════════════════════════════════════
// Combines all context preservation features into one provider:
// - Last touched tracking
// - Scroll restoration
// - "You were here" highlights
// - "Resuming..." toast on return
// ═══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import useLastTouched from '../hooks/useLastTouched';
import useScrollRestoration from '../hooks/useScrollRestoration';
import { toast } from '../components/ui/toast';

const ContextPreservationContext = createContext(null);

// How long user must be away before showing "resuming" toast
const AWAY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export function ContextPreservationProvider({ children, enabled = true }) {
  const location = useLocation();
  const lastTouched = useLastTouched();
  const scrollRestoration = useScrollRestoration({ enabled });
  
  // Track when user leaves/returns
  const lastActiveTimeRef = useRef(Date.now());
  const hasShownResumingToastRef = useRef(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Update last active time on any activity
  useEffect(() => {
    if (!enabled) return;

    const updateActivity = () => {
      lastActiveTimeRef.current = Date.now();
    };

    // Track various activity signals
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [enabled]);

  // Detect when user returns after being away
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left - save last active time
        lastActiveTimeRef.current = Date.now();
      } else {
        // User returned - check how long they were away
        const awayDuration = Date.now() - lastActiveTimeRef.current;
        
        if (awayDuration > AWAY_THRESHOLD && !hasShownResumingToastRef.current) {
          setIsReturningUser(true);
          
          // Get the most recent item they were working on
          const recentItem = lastTouched.getMostRecentItem();
          
          // Show "Resuming..." toast
          if (recentItem && recentItem.route === location.pathname) {
            toast({
              title: '↩️ Resuming where you left off',
              description: recentItem.title ? `Back to "${recentItem.title}"` : undefined,
              duration: 3000,
            });
            
            // Highlight the item they were working on
            if (recentItem.id) {
              lastTouched.highlightItem(recentItem.id);
            }
          }
          
          hasShownResumingToastRef.current = true;
          
          // Reset after a short delay
          setTimeout(() => {
            setIsReturningUser(false);
            hasShownResumingToastRef.current = false;
          }, 10000);
        }
        
        lastActiveTimeRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, lastTouched, location.pathname]);

  // Touch an item (convenience wrapper)
  const touchItem = useCallback((itemId, metadata = {}) => {
    if (!enabled) return;
    lastTouched.touch(itemId, {
      route: location.pathname,
      ...metadata,
    });
  }, [enabled, lastTouched, location.pathname]);

  // Check if an item should be highlighted
  const shouldHighlight = useCallback((itemId) => {
    return lastTouched.isHighlighted(itemId);
  }, [lastTouched]);

  // Get touch info for an item
  const getItemContext = useCallback((itemId) => {
    return lastTouched.getTouchInfo(itemId);
  }, [lastTouched]);

  const value = {
    // From useLastTouched
    touchItem,
    shouldHighlight,
    getItemContext,
    getMostRecentItem: lastTouched.getMostRecentItem,
    getItemsOnCurrentRoute: lastTouched.getItemsOnCurrentRoute,
    wasTouchedRecently: lastTouched.wasTouchedRecently,
    highlightItem: lastTouched.highlightItem,
    
    // From useScrollRestoration
    saveScrollPosition: scrollRestoration.savePosition,
    restoreScrollPosition: scrollRestoration.restorePosition,
    getScrollPosition: scrollRestoration.getScrollPosition,
    
    // State
    isReturningUser,
    enabled,
  };

  return (
    <ContextPreservationContext.Provider value={value}>
      {children}
    </ContextPreservationContext.Provider>
  );
}

export function useContextPreservation() {
  const context = useContext(ContextPreservationContext);
  
  if (!context) {
    // Return safe defaults if used outside provider
    return {
      touchItem: () => {},
      shouldHighlight: () => false,
      getItemContext: () => null,
      getMostRecentItem: () => null,
      getItemsOnCurrentRoute: () => [],
      wasTouchedRecently: () => false,
      highlightItem: () => {},
      saveScrollPosition: () => {},
      restoreScrollPosition: () => {},
      getScrollPosition: () => 0,
      isReturningUser: false,
      enabled: false,
    };
  }
  
  return context;
}

export default ContextPreservationContext;
