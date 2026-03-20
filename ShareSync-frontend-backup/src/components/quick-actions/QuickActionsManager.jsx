// src/components/quick-actions/QuickActionsManager.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS MANAGER & TELEMETRY LIFELINE
// - Manages global keyboard shortcuts (Cmd+K, Cmd+Shift+A, Cmd+/)
// - Renders QuickShip, QuickAnnounce, and the new Frictionless Feedback Engine
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useRef } from 'react';
import QuickShipFAB from './QuickShipFAB';
import QuickAnnounceFAB from './QuickAnnounceFAB';
import { useIsMobile } from '../../hooks/useMobile';
import { LifeBuoy, Send, X, CheckCircle2, Bug, Lightbulb } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { track } from '../../utils/telemetry';

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
const FeedbackLifeline = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [type, setType] = useState('bug'); // 'bug' | 'idea'
  const [status, setStatus] = useState('idle'); // idle | submitting | success
  const inputRef = useRef(null);
  const { user } = useAuth();

  // Handle global shortcut (Cmd/Ctrl + /)
  useEffect(() => {
    const handleFeedbackToggle = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleFeedbackToggle);
    return () => window.removeEventListener('keydown', handleFeedbackToggle);
  }, []);

  // Auto-focus when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 50);
    }
    if (!isOpen) {
      setText('');
      setStatus('idle');
      setType('bug');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!text.trim() || status === 'submitting') return;

    setStatus('submitting');

    const payload = {
      type, // 'bug' or 'idea'
      message: text.trim(),
      url: window.location.href,
      path: window.location.pathname,
      userId: user?._id || user?.id || 'anonymous',
      recent_errors: type === 'bug' ? [...recentErrors] : [], // Only attach logs for bugs
    };

    // Pipe directly to PostHog Neural Network
    track('feedback_submitted', payload);

    // Give the user an instant dopamine hit of success
    setStatus('success');
    setTimeout(() => {
      setIsOpen(false);
      setStatus('idle');
      setText('');
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Subtle bottom-left trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed bottom-6 left-6 z-[90]
          flex items-center justify-center w-10 h-10 rounded-full
          bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
          text-slate-500 dark:text-zinc-400
          shadow-[0_4px_14px_rgba(0,0,0,0.05)]
          hover:shadow-[0_8px_24px_rgba(139,92,246,0.15)]
          hover:text-violet-600 dark:hover:text-violet-400
          hover:border-violet-200 dark:hover:border-violet-500/30
          transition-all duration-300
        "
        title="Report an issue or idea (Cmd + /)"
        aria-label="Report Bug"
      >
        <LifeBuoy className="w-5 h-5" />
      </button>

      {/* The Zero-Friction Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="
            relative w-full max-w-lg bg-white dark:bg-[#111113] 
            border border-slate-200 dark:border-white/10 rounded-2xl 
            shadow-2xl overflow-hidden
            animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 zoom-in-95 duration-200
          ">
            {status === 'success' ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
                  {type === 'bug' ? 'Logs Secured' : 'Insight Captured'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  {type === 'bug' 
                    ? 'Engineering has been notified with your exact system state.' 
                    : 'Your workflow bottleneck has been logged for review.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
                  
                  {/* Phase 4: The Categorization Toggle */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1f1f23] p-1 rounded-lg">
                    <button
                      onClick={() => setType('bug')}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                        ${type === 'bug' 
                          ? 'bg-white dark:bg-[#111113] text-slate-800 dark:text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }
                      `}
                    >
                      <Bug className="w-3.5 h-3.5" />
                      Issue
                    </button>
                    <button
                      onClick={() => setType('idea')}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                        ${type === 'idea' 
                          ? 'bg-white dark:bg-[#111113] text-slate-800 dark:text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }
                      `}
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      Idea
                    </button>
                  </div>

                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 bg-slate-50/50 dark:bg-[#1f1f23]/50">
                  {/* Phase 4: Psychological Placeholder Shift */}
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      type === 'bug' 
                        ? "What went wrong? We'll capture the logs automatically." 
                        : "Don't tell us what feature to build. Tell us what workflow problem or bottleneck you are trying to overcome."
                    }
                    className="
                      w-full h-24 p-0 bg-transparent border-none resize-none
                      text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500
                      focus:ring-0 sm:text-sm
                    "
                    disabled={status === 'submitting'}
                  />
                </div>

                <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-[#111113] border-t border-slate-100 dark:border-white/5">
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                    <span className="hidden sm:inline">Press </span>
                    <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 font-mono text-[9px] bg-slate-50 dark:bg-[#1f1f23]">Cmd</kbd>
                    <span className="hidden sm:inline mx-1"> + </span>
                    <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 font-mono text-[9px] bg-slate-50 dark:bg-[#1f1f23]">Enter</kbd>
                    <span className="hidden sm:inline"> to send.</span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!text.trim() || status === 'submitting'}
                    className="
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      bg-violet-600 text-white hover:bg-violet-700
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200 shadow-sm
                    "
                  >
                    {status === 'submitting' ? 'Sending...' : 'Send'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. MAIN QUICK ACTIONS MANAGER
// ═══════════════════════════════════════════════════════════════════════════════
const QuickActionsManager = ({ projectId }) => {
  const isMobile = useIsMobile();

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
      {projectId && <QuickAnnounceFAB projectId={projectId} />}
    </>
  );
};

export default QuickActionsManager;
