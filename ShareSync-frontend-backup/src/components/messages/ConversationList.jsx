// src/components/messages/ConversationList.jsx
// Extracted conversation list component for reusability

import React from 'react';
import { Star } from 'lucide-react';
import { getConversationDisplayName, getOtherParticipant, getUserInitials } from '../../api/messages';

const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const initials = getUserInitials(user);
  
  if (user?.avatar) {
    return <img src={user.avatar} alt="" className={`${sizes[size]} rounded-full object-cover ${className}`} />;
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0 ${className}`}>
      <span className="font-medium text-brand-400">{initials}</span>
    </div>
  );
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 1000 * 60 * 60) return Math.floor(diff / (1000 * 60)) <= 0 ? 'now' : `${Math.floor(diff / (1000 * 60))}m`;
  if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h`;
  if (diff < 1000 * 60 * 60 * 24 * 7) return `${Math.floor(diff / (1000 * 60 * 60 * 24))}d`;
  return date.toLocaleDateString();
};

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
      className={`
        w-full flex items-start gap-3 p-4 transition-all duration-200
        ${isSelected ? 'bg-brand-500/10 border-l-2 border-l-brand-500' : 'hover:bg-surface-2 border-l-2 border-l-transparent'}
        ${unreadCount > 0 ? 'bg-surface-1/50' : ''}
      `}
    >
      <Avatar user={otherUser} size="md" />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>{displayName}</span>
          <span className="text-xs text-text-tertiary ml-2 flex-shrink-0">{formatTime(lastMessageAt)}</span>
        </div>
        <p className={`text-sm truncate ${unreadCount > 0 ? 'text-text-secondary' : 'text-text-tertiary'}`}>{lastMessage}</p>
      </div>
      <div className="flex flex-col items-center gap-1">
        {isStarred && <Star className="w-3 h-3 text-warning-500 fill-warning-500" />}
        {unreadCount > 0 && (
          <div className="min-w-[18px] h-[18px] rounded-full bg-brand-500 flex items-center justify-center">
            <span className="text-[10px] font-medium text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}
      </div>
    </button>
  );
}

export default function ConversationList({ conversations, selectedId, onSelect, currentUserId }) {
  return (
    <div className="divide-y divide-white/[0.06]">
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
