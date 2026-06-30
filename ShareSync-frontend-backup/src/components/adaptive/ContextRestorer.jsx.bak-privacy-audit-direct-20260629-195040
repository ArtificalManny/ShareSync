// src/components/adaptive/ContextRestorer.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ALIVE AWARE: Context Restorer Component
// Shows "Welcome back" message and restores user's previous context
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, ArrowRight, Clock, Folder, CheckSquare, Layout, 
  RotateCcw, History, ExternalLink, ChevronDown
} from 'lucide-react';
import { useContextMemory, CONTEXT_TYPES } from '../../hooks/useContextMemory';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT ICONS MAP
// ═══════════════════════════════════════════════════════════════════════════════

const CONTEXT_ICONS = {
  [CONTEXT_TYPES.PAGE]: Layout,
  [CONTEXT_TYPES.PROJECT]: Folder,
  [CONTEXT_TYPES.TASK]: CheckSquare,
  default: Layout,
};

// ═══════════════════════════════════════════════════════════════════════════════
// WELCOME BACK PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * WelcomeBackPrompt - Shows when user returns and has previous context
 */
export function WelcomeBackPrompt({
  userName = 'there',
  onRestore,
  onDismiss,
  autoHideDelay = 10000, // Auto-hide after 10 seconds
  className = '',
}) {
  const {
    hasSessionToRestore,
    showRestorePrompt,
    lastSession,
    lastWorkingOn,
    welcomeBackMessage,
    recentProjects,
    recentTasks,
    restoreSession,
    dismissRestorePrompt,
    formatTimeAgo,
  } = useContextMemory({ autoRestore: true });
  
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  
  // Show prompt when session can be restored
  useEffect(() => {
    if (showRestorePrompt && hasSessionToRestore) {
      setIsVisible(true);
    }
  }, [showRestorePrompt, hasSessionToRestore]);
  
  // Auto-hide after delay
  useEffect(() => {
    if (!isVisible || autoHideDelay <= 0) return;
    
    const timer = setTimeout(() => {
      handleDismiss();
    }, autoHideDelay);
    
    return () => clearTimeout(timer);
  }, [isVisible, autoHideDelay]);
  
  // Handle restore
  const handleRestore = useCallback(() => {
    const restored = restoreSession();
    if (restored) {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        onRestore?.();
      }, 300);
    }
  }, [restoreSession, onRestore]);
  
  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      dismissRestorePrompt();
      onDismiss?.();
    }, 300);
  }, [dismissRestorePrompt, onDismiss]);
  
  // Navigate to recent item
  const navigateToItem = useCallback((item) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.id) {
      // Determine route based on item type
      if (item.projectId || item.projectName) {
        navigate(`/projects/${item.projectId}/tasks/${item.id}`);
      } else {
        navigate(`/projects/${item.id}`);
      }
    }
    handleDismiss();
  }, [navigate, handleDismiss]);
  
  if (!isVisible) return null;
  
  return (
    <div className={`
      fixed bottom-6 right-6 z-50
      ${className}
    `}>
      <div className={`
        w-96 rounded-2xl overflow-hidden
        bg-surface-1 border border-white/[0.08]
        shadow-2xl
        transition-all duration-300
        ${isAnimatingOut 
          ? 'opacity-0 translate-y-4' 
          : 'opacity-100 translate-y-0 animate-in fade-in slide-in-from-bottom-4'
        }
      `}>
        {/* Header */}
        <div className="
          px-4 py-3 flex items-center justify-between
          bg-brand-500/10 border-b border-white/[0.06]
        ">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-brand-400">
              Welcome back, {userName}!
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-white/10 transition-colors text-text-tertiary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Main Content */}
        <div className="p-4">
          {/* Last working on */}
          {lastWorkingOn && (
            <div className="mb-4">
              <p className="text-sm text-text-secondary mb-3">
                You were working on:
              </p>
              <button
                onClick={handleRestore}
                className="
                  w-full p-3 rounded-xl
                  bg-surface-2 border border-white/[0.06]
                  hover:border-brand-500/30 hover:bg-surface-3
                  transition-all duration-200
                  text-left group
                "
              >
                <div className="flex items-center gap-3">
                  <div className="
                    w-10 h-10 rounded-lg bg-brand-500/10
                    flex items-center justify-center
                  ">
                    {lastWorkingOn.data?.emoji ? (
                      <span className="text-xl">{lastWorkingOn.data.emoji}</span>
                    ) : (
                      <Layout className="w-5 h-5 text-brand-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {lastWorkingOn.label}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <Clock className="w-3 h-3" />
                      <span>{lastWorkingOn.timeAgo}</span>
                    </div>
                  </div>
                  <ArrowRight className="
                    w-4 h-4 text-text-tertiary
                    group-hover:text-brand-400 group-hover:translate-x-1
                    transition-all duration-200
                  " />
                </div>
              </button>
            </div>
          )}
          
          {/* Quick restore button */}
          <button
            onClick={handleRestore}
            className="
              w-full py-2.5 rounded-lg mb-3
              bg-brand-500 text-white font-medium
              hover:bg-brand-400 transition-colors
              flex items-center justify-center gap-2
            "
          >
            <RotateCcw className="w-4 h-4" />
            <span>Continue where you left off</span>
          </button>
          
          {/* Expand to show more options */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              w-full py-2 text-xs text-text-tertiary
              hover:text-text-secondary transition-colors
              flex items-center justify-center gap-1
            "
          >
            <span>Or pick something else</span>
            <ChevronDown className={`
              w-3 h-3 transition-transform duration-200
              ${isExpanded ? 'rotate-180' : ''}
            `} />
          </button>
          
          {/* Expanded: Recent items */}
          {isExpanded && (
            <div className="
              mt-3 pt-3 border-t border-white/[0.06]
              space-y-3
            ">
              {/* Recent Projects */}
              {recentProjects.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Folder className="w-3 h-3" />
                    <span>Recent Projects</span>
                  </div>
                  <div className="space-y-1">
                    {recentProjects.slice(0, 3).map((project) => (
                      <button
                        key={project.id}
                        onClick={() => navigateToItem({ path: `/projects/${project.id}` })}
                        className="
                          w-full flex items-center gap-2 p-2 rounded-lg
                          hover:bg-surface-2 transition-colors
                          text-left
                        "
                      >
                        <span className="text-sm">{project.emoji || '📁'}</span>
                        <span className="text-sm text-text-secondary truncate flex-1">
                          {project.name}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {formatTimeAgo(project.lastVisited)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Tasks */}
              {recentTasks.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-2">
                    <CheckSquare className="w-3 h-3" />
                    <span>Recent Tasks</span>
                  </div>
                  <div className="space-y-1">
                    {recentTasks.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => navigateToItem(task)}
                        className="
                          w-full flex items-center gap-2 p-2 rounded-lg
                          hover:bg-surface-2 transition-colors
                          text-left
                        "
                      >
                        <CheckSquare className="w-4 h-4 text-text-tertiary" />
                        <span className="text-sm text-text-secondary truncate flex-1">
                          {task.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Start fresh option */}
              <button
                onClick={handleDismiss}
                className="
                  w-full py-2 text-sm text-text-tertiary
                  hover:text-text-secondary transition-colors
                  flex items-center justify-center gap-2
                "
              >
                <span>Start fresh instead</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Auto-dismiss timer indicator */}
        {autoHideDelay > 0 && (
          <div className="h-1 bg-surface-2">
            <div 
              className="h-full bg-brand-500/50 transition-all"
              style={{
                width: '100%',
                animation: `shrink ${autoHideDelay}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>
      
      {/* Keyframes for timer */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECENT ITEMS BAR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RecentItemsBar - Horizontal bar showing recent items for quick access
 */
export function RecentItemsBar({ className = '', maxItems = 5 }) {
  const { recentProjects, recentTasks, formatTimeAgo } = useContextMemory();
  const navigate = useNavigate();
  
  // Combine and sort by last visited
  const recentItems = [
    ...recentProjects.map(p => ({ ...p, type: 'project', path: `/projects/${p.id}` })),
    ...recentTasks.map(t => ({ ...t, type: 'task', path: `/projects/${t.projectId}/tasks/${t.id}` })),
  ].sort((a, b) => (b.lastVisited || 0) - (a.lastVisited || 0)).slice(0, maxItems);
  
  if (recentItems.length === 0) return null;
  
  return (
    <div className={`flex items-center gap-2 overflow-x-auto ${className}`}>
      <History className="w-4 h-4 text-text-tertiary flex-shrink-0" />
      {recentItems.map((item, idx) => (
        <button
          key={`${item.type}-${item.id || idx}`}
          onClick={() => navigate(item.path)}
          className="
            flex items-center gap-1.5 px-2 py-1 rounded-lg
            bg-surface-1 border border-white/[0.06]
            hover:bg-surface-2 hover:border-white/[0.1]
            transition-all duration-150
            flex-shrink-0
          "
          title={`${item.name || item.title} · ${formatTimeAgo(item.lastVisited)}`}
        >
          {item.type === 'project' ? (
            <span className="text-xs">{item.emoji || '📁'}</span>
          ) : (
            <CheckSquare className="w-3 h-3 text-text-tertiary" />
          )}
          <span className="text-xs text-text-secondary truncate max-w-[100px]">
            {item.name || item.title}
          </span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT BREADCRUMB ENHANCER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * useContextBreadcrumb - Hook to enhance breadcrumbs with context memory
 */
export function useContextBreadcrumb() {
  const { recordPageVisit, recordProjectView, recordTaskView, getScrollPosition, restoreScrollPosition } = useContextMemory();
  
  return {
    recordPageVisit,
    recordProjectView,
    recordTaskView,
    getScrollPosition,
    restoreScrollPosition,
  };
}

export default WelcomeBackPrompt;
