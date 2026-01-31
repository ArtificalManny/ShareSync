// src/components/focus/InterruptionShield.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS FORTRESS: Intelligent Interruption Shield
// Manages and queues interruptions during focus sessions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { 
  Bell, BellOff, MessageCircle, AtSign, Calendar,
  AlertTriangle, Clock, X, Check, ChevronRight,
  Shield, Zap, Users, Mail
} from 'lucide-react';
import { INTERRUPTION_TYPES, INTERRUPTION_ACTIONS } from '../../hooks/useFocusFortress';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERRUPTION TYPE CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const INTERRUPTION_CONFIG = {
  [INTERRUPTION_TYPES.MESSAGE]: {
    icon: MessageCircle,
    color: 'text-brand-400',
    bgColor: 'bg-brand-500/10',
    label: 'Message',
  },
  [INTERRUPTION_TYPES.MENTION]: {
    icon: AtSign,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    label: 'Mention',
  },
  [INTERRUPTION_TYPES.NOTIFICATION]: {
    icon: Bell,
    color: 'text-warning-400',
    bgColor: 'bg-warning-500/10',
    label: 'Notification',
  },
  [INTERRUPTION_TYPES.CALENDAR]: {
    icon: Calendar,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    label: 'Calendar',
  },
  [INTERRUPTION_TYPES.SYSTEM]: {
    icon: AlertTriangle,
    color: 'text-error-400',
    bgColor: 'bg-error-500/10',
    label: 'System',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERRUPTION PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * InterruptionPrompt - Shows when someone tries to interrupt focus
 */
export function InterruptionPrompt({
  interruption,
  onAction,
  onDismiss,
  className = '',
}) {
  const config = INTERRUPTION_CONFIG[interruption.type] || INTERRUPTION_CONFIG[INTERRUPTION_TYPES.NOTIFICATION];
  const Icon = config.icon;
  
  const [selectedAction, setSelectedAction] = useState(INTERRUPTION_ACTIONS.QUEUE);
  
  const handleSubmit = useCallback(() => {
    onAction?.(selectedAction);
  }, [onAction, selectedAction]);
  
  return (
    <div className={`
      fixed bottom-6 right-6 w-96 z-50
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      shadow-2xl
      animate-in slide-in-from-bottom-4 duration-300
      ${className}
    `}>
      {/* Header */}
      <div className={`px-4 py-3 ${config.bgColor} border-b border-white/[0.06]`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-text-primary">
              {interruption.from?.name || 'Someone'} wants your attention
            </div>
            <div className="text-xs text-text-tertiary">
              {config.label}
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-white/10 text-text-tertiary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Preview */}
      {interruption.preview && (
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="text-sm text-text-secondary line-clamp-2">
            "{interruption.preview}"
          </div>
        </div>
      )}
      
      {/* Action options */}
      <div className="p-4 space-y-2">
        {/* Queue option (recommended) */}
        <button
          onClick={() => setSelectedAction(INTERRUPTION_ACTIONS.QUEUE)}
          className={`
            w-full flex items-center gap-3 p-3 rounded-xl
            border transition-all duration-200 text-left
            ${selectedAction === INTERRUPTION_ACTIONS.QUEUE
              ? 'bg-brand-500/10 border-brand-500/30'
              : 'bg-surface-1 border-white/[0.06] hover:bg-surface-2'
            }
          `}
        >
          <div className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${selectedAction === INTERRUPTION_ACTIONS.QUEUE
              ? 'border-brand-500 bg-brand-500'
              : 'border-text-tertiary'
            }
          `}>
            {selectedAction === INTERRUPTION_ACTIONS.QUEUE && (
              <Check className="w-3 h-3 text-white" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-text-primary">
              Queue for after focus session
            </div>
            <div className="text-xs text-text-tertiary">
              Recommended
            </div>
          </div>
          <Clock className="w-4 h-4 text-text-tertiary" />
        </button>
        
        {/* Allow option */}
        <button
          onClick={() => setSelectedAction(INTERRUPTION_ACTIONS.ALLOW)}
          className={`
            w-full flex items-center gap-3 p-3 rounded-xl
            border transition-all duration-200 text-left
            ${selectedAction === INTERRUPTION_ACTIONS.ALLOW
              ? 'bg-warning-500/10 border-warning-500/30'
              : 'bg-surface-1 border-white/[0.06] hover:bg-surface-2'
            }
          `}
        >
          <div className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${selectedAction === INTERRUPTION_ACTIONS.ALLOW
              ? 'border-warning-500 bg-warning-500'
              : 'border-text-tertiary'
            }
          `}>
            {selectedAction === INTERRUPTION_ACTIONS.ALLOW && (
              <Check className="w-3 h-3 text-white" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-text-primary">
              Allow (break focus)
            </div>
            <div className="text-xs text-text-tertiary">
              Will pause your session
            </div>
          </div>
        </button>
        
        {/* Urgent option */}
        <button
          onClick={() => setSelectedAction(INTERRUPTION_ACTIONS.URGENT)}
          className={`
            w-full flex items-center gap-3 p-3 rounded-xl
            border transition-all duration-200 text-left
            ${selectedAction === INTERRUPTION_ACTIONS.URGENT
              ? 'bg-error-500/10 border-error-500/30'
              : 'bg-surface-1 border-white/[0.06] hover:bg-surface-2'
            }
          `}
        >
          <div className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${selectedAction === INTERRUPTION_ACTIONS.URGENT
              ? 'border-error-500 bg-error-500'
              : 'border-text-tertiary'
            }
          `}>
            {selectedAction === INTERRUPTION_ACTIONS.URGENT && (
              <Check className="w-3 h-3 text-white" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-text-primary">
              Mark as urgent
            </div>
            <div className="text-xs text-text-tertiary">
              Will interrupt immediately
            </div>
          </div>
          <AlertTriangle className="w-4 h-4 text-error-400" />
        </button>
      </div>
      
      {/* Confirm button */}
      <div className="px-4 pb-4">
        <button
          onClick={handleSubmit}
          className="
            w-full py-3 rounded-xl
            bg-brand-500 text-white font-medium
            hover:bg-brand-400 transition-colors
          "
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUEUED INTERRUPTIONS LIST
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * QueuedInterruptions - Shows all queued interruptions
 */
export function QueuedInterruptions({
  interruptions = [],
  onClear,
  onViewItem,
  className = '',
}) {
  if (interruptions.length === 0) return null;
  
  return (
    <div className={`
      rounded-xl overflow-hidden
      bg-surface-1 border border-white/[0.06]
      ${className}
    `}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm font-medium text-text-primary">
            Queued ({interruptions.length})
          </span>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="text-xs text-text-tertiary hover:text-text-secondary"
          >
            Clear all
          </button>
        )}
      </div>
      
      {/* List */}
      <div className="divide-y divide-white/[0.06] max-h-[200px] overflow-y-auto">
        {interruptions.map((item, idx) => {
          const config = INTERRUPTION_CONFIG[item.type] || INTERRUPTION_CONFIG[INTERRUPTION_TYPES.NOTIFICATION];
          const Icon = config.icon;
          
          return (
            <button
              key={idx}
              onClick={() => onViewItem?.(item)}
              className="w-full flex items-center gap-3 p-3 hover:bg-surface-2 transition-colors text-left"
            >
              <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary truncate">
                  {item.from?.name || 'Unknown'}
                </div>
                {item.preview && (
                  <div className="text-xs text-text-tertiary truncate">
                    {item.preview}
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-text-tertiary" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHIELD STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ShieldStatusBadge - Shows current shield status
 */
export function ShieldStatusBadge({
  isActive,
  queuedCount = 0,
  onClick,
  className = '',
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full
        transition-all duration-200
        ${isActive
          ? 'bg-brand-500/10 border border-brand-500/30 text-brand-400'
          : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
        }
        ${className}
      `}
    >
      <Shield className={`w-4 h-4 ${isActive ? 'text-brand-400' : ''}`} />
      <span className="text-xs font-medium">
        {isActive ? 'Shield Active' : 'Shield Off'}
      </span>
      {queuedCount > 0 && (
        <span className="w-5 h-5 rounded-full bg-warning-500 text-white text-xs flex items-center justify-center">
          {queuedCount}
        </span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST-SESSION QUEUE REVIEW
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * QueueReviewModal - Shows queued items after focus session ends
 */
export function QueueReviewModal({
  isOpen,
  interruptions = [],
  onClose,
  onViewItem,
  onClearAll,
  className = '',
}) {
  if (!isOpen || interruptions.length === 0) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={`
        relative w-full max-w-md
        bg-surface-0 border border-white/[0.08] rounded-2xl
        shadow-2xl overflow-hidden
        animate-in fade-in zoom-in-95 duration-300
        ${className}
      `}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-brand-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">
                Focus Complete! 🎉
              </div>
              <div className="text-sm text-text-tertiary">
                You have {interruptions.length} queued item{interruptions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
        
        {/* List */}
        <div className="p-4 max-h-[300px] overflow-y-auto">
          <div className="space-y-2">
            {interruptions.map((item, idx) => {
              const config = INTERRUPTION_CONFIG[item.type] || INTERRUPTION_CONFIG[INTERRUPTION_TYPES.NOTIFICATION];
              const Icon = config.icon;
              
              return (
                <button
                  key={idx}
                  onClick={() => onViewItem?.(item)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-1 hover:bg-surface-2 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">
                      {item.from?.name || config.label}
                    </div>
                    {item.preview && (
                      <div className="text-xs text-text-tertiary truncate">
                        {item.preview}
                      </div>
                    )}
                    <div className="text-[10px] text-text-tertiary mt-1">
                      {formatTimeAgo(item.queuedAt)}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary" />
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center gap-3">
          <button
            onClick={onClearAll}
            className="flex-1 py-2.5 rounded-lg bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors"
          >
            Dismiss All
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white hover:bg-brand-400 transition-colors"
          >
            Review Later
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default InterruptionPrompt;
