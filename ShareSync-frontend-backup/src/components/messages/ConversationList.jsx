// src/components/messages/ConversationList.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC CONVERSATION LIST v4.0 - "The Gallery Walk" Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// THEME: "The Communication Hub"
//
// COLOR MAP:
// - Selected Conversation: #EEF2FF (indigo-50) with violet border
// - Unread Background: #F5F3FF (violet-50/50)
// - Unread Badge: #8B5CF6 (violet-500)
// - Avatar Background: #EDE9FE (violet-100)
// - Avatar Text: #7C3AED (violet-600)
// - Text Primary: #1E293B (slate-800)
// - Text Secondary: #64748B (slate-500)
// - Text Muted: #94A3B8 (slate-400)
//
// NO BACKEND CHANGES
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Star } from 'lucide-react';
import { getConversationDisplayName, getOtherParticipant, getUserInitials } from '../../api/messages';

const cn = (...classes) => classes.filter(Boolean).join(' ');

/* ─────────────────────────────────────────────────────────────────────────
   AVATAR - Light theme with violet accent
───────────────────────────────────────────────────────────────────────── */
const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizes = { 
    sm: 'w-8 h-8 text-xs', 
    md: 'w-10 h-10 text-sm', 
    lg: 'w-12 h-12 text-base' 
  };
  const initials = getUserInitials(user);
  
  if (user?.avatar) {
    return (
      <img 
        src={user.avatar} 
        alt="" 
        className={cn(sizes[size], 'rounded-full object-cover', className)} 
      />
    );
  }
  
  return (
    <div className={cn(
      sizes[size], 
      'rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0', 
      className
    )}>
      <span className="font-medium text-violet-600">{initials}</span>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   FORMAT TIME HELPER
───────────────────────────────────────────────────────────────────────── */
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 1000 * 60 * 60) {
    return Math.floor(diff / (1000 * 60)) <= 0 ? 'now' : `${Math.floor(diff / (1000 * 60))}m`;
  }
  if (diff < 1000 * 60 * 60 * 24) {
    return `${Math.floor(diff / (1000 * 60 * 60))}h`;
  }
  if (diff < 1000 * 60 * 60 * 24 * 7) {
    return `${Math.floor(diff / (1000 * 60 * 60 * 24))}d`;
  }
  return date.toLocaleDateString();
};

/* ─────────────────────────────────────────────────────────────────────────
   CONVERSATION ITEM - Light theme
───────────────────────────────────────────────────────────────────────── */
export function ConversationItem({ conversation, isSelected, onClick, currentUserId }) {
  const displayName = getConversationDisplayName(conversation, currentUserId);
  const otherUser = getOtherParticipant(conversation, currentUserId);
  const unreadCount = conversation.unreadCount || 0;
  const isStarred = conversation.isPinned || false;
  const lastMessage = conversation.lastMessage?.content || 'No messages yet';
  const lastMessageAt = conversation.lastMessage?.sentAt || conversation.lastActivityAt;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-4 transition-all duration-200',
        isSelected 
          ? 'bg-indigo-50 border-l-2 border-l-violet-500' 
          : 'hover:bg-slate-50 border-l-2 border-l-transparent',
        unreadCount > 0 && !isSelected && 'bg-violet-50/50'
      )}
    >
      <Avatar user={otherUser} size="md" />
      
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            'text-sm truncate',
            unreadCount > 0 ? 'font-semibold text-slate-800' : 'text-slate-600'
          )}>
            {displayName}
          </span>
          <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
            {formatTime(lastMessageAt)}
          </span>
        </div>
        <p className={cn(
          'text-sm truncate',
          unreadCount > 0 ? 'text-slate-600' : 'text-slate-400'
        )}>
          {lastMessage}
        </p>
      </div>
      
      <div className="flex flex-col items-center gap-1">
        {isStarred && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
        {unreadCount > 0 && (
          <div className="min-w-[18px] h-[18px] rounded-full bg-violet-500 flex items-center justify-center">
            <span className="text-[10px] font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   CONVERSATION LIST
───────────────────────────────────────────────────────────────────────── */
export default function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect, 
  currentUserId 
}) {
  return (
    <div className="divide-y divide-slate-100">
      {conversations.map(conv => (
        <ConversationItem
          key={conv._id || conv.id}
          conversation={conv}
          isSelected={selectedId === (conv._id || conv.id)}
          onClick={() => onSelect(conv)}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}
