// src/components/social/SmartMention.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL FABRIC: Smart @Mentions
// Context-aware mentions with status preview and queue options
// Shows user status before mentioning, suggests context
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  AtSign, Clock, Focus, Coffee, Moon, Zap, 
  Bell, BellOff, ChevronRight, MessageCircle,
  Send, X, AlertTriangle
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// MENTION SUGGESTION ITEM
// ═══════════════════════════════════════════════════════════════════════════════

function MentionSuggestion({
  user,
  recentContext,
  isSelected,
  onClick,
}) {
  const statusIcons = {
    active: { icon: Zap, color: 'text-success-500', label: 'Active' },
    focus: { icon: Focus, color: 'text-purple-500', label: 'In Focus' },
    idle: { icon: Moon, color: 'text-text-tertiary', label: 'Away' },
    break: { icon: Coffee, color: 'text-cyan-500', label: 'On Break' },
    offline: { icon: null, color: 'text-text-tertiary', label: 'Offline' },
  };
  
  const status = statusIcons[user.presence] || statusIcons.offline;
  const StatusIcon = status.icon;
  const isDND = user.presence === 'focus';
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-3 rounded-lg
        transition-colors text-left
        ${isSelected 
          ? 'bg-brand-500/10 border border-brand-500/30' 
          : 'hover:bg-surface-2 border border-transparent'
        }
      `}
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full rounded-full" />
          ) : (
            <span className="text-sm font-medium text-text-secondary">
              {user.name?.charAt(0)}
            </span>
          )}
        </div>
        {StatusIcon && (
          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-surface-1 flex items-center justify-center`}>
            <StatusIcon className={`w-2.5 h-2.5 ${status.color}`} />
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{user.name}</span>
          {isDND && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-400">
              DND
            </span>
          )}
        </div>
        <div className="text-xs text-text-tertiary flex items-center gap-1">
          <span className={status.color}>{status.label}</span>
          {recentContext && (
            <>
              <span>·</span>
              <span className="truncate">working on "{recentContext}"</span>
            </>
          )}
        </div>
      </div>
      
      {/* DND Warning */}
      {isDND && (
        <div className="text-[10px] text-purple-400">
          Will queue
        </div>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT SUGGESTION
// ═══════════════════════════════════════════════════════════════════════════════

function ContextSuggestion({
  user,
  suggestions = [],
  onSelect,
}) {
  if (suggestions.length === 0) return null;
  
  return (
    <div className="px-3 py-2 border-t border-white/[0.06]">
      <div className="text-[10px] text-text-tertiary mb-2">
        Suggested context for @{user.name}
      </div>
      <div className="flex flex-wrap gap-1">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(suggestion)}
            className="
              px-2 py-1 rounded-md text-xs
              bg-surface-2 text-text-secondary
              hover:bg-surface-3 hover:text-text-primary
              transition-colors
            "
          >
            about "{suggestion}"?
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS MODE WARNING
// ═══════════════════════════════════════════════════════════════════════════════

function FocusModeWarning({
  user,
  onMentionAnyway,
  onQueueForLater,
  onCancel,
}) {
  const remainingTime = user.focusRemaining || 'some time';
  
  return (
    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Focus className="w-5 h-5 text-purple-400" />
        </div>
        
        <div className="flex-1">
          <div className="text-sm font-medium text-purple-400 mb-1">
            {user.name} is in focus mode
          </div>
          <div className="text-xs text-text-secondary mb-3">
            They have {remainingTime} remaining. Would you like to queue your message?
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onQueueForLater}
              className="
                px-3 py-1.5 rounded-lg
                bg-purple-500 text-white text-sm
                hover:bg-purple-400 transition-colors
                flex items-center gap-1.5
              "
            >
              <Clock className="w-3 h-3" />
              <span>Queue for later</span>
            </button>
            <button
              onClick={onMentionAnyway}
              className="
                px-3 py-1.5 rounded-lg
                bg-surface-2 text-text-secondary text-sm
                hover:bg-surface-3 transition-colors
              "
            >
              Mention anyway
            </button>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg hover:bg-surface-2 text-text-tertiary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SMART MENTION DROPDOWN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SmartMentionDropdown - Dropdown for selecting @mentions
 */
export function SmartMentionDropdown({
  query = '',
  users = [],
  recentContexts = {}, // { [userId]: 'task title' }
  contextSuggestions = {}, // { [userId]: ['suggestion1', ...] }
  position = { top: 0, left: 0 },
  onSelect,
  onSelectWithContext,
  onQueueMention,
  onClose,
  className = '',
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFocusWarning, setShowFocusWarning] = useState(false);
  const containerRef = useRef(null);
  
  // Filter users by query
  const filteredUsers = useMemo(() => {
    if (!query) return users.slice(0, 8);
    const lowerQuery = query.toLowerCase();
    return users.filter(u => 
      u.name?.toLowerCase().includes(lowerQuery) ||
      u.username?.toLowerCase().includes(lowerQuery) ||
      u.email?.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);
  }, [users, query]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredUsers.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredUsers[selectedIndex]) {
            handleUserSelect(filteredUsers[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose?.();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredUsers, selectedIndex, onClose]);
  
  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);
  
  const handleUserSelect = useCallback((user) => {
    if (user.presence === 'focus') {
      setSelectedUser(user);
      setShowFocusWarning(true);
    } else {
      onSelect?.(user);
    }
  }, [onSelect]);
  
  const handleMentionAnyway = useCallback(() => {
    if (selectedUser) {
      onSelect?.(selectedUser);
    }
    setShowFocusWarning(false);
    setSelectedUser(null);
  }, [selectedUser, onSelect]);
  
  const handleQueueForLater = useCallback(() => {
    if (selectedUser) {
      onQueueMention?.(selectedUser);
    }
    setShowFocusWarning(false);
    setSelectedUser(null);
    onClose?.();
  }, [selectedUser, onQueueMention, onClose]);
  
  const handleContextSelect = useCallback((context) => {
    if (selectedUser) {
      onSelectWithContext?.(selectedUser, context);
    }
  }, [selectedUser, onSelectWithContext]);
  
  if (filteredUsers.length === 0) {
    return (
      <div
        ref={containerRef}
        className={`
          absolute z-50 w-72
          bg-surface-1 border border-white/[0.08] rounded-xl
          shadow-2xl overflow-hidden
          ${className}
        `}
        style={position}
      >
        <div className="p-4 text-center text-sm text-text-tertiary">
          No users found matching "{query}"
        </div>
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={`
        absolute z-50 w-80
        bg-surface-1 border border-white/[0.08] rounded-xl
        shadow-2xl overflow-hidden
        ${className}
      `}
      style={position}
    >
      {showFocusWarning && selectedUser ? (
        <FocusModeWarning
          user={selectedUser}
          onMentionAnyway={handleMentionAnyway}
          onQueueForLater={handleQueueForLater}
          onCancel={() => {
            setShowFocusWarning(false);
            setSelectedUser(null);
          }}
        />
      ) : (
        <>
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <AtSign className="w-3 h-3" />
              <span>Mention someone</span>
            </div>
          </div>
          
          {/* User list */}
          <div className="p-2 max-h-[300px] overflow-y-auto">
            {filteredUsers.map((user, idx) => (
              <MentionSuggestion
                key={user.id}
                user={user}
                recentContext={recentContexts[user.id]}
                isSelected={idx === selectedIndex}
                onClick={() => handleUserSelect(user)}
              />
            ))}
          </div>
          
          {/* Context suggestions for selected user */}
          {selectedIndex >= 0 && 
           filteredUsers[selectedIndex] && 
           contextSuggestions[filteredUsers[selectedIndex].id] && (
            <ContextSuggestion
              user={filteredUsers[selectedIndex]}
              suggestions={contextSuggestions[filteredUsers[selectedIndex].id]}
              onSelect={(ctx) => handleContextSelect(ctx)}
            />
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENTION CHIP - Rendered mention in text
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MentionChip - Rendered @mention in text
 */
export function MentionChip({
  user,
  onClick,
  showStatus = true,
  className = '',
}) {
  const statusColors = {
    active: 'bg-success-500',
    focus: 'bg-purple-500',
    idle: 'bg-text-tertiary',
    break: 'bg-cyan-500',
    offline: 'bg-surface-3',
  };
  
  return (
    <button
      onClick={() => onClick?.(user)}
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded
        bg-brand-500/10 text-brand-400
        hover:bg-brand-500/20 transition-colors
        ${className}
      `}
    >
      <span>@{user.name || user.username}</span>
      {showStatus && (
        <span className={`w-1.5 h-1.5 rounded-full ${statusColors[user.presence] || statusColors.offline}`} />
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUEUED MENTION INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * QueuedMentionIndicator - Shows that a mention was queued
 */
export function QueuedMentionIndicator({
  user,
  scheduledTime,
  onCancel,
  className = '',
}) {
  return (
    <div className={`
      flex items-center gap-2 px-3 py-2 rounded-lg
      bg-purple-500/10 border border-purple-500/30
      ${className}
    `}>
      <Clock className="w-4 h-4 text-purple-400" />
      <span className="text-xs text-purple-400">
        @{user.name} will be notified when they exit focus mode
      </span>
      {onCancel && (
        <button
          onClick={onCancel}
          className="ml-auto text-xs text-text-tertiary hover:text-text-secondary"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMART MENTION INPUT HOOK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * useSmartMention - Hook to handle smart mentions in input
 */
export function useSmartMention({
  users = [],
  onMention,
  onQueueMention,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  const handleInput = useCallback((e, cursorPosition) => {
    const value = e.target.value;
    const textBeforeCursor = value.slice(0, cursorPosition);
    
    // Check for @ trigger
    const match = textBeforeCursor.match(/@(\w*)$/);
    if (match) {
      setQuery(match[1]);
      setIsOpen(true);
      // Calculate position based on cursor
      // This is simplified - real impl would use textarea coords
      setPosition({ top: 24, left: 0 });
    } else {
      setIsOpen(false);
      setQuery('');
    }
  }, []);
  
  const handleSelect = useCallback((user) => {
    onMention?.(user);
    setIsOpen(false);
    setQuery('');
  }, [onMention]);
  
  const handleQueue = useCallback((user) => {
    onQueueMention?.(user);
    setIsOpen(false);
    setQuery('');
  }, [onQueueMention]);
  
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);
  
  return {
    isOpen,
    query,
    position,
    handleInput,
    handleSelect,
    handleQueue,
    close,
  };
}

export default SmartMentionDropdown;
