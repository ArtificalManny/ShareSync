import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';

/**
 * useContextTracking Hook
 * 
 * Comprehensive context tracking for the "Welcome Back" feature.
 * Automatically tracks and persists user activity state.
 * 
 * Features:
 * - Route/view tracking with project/task detection
 * - Scroll position persistence
 * - Session duration tracking with heartbeat
 * - Unfinished action tracking (Zeigarnik Effect)
 * - Focus mode state preservation
 * - Device info capture
 * - Intelligent debouncing (prevents API spam)
 * 
 * @returns {Object} Context tracking utilities
 */
export const useContextTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Refs for tracking without re-renders
  const contextRef = useRef({});
  const saveTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const sessionStartRef = useRef(Date.now());
  const lastSavedRef = useRef(null);
  const isInitializedRef = useRef(false);
  
  // State for consumers
  const [lastContext, setLastContext] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // ============================================
  // DEVICE INFO
  // ============================================
  
  const getDeviceInfo = useCallback(() => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let platform = 'web';
    
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    if (/iPhone|iPad|iPod/.test(ua)) platform = 'ios';
    else if (/Android/.test(ua)) platform = 'android';
    
    return {
      platform,
      browser,
      version: navigator.appVersion?.slice(0, 20) || 'unknown',
    };
  }, []);

  // ============================================
  // CONTEXT BUILDER
  // ============================================

  /**
   * Build current context from app state
   */
  const getCurrentContext = useCallback(() => {
    const path = location.pathname;
    const scrollPosition = Math.round(window.scrollY);
    const sessionDuration = Math.floor((Date.now() - sessionStartRef.current) / 1000);

    // Determine view type and extract IDs
    let view = 'home';
    let projectId = null;
    let taskId = null;

    if (path.startsWith('/projects/')) {
      const segments = path.split('/');
      projectId = segments[2] || null;
      
      if (path.includes('/tasks/')) {
        view = 'task';
        taskId = segments[4] || null;
      } else if (path.includes('/settings')) {
        view = 'settings';
      } else {
        view = 'project';
      }
    } else if (path === '/projects') {
      view = 'project';
    } else if (path.startsWith('/messages')) {
      view = 'messages';
    } else if (path.startsWith('/profile')) {
      view = 'profile';
    } else if (path.startsWith('/settings')) {
      view = 'settings';
    } else if (path.startsWith('/analytics')) {
      view = 'analytics';
    } else if (path.startsWith('/community')) {
      view = 'team';
    } else if (path === '/home' || path === '/') {
      view = 'home';
    }

    // Validate ObjectIds (24 hex chars)
    const isValidObjectId = (id) => id && /^[a-f\d]{24}$/i.test(id);

    return {
      lastActiveView: view,
      lastActiveProjectId: isValidObjectId(projectId) ? projectId : undefined,
      lastActiveTaskId: isValidObjectId(taskId) ? taskId : undefined,
      lastActiveRoute: path,
      lastScrollPosition: scrollPosition,
      sessionDuration,
      deviceInfo: getDeviceInfo(),
    };
  }, [location.pathname, getDeviceInfo]);

  // ============================================
  // SAVE CONTEXT
  // ============================================

  /**
   * Save context to backend (debounced)
   */
  const saveContext = useCallback(async (immediate = false) => {
    if (!user) return;

    const context = getCurrentContext();
    contextRef.current = context;

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const performSave = async () => {
      // Skip if context hasn't changed meaningfully
      if (lastSavedRef.current) {
        const lastCtx = lastSavedRef.current;
        const sameView = lastCtx.lastActiveView === context.lastActiveView;
        const sameProject = lastCtx.lastActiveProjectId === context.lastActiveProjectId;
        const sameTask = lastCtx.lastActiveTaskId === context.lastActiveTaskId;
        const scrollDiff = Math.abs((lastCtx.lastScrollPosition || 0) - context.lastScrollPosition);
        
        // Skip if nothing meaningful changed (except scroll > 500px)
        if (sameView && sameProject && sameTask && scrollDiff < 500) {
          return;
        }
      }

      setIsSaving(true);
      // Dispatch saving event for ContextIndicator
      window.dispatchEvent(new CustomEvent('context-saving'));
      
      try {
        await apiRequest('/user-context/save', 'POST', context);
        lastSavedRef.current = context;
        setLastContext(context);
        console.debug('[Context] Saved:', context.lastActiveView, context.lastActiveRoute);
        
        // Dispatch saved event for ContextIndicator
        window.dispatchEvent(new CustomEvent('context-saved'));
      } catch (error) {
        console.error('[Context] Save failed:', error.message);
        // Dispatch error event for ContextIndicator
        window.dispatchEvent(new CustomEvent('context-error'));
      } finally {
        setIsSaving(false);
      }
    };

    if (immediate) {
      await performSave();
    } else {
      // Debounce: 5 seconds for normal saves
      saveTimerRef.current = setTimeout(performSave, 5000);
    }
  }, [user, getCurrentContext]);

  /**
   * Force immediate save (for critical moments)
   */
  const forceSave = useCallback(async () => {
    if (!user) return;
    
    const context = getCurrentContext();
    window.dispatchEvent(new CustomEvent('context-saving'));
    
    try {
      await apiRequest('/user-context/save', 'POST', context);
      lastSavedRef.current = context;
      console.debug('[Context] Force saved');
      window.dispatchEvent(new CustomEvent('context-saved'));
    } catch (error) {
      console.error('[Context] Force save failed:', error.message);
      window.dispatchEvent(new CustomEvent('context-error'));
    }
  }, [user, getCurrentContext]);

  // ============================================
  // HEARTBEAT (Session Activity)
  // ============================================

  /**
   * Send heartbeat to track active session
   */
  const sendHeartbeat = useCallback(async () => {
    if (!user) return;
    
    try {
      await apiRequest('/user-context/heartbeat', 'POST');
    } catch (error) {
      // Silently fail heartbeats - not critical
      console.debug('[Context] Heartbeat failed');
    }
  }, [user]);

  // ============================================
  // UNFINISHED ACTIONS (Zeigarnik Effect)
  // ============================================

  /**
   * Track an unfinished action
   * Call when user starts but doesn't complete something
   */
  const trackUnfinishedAction = useCallback(async (action, context, options = {}) => {
    if (!user) return;
    
    try {
      await apiRequest('/user-context/unfinished-action', 'POST', {
        action,
        context,
        contextId: options.contextId,
        priority: options.priority || 'medium',
        estimatedCompletion: options.estimatedMinutes,
      });
      console.debug('[Context] Tracked unfinished:', action);
    } catch (error) {
      console.error('[Context] Track unfinished failed:', error.message);
    }
  }, [user]);

  /**
   * Mark an action as complete
   * Call when user finishes something they started
   */
  const completeAction = useCallback(async (action) => {
    if (!user) return;
    
    try {
      await apiRequest('/user-context/action-complete', 'POST', { action });
      console.debug('[Context] Completed action:', action);
    } catch (error) {
      console.error('[Context] Complete action failed:', error.message);
    }
  }, [user]);

  // ============================================
  // FOCUS SESSION
  // ============================================

  /**
   * Start a focus session
   */
  const startFocusSession = useCallback(async (options = {}) => {
    if (!user) return;
    
    try {
      const result = await apiRequest('/user-context/focus/start', 'POST', {
        taskId: options.taskId,
        projectId: options.projectId,
        plannedDuration: options.plannedMinutes,
      });
      console.debug('[Context] Focus session started');
      return result;
    } catch (error) {
      console.error('[Context] Start focus failed:', error.message);
      throw error;
    }
  }, [user]);

  /**
   * End a focus session
   */
  const endFocusSession = useCallback(async (completed = true, interruptions = 0) => {
    if (!user) return;
    
    try {
      const result = await apiRequest('/user-context/focus/end', 'POST', {
        completed,
        interruptions,
      });
      console.debug('[Context] Focus session ended');
      return result;
    } catch (error) {
      console.error('[Context] End focus failed:', error.message);
      throw error;
    }
  }, [user]);

  // ============================================
  // CONTEXT RESTORATION
  // ============================================

  /**
   * Get saved context summary for Welcome Back
   */
  const getContextSummary = useCallback(async () => {
    if (!user) return null;
    
    try {
      const data = await apiRequest('/user-context/summary', 'GET');
      return data;
    } catch (error) {
      console.error('[Context] Get summary failed:', error.message);
      return null;
    }
  }, [user]);

  /**
   * Restore previous context (navigate to last location)
   */
  const restoreContext = useCallback(async () => {
    if (!user) return false;
    
    try {
      const context = await apiRequest('/user-context', 'GET');
      
      if (context?.lastActiveRoute && context.lastActiveRoute !== location.pathname) {
        navigate(context.lastActiveRoute);
        
        // Restore scroll position after navigation
        setTimeout(() => {
          if (context.lastScrollPosition > 0) {
            window.scrollTo({
              top: context.lastScrollPosition,
              behavior: 'smooth',
            });
          }
        }, 300);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Context] Restore failed:', error.message);
      return false;
    }
  }, [user, location.pathname, navigate]);

  // ============================================
  // EFFECTS
  // ============================================

  // Track route changes
  useEffect(() => {
    if (!user || !isInitializedRef.current) return;
    
    // Save context on route change (immediate for navigation)
    saveContext(true);
  }, [location.pathname, user, saveContext]);

  // Initialize tracking
  useEffect(() => {
    if (!user) return;
    
    // Mark as initialized after first render
    isInitializedRef.current = true;
    sessionStartRef.current = Date.now();
    
    // Initial save
    saveContext(true);
    
    // Start heartbeat (every 30 seconds)
    heartbeatTimerRef.current = setInterval(sendHeartbeat, 30000);
    
    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };
  }, [user, saveContext, sendHeartbeat]);

  // Track scroll (debounced)
  useEffect(() => {
    if (!user) return;

    let scrollTimeout = null;
    
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => saveContext(false), 1000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [user, saveContext]);

  // Save on page visibility change (tab switch/close)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        forceSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, forceSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, []);

  // ============================================
  // RETURN API
  // ============================================

  return {
    // State
    lastContext,
    isSaving,
    
    // Core tracking
    saveContext: forceSave,
    getCurrentContext,
    
    // Context restoration
    getContextSummary,
    restoreContext,
    
    // Unfinished actions (Zeigarnik Effect)
    trackUnfinishedAction,
    completeAction,
    
    // Focus sessions
    startFocusSession,
    endFocusSession,
  };
};

export default useContextTracking;
