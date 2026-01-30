// src/hooks/useContextMemory.js
// ═══════════════════════════════════════════════════════════════════════════════
// ALIVE AWARE: Context Memory System
// Remembers what the user was working on and restores their context
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export const CONTEXT_TYPES = {
  PAGE: 'page',                    // Current page/route
  PROJECT: 'project',              // Current project
  TASK: 'task',                    // Currently viewing/editing task
  SCROLL: 'scroll',                // Scroll position
  EXPANDED: 'expanded',            // Expanded sections/accordions
  FOCUS: 'focus',                  // Focused element
  FILTER: 'filter',                // Active filters
  VIEW_MODE: 'viewMode',           // List/board/timeline view
  SIDEBAR: 'sidebar',              // Sidebar state
  MODAL: 'modal',                  // Open modal state
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════════

const LS_KEYS = {
  CONTEXT_HISTORY: 'ss.context.history',
  CURRENT_CONTEXT: 'ss.context.current',
  SCROLL_POSITIONS: 'ss.context.scroll',
  EXPANDED_SECTIONS: 'ss.context.expanded',
  VIEW_PREFERENCES: 'ss.context.views',
  LAST_SESSION: 'ss.context.lastSession',
  RECENT_ITEMS: 'ss.context.recentItems',
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format relative time (e.g., "5 minutes ago")
 */
function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Get context label for display
 */
function getContextLabel(context) {
  if (!context) return 'Unknown';
  
  switch (context.type) {
    case CONTEXT_TYPES.PROJECT:
      return context.data?.name || 'Project';
    case CONTEXT_TYPES.TASK:
      return context.data?.title || 'Task';
    case CONTEXT_TYPES.PAGE:
      return context.data?.title || context.path || 'Page';
    default:
      return context.type;
  }
}

/**
 * Get context icon name
 */
function getContextIcon(context) {
  if (!context) return 'file';
  
  switch (context.type) {
    case CONTEXT_TYPES.PROJECT:
      return 'folder';
    case CONTEXT_TYPES.TASK:
      return 'check-square';
    case CONTEXT_TYPES.PAGE:
      return 'layout';
    default:
      return 'file';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * useContextMemory - Remembers and restores user context
 * 
 * @param {Object} options
 * @param {boolean} options.enabled - Whether context memory is enabled
 * @param {boolean} options.autoRestore - Auto-restore last context on mount
 * @param {number} options.maxHistory - Maximum history items to keep
 * @param {string} options.userId - Current user ID for isolation
 * 
 * @returns {Object} Context memory state and controls
 */
export function useContextMemory({
  enabled = true,
  autoRestore = false,
  maxHistory = 50,
  userId = 'default',
} = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const [contextHistory, setContextHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.CONTEXT_HISTORY}.${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [currentContext, setCurrentContext] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.CURRENT_CONTEXT}.${userId}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [scrollPositions, setScrollPositions] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.SCROLL_POSITIONS}.${userId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  const [expandedSections, setExpandedSections] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.EXPANDED_SECTIONS}.${userId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  const [viewPreferences, setViewPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.VIEW_PREFERENCES}.${userId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  const [recentItems, setRecentItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.RECENT_ITEMS}.${userId}`);
      return saved ? JSON.parse(saved) : { projects: [], tasks: [], pages: [] };
    } catch {
      return { projects: [], tasks: [], pages: [] };
    }
  });
  
  const [lastSession, setLastSession] = useState(() => {
    try {
      const saved = localStorage.getItem(`${LS_KEYS.LAST_SESSION}.${userId}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [restoredContext, setRestoredContext] = useState(null);
  
  // Refs
  const saveTimeoutRef = useRef(null);
  const lastSaveRef = useRef(Date.now());
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Debounced save to localStorage
  const saveToStorage = useCallback((key, data) => {
    if (!enabled) return;
    
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`${key}.${userId}`, JSON.stringify(data));
        lastSaveRef.current = Date.now();
      } catch (e) {
        console.warn('[ContextMemory] Failed to save:', e);
      }
    }, 500); // Debounce 500ms
  }, [enabled, userId]);
  
  // Persist context history
  useEffect(() => {
    if (contextHistory.length > 0) {
      saveToStorage(LS_KEYS.CONTEXT_HISTORY, contextHistory.slice(-maxHistory));
    }
  }, [contextHistory, saveToStorage, maxHistory]);
  
  // Persist current context
  useEffect(() => {
    if (currentContext) {
      saveToStorage(LS_KEYS.CURRENT_CONTEXT, currentContext);
    }
  }, [currentContext, saveToStorage]);
  
  // Persist scroll positions
  useEffect(() => {
    if (Object.keys(scrollPositions).length > 0) {
      saveToStorage(LS_KEYS.SCROLL_POSITIONS, scrollPositions);
    }
  }, [scrollPositions, saveToStorage]);
  
  // Persist expanded sections
  useEffect(() => {
    if (Object.keys(expandedSections).length > 0) {
      saveToStorage(LS_KEYS.EXPANDED_SECTIONS, expandedSections);
    }
  }, [expandedSections, saveToStorage]);
  
  // Persist view preferences
  useEffect(() => {
    if (Object.keys(viewPreferences).length > 0) {
      saveToStorage(LS_KEYS.VIEW_PREFERENCES, viewPreferences);
    }
  }, [viewPreferences, saveToStorage]);
  
  // Persist recent items
  useEffect(() => {
    saveToStorage(LS_KEYS.RECENT_ITEMS, recentItems);
  }, [recentItems, saveToStorage]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CONTEXT TRACKING
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Record a context change
   */
  const recordContext = useCallback((type, data, options = {}) => {
    if (!enabled) return;
    
    const context = {
      id: `${type}-${Date.now()}`,
      type,
      data,
      path: location.pathname,
      timestamp: Date.now(),
      ...options,
    };
    
    setCurrentContext(context);
    
    setContextHistory(prev => {
      // Avoid duplicates
      const isDuplicate = prev.length > 0 && 
        prev[prev.length - 1].type === type &&
        prev[prev.length - 1].path === context.path &&
        JSON.stringify(prev[prev.length - 1].data) === JSON.stringify(data);
      
      if (isDuplicate) return prev;
      
      return [...prev, context].slice(-maxHistory);
    });
    
    // Update recent items based on type
    if (type === CONTEXT_TYPES.PROJECT && data?.id) {
      addRecentItem('projects', data);
    } else if (type === CONTEXT_TYPES.TASK && data?.id) {
      addRecentItem('tasks', data);
    } else if (type === CONTEXT_TYPES.PAGE) {
      addRecentItem('pages', { path: location.pathname, ...data });
    }
    
    return context;
  }, [enabled, location.pathname, maxHistory]);
  
  /**
   * Record page visit
   */
  const recordPageVisit = useCallback((pageTitle, metadata = {}) => {
    return recordContext(CONTEXT_TYPES.PAGE, {
      title: pageTitle,
      path: location.pathname,
      ...metadata,
    });
  }, [recordContext, location.pathname]);
  
  /**
   * Record project view
   */
  const recordProjectView = useCallback((project) => {
    return recordContext(CONTEXT_TYPES.PROJECT, {
      id: project._id || project.id,
      name: project.name,
      emoji: project.emoji,
    });
  }, [recordContext]);
  
  /**
   * Record task view/edit
   */
  const recordTaskView = useCallback((task, project = null) => {
    return recordContext(CONTEXT_TYPES.TASK, {
      id: task._id || task.id,
      title: task.title,
      projectId: project?._id || project?.id || task.projectId,
      projectName: project?.name,
    });
  }, [recordContext]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // SCROLL POSITION TRACKING
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Save scroll position for current page
   */
  const saveScrollPosition = useCallback((scrollTop, key = null) => {
    if (!enabled) return;
    
    const scrollKey = key || location.pathname;
    
    setScrollPositions(prev => ({
      ...prev,
      [scrollKey]: {
        top: scrollTop,
        timestamp: Date.now(),
      },
    }));
  }, [enabled, location.pathname]);
  
  /**
   * Get saved scroll position for a page
   */
  const getScrollPosition = useCallback((key = null) => {
    const scrollKey = key || location.pathname;
    return scrollPositions[scrollKey]?.top || 0;
  }, [scrollPositions, location.pathname]);
  
  /**
   * Restore scroll position for current page
   */
  const restoreScrollPosition = useCallback((element = window, key = null) => {
    const scrollTop = getScrollPosition(key);
    
    if (scrollTop > 0) {
      requestAnimationFrame(() => {
        if (element === window) {
          window.scrollTo({ top: scrollTop, behavior: 'instant' });
        } else if (element?.scrollTo) {
          element.scrollTo({ top: scrollTop, behavior: 'instant' });
        }
      });
    }
    
    return scrollTop;
  }, [getScrollPosition]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // EXPANDED SECTIONS TRACKING
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Save expanded state for a section
   */
  const setExpanded = useCallback((sectionId, isExpanded, pageKey = null) => {
    if (!enabled) return;
    
    const key = pageKey || location.pathname;
    
    setExpandedSections(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [sectionId]: isExpanded,
      },
    }));
  }, [enabled, location.pathname]);
  
  /**
   * Get expanded state for a section
   */
  const getExpanded = useCallback((sectionId, defaultValue = false, pageKey = null) => {
    const key = pageKey || location.pathname;
    return expandedSections[key]?.[sectionId] ?? defaultValue;
  }, [expandedSections, location.pathname]);
  
  /**
   * Toggle expanded state
   */
  const toggleExpanded = useCallback((sectionId, pageKey = null) => {
    const current = getExpanded(sectionId, false, pageKey);
    setExpanded(sectionId, !current, pageKey);
    return !current;
  }, [getExpanded, setExpanded]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // VIEW PREFERENCES
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Save view preference (e.g., list/board/timeline)
   */
  const setViewPreference = useCallback((key, value) => {
    if (!enabled) return;
    
    setViewPreferences(prev => ({
      ...prev,
      [key]: {
        value,
        timestamp: Date.now(),
      },
    }));
  }, [enabled]);
  
  /**
   * Get view preference
   */
  const getViewPreference = useCallback((key, defaultValue = null) => {
    return viewPreferences[key]?.value ?? defaultValue;
  }, [viewPreferences]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // RECENT ITEMS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Add item to recent list
   */
  const addRecentItem = useCallback((category, item) => {
    if (!enabled || !item) return;
    
    setRecentItems(prev => {
      const list = prev[category] || [];
      
      // Remove duplicate by ID
      const filtered = list.filter(i => 
        (i.id || i.path) !== (item.id || item.path)
      );
      
      // Add to front with timestamp
      const updated = [
        { ...item, lastVisited: Date.now() },
        ...filtered,
      ].slice(0, 10); // Keep max 10 per category
      
      return {
        ...prev,
        [category]: updated,
      };
    });
  }, [enabled]);
  
  /**
   * Get recent items for a category
   */
  const getRecentItems = useCallback((category, limit = 5) => {
    return (recentItems[category] || []).slice(0, limit);
  }, [recentItems]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Save current session state (on tab close/refresh)
   */
  const saveSession = useCallback(() => {
    if (!enabled) return;
    
    const session = {
      context: currentContext,
      path: location.pathname,
      timestamp: Date.now(),
      scrollPositions: scrollPositions,
      expandedSections: expandedSections,
    };
    
    try {
      localStorage.setItem(`${LS_KEYS.LAST_SESSION}.${userId}`, JSON.stringify(session));
    } catch {}
    
    return session;
  }, [enabled, currentContext, location.pathname, scrollPositions, expandedSections, userId]);
  
  /**
   * Check if there's a session to restore
   */
  const hasSessionToRestore = useMemo(() => {
    if (!lastSession) return false;
    
    // Only restore if session is less than 24 hours old
    const isRecent = Date.now() - lastSession.timestamp < 86400000;
    
    // Only restore if we're not already on that page
    const isDifferentPage = lastSession.path !== location.pathname;
    
    return isRecent && isDifferentPage && lastSession.context;
  }, [lastSession, location.pathname]);
  
  /**
   * Restore last session
   */
  const restoreSession = useCallback(() => {
    if (!lastSession || !enabled) return false;
    
    try {
      // Navigate to last path
      if (lastSession.path && lastSession.path !== location.pathname) {
        navigate(lastSession.path);
      }
      
      // Restore context
      if (lastSession.context) {
        setRestoredContext(lastSession.context);
      }
      
      // Restore scroll positions
      if (lastSession.scrollPositions) {
        setScrollPositions(lastSession.scrollPositions);
      }
      
      // Restore expanded sections
      if (lastSession.expandedSections) {
        setExpandedSections(lastSession.expandedSections);
      }
      
      setShowRestorePrompt(false);
      return true;
    } catch (e) {
      console.error('[ContextMemory] Failed to restore session:', e);
      return false;
    }
  }, [lastSession, enabled, navigate, location.pathname]);
  
  /**
   * Dismiss restore prompt
   */
  const dismissRestorePrompt = useCallback(() => {
    setShowRestorePrompt(false);
    setLastSession(null);
    try {
      localStorage.removeItem(`${LS_KEYS.LAST_SESSION}.${userId}`);
    } catch {}
  }, [userId]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Check for session to restore on mount
  useEffect(() => {
    if (autoRestore && hasSessionToRestore) {
      setShowRestorePrompt(true);
    }
  }, []); // Only on mount
  
  // Save session on unload
  useEffect(() => {
    const handleUnload = () => {
      saveSession();
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [saveSession]);
  
  // Track scroll position
  useEffect(() => {
    if (!enabled) return;
    
    let rafId;
    let lastScrollTop = 0;
    
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        if (Math.abs(scrollTop - lastScrollTop) > 50) { // Only save significant changes
          saveScrollPosition(scrollTop);
          lastScrollTop = scrollTop;
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [enabled, saveScrollPosition]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const lastContext = useMemo(() => {
    if (contextHistory.length === 0) return null;
    return contextHistory[contextHistory.length - 1];
  }, [contextHistory]);
  
  const lastWorkingOn = useMemo(() => {
    if (!lastContext) return null;
    
    return {
      ...lastContext,
      label: getContextLabel(lastContext),
      icon: getContextIcon(lastContext),
      timeAgo: formatTimeAgo(lastContext.timestamp),
    };
  }, [lastContext]);
  
  const welcomeBackMessage = useMemo(() => {
    if (!lastWorkingOn) return null;
    
    const { label, timeAgo } = lastWorkingOn;
    return `Welcome back! You were working on "${label}" ${timeAgo}.`;
  }, [lastWorkingOn]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════════════
  
  return {
    // Current state
    currentContext,
    contextHistory,
    lastContext,
    lastWorkingOn,
    restoredContext,
    
    // Messages
    welcomeBackMessage,
    
    // Session
    lastSession,
    hasSessionToRestore,
    showRestorePrompt,
    
    // Recent items
    recentProjects: getRecentItems('projects'),
    recentTasks: getRecentItems('tasks'),
    recentPages: getRecentItems('pages'),
    
    // Actions - Context
    recordContext,
    recordPageVisit,
    recordProjectView,
    recordTaskView,
    
    // Actions - Scroll
    saveScrollPosition,
    getScrollPosition,
    restoreScrollPosition,
    
    // Actions - Expanded
    setExpanded,
    getExpanded,
    toggleExpanded,
    
    // Actions - View Preferences
    setViewPreference,
    getViewPreference,
    
    // Actions - Recent Items
    addRecentItem,
    getRecentItems,
    
    // Actions - Session
    saveSession,
    restoreSession,
    dismissRestorePrompt,
    
    // Utilities
    formatTimeAgo,
    getContextLabel,
    getContextIcon,
    
    // Constants
    CONTEXT_TYPES,
  };
}

export default useContextMemory;
