// src/components/views/ThreadsView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// THREADS VIEW: Project conversations with task linking
// Connects to existing Messages.jsx, provides project-scoped view
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  MessageCircle, Pin, Link2, Search, Plus, Filter,
  ChevronRight, Clock, Users, Paperclip, MoreHorizontal,
  Star, Bell, BellOff, Archive, ExternalLink, Hash
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA (Replace with actual data from props/hooks)
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_THREADS = [
  {
    id: '1',
    title: 'Sprint 5 Planning Discussion',
    isPinned: true,
    lastMessage: "Let's prioritize the API fixes first",
    lastAuthor: { name: 'Sarah Chen', avatar: '👩‍💻' },
    participants: ['Sarah', 'Alex', 'You'],
    replyCount: 12,
    unreadCount: 3,
    linkedTask: { id: 't1', title: 'API Bug Fixes' },
    updatedAt: '2h ago',
    channel: 'planning'
  },
  {
    id: '2',
    title: 'Design Review - New Dashboard',
    isPinned: false,
    lastMessage: "The new charts look great! Just need to fix the legend",
    lastAuthor: { name: 'Mike Rivera', avatar: '🎨' },
    participants: ['Mike', 'You'],
    replyCount: 8,
    unreadCount: 0,
    linkedTask: { id: 't2', title: 'Dashboard Redesign' },
    updatedAt: '4h ago',
    channel: 'design'
  },
  {
    id: '3',
    title: 'Production Deployment',
    isPinned: false,
    lastMessage: "All green on staging, ready for prod push",
    lastAuthor: { name: 'Alex Kim', avatar: '🚀' },
    participants: ['Alex', 'Sarah', 'You', 'DevOps'],
    replyCount: 24,
    unreadCount: 1,
    linkedTask: null,
    updatedAt: '30m ago',
    channel: 'ops'
  },
  {
    id: '4',
    title: 'General Discussion',
    isPinned: false,
    lastMessage: "Anyone free for coffee at 3?",
    lastAuthor: { name: 'Team', avatar: '☕' },
    participants: ['Team'],
    replyCount: 5,
    unreadCount: 0,
    linkedTask: null,
    updatedAt: 'Yesterday',
    channel: 'general'
  },
];

const CHANNELS = [
  { id: 'all', label: 'All Threads', icon: MessageCircle },
  { id: 'planning', label: 'Planning', icon: Hash },
  { id: 'design', label: 'Design', icon: Hash },
  { id: 'ops', label: 'Ops', icon: Hash },
  { id: 'general', label: 'General', icon: Hash },
];

// ═══════════════════════════════════════════════════════════════════════════════
// THREAD CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ThreadCard({ thread, onThreadClick }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      onClick={() => onThreadClick?.(thread)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group p-4 rounded-xl cursor-pointer transition-all duration-200
        ${thread.unreadCount > 0 
          ? 'bg-brand-500/5 border border-brand-500/20 hover:border-brand-500/40' 
          : 'bg-surface-1 border border-white/[0.06] hover:border-white/[0.12]'
        }
        hover:shadow-lg hover:shadow-brand-500/5
      `}
    >
      {/* Top row: Title + Meta */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {thread.isPinned && (
            <Pin className="w-3.5 h-3.5 text-warning-400 flex-shrink-0" />
          )}
          <h4 className={`font-medium truncate ${thread.unreadCount > 0 ? 'text-text-primary' : 'text-text-secondary'} group-hover:text-brand-400 transition-colors`}>
            {thread.title}
          </h4>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {thread.unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-xs font-medium">
              {thread.unreadCount}
            </span>
          )}
          <span className="text-xs text-text-tertiary">{thread.updatedAt}</span>
        </div>
      </div>
      
      {/* Last message preview */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center text-sm flex-shrink-0">
          {thread.lastAuthor.avatar}
        </div>
        <p className="text-sm text-text-tertiary line-clamp-2">
          <span className="text-text-secondary font-medium">{thread.lastAuthor.name}:</span> {thread.lastMessage}
        </p>
      </div>
      
      {/* Footer: Linked task + Reply count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {thread.linkedTask && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-2 text-xs text-text-tertiary">
              <Link2 className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{thread.linkedTask.title}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-xs text-text-tertiary">
            <Users className="w-3 h-3" />
            <span>{thread.participants.length}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <MessageCircle className="w-3 h-3" />
          <span>{thread.replyCount} replies</span>
        </div>
      </div>
      
      {/* Hover actions */}
      {isHovered && (
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 rounded-lg bg-surface-2 text-text-tertiary hover:text-text-secondary transition-colors">
            <Star className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg bg-surface-2 text-text-tertiary hover:text-text-secondary transition-colors">
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg bg-surface-2 text-text-tertiary hover:text-text-secondary transition-colors">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN THREADS VIEW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ThreadsView({ 
  projectId, 
  threads: propThreads, 
  onOpenFullChat 
}) {
  const [activeChannel, setActiveChannel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  
  // Use prop threads if provided, otherwise use mock data
  const threads = propThreads?.length > 0 ? propThreads : MOCK_THREADS;
  
  // Filter threads
  const filteredThreads = useMemo(() => {
    return threads.filter(thread => {
      // Channel filter
      if (activeChannel !== 'all' && thread.channel !== activeChannel) return false;
      
      // Pinned filter
      if (showPinnedOnly && !thread.isPinned) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          thread.title.toLowerCase().includes(query) ||
          thread.lastMessage.toLowerCase().includes(query) ||
          thread.lastAuthor.name.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [threads, activeChannel, showPinnedOnly, searchQuery]);
  
  const pinnedThreads = filteredThreads.filter(t => t.isPinned);
  const regularThreads = filteredThreads.filter(t => !t.isPinned);
  
  const handleThreadClick = (thread) => {
    console.log('Thread clicked:', thread.id);
    // TODO: Navigate to thread detail or open in Messages.jsx
    onOpenFullChat?.();
  };
  
  const handleNewThread = () => {
    console.log('Create new thread');
    // TODO: Open new thread modal
  };

  return (
    <div className="p-10 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Project Threads</h2>
          <p className="text-text-tertiary">Stay connected with your team conversations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenFullChat}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.08] text-text-secondary text-sm font-medium hover:bg-surface-2 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Messages</span>
          </button>
          
          <button
            onClick={handleNewThread}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Thread</span>
          </button>
        </div>
      </div>
      
      {/* Filters row */}
      <div className="flex items-center gap-4 mb-6">
        {/* Channel tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-1 border border-white/[0.06]">
          {CHANNELS.map(channel => {
            const Icon = channel.icon;
            const isActive = activeChannel === channel.id;
            
            return (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-brand-500/15 text-brand-400' 
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04]'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{channel.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.06] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-500/40 transition-colors"
          />
        </div>
        
        {/* Pinned filter */}
        <button
          onClick={() => setShowPinnedOnly(!showPinnedOnly)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
            ${showPinnedOnly 
              ? 'bg-warning-500/10 border-warning-500/30 text-warning-400' 
              : 'bg-surface-1 border-white/[0.06] text-text-tertiary hover:text-text-secondary'
            }
          `}
        >
          <Pin className="w-4 h-4" />
          <span>Pinned</span>
        </button>
      </div>
      
      {/* Stats bar */}
      <div className="flex items-center gap-6 px-4 py-3 rounded-xl bg-surface-1/50 border border-white/[0.04] mb-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-brand-400" />
          <span className="text-sm text-text-secondary">{threads.length} total threads</span>
        </div>
        <div className="w-px h-4 bg-white/[0.08]" />
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-warning-400" />
          <span className="text-sm text-text-secondary">{pinnedThreads.length} pinned</span>
        </div>
        <div className="w-px h-4 bg-white/[0.08]" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          <span className="text-sm text-text-secondary">
            {threads.filter(t => t.unreadCount > 0).length} with unread
          </span>
        </div>
      </div>
      
      {/* Threads list */}
      <div className="space-y-3">
        {/* Pinned section */}
        {pinnedThreads.length > 0 && !showPinnedOnly && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Pin className="w-4 h-4 text-warning-400" />
              <span className="text-sm font-medium text-text-secondary">Pinned</span>
            </div>
            {pinnedThreads.map(thread => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onThreadClick={handleThreadClick}
              />
            ))}
            {regularThreads.length > 0 && (
              <div className="flex items-center gap-2 mt-6 mb-3">
                <Clock className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm font-medium text-text-secondary">Recent</span>
              </div>
            )}
          </>
        )}
        
        {/* Regular threads */}
        {showPinnedOnly ? (
          filteredThreads.map(thread => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onThreadClick={handleThreadClick}
            />
          ))
        ) : (
          regularThreads.map(thread => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onThreadClick={handleThreadClick}
            />
          ))
        )}
        
        {/* Empty state */}
        {filteredThreads.length === 0 && (
          <div className="py-16 text-center">
            <MessageCircle className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No threads found</h3>
            <p className="text-sm text-text-tertiary mb-6">
              {searchQuery ? 'Try a different search term' : 'Start a conversation to collaborate with your team'}
            </p>
            <button
              onClick={handleNewThread}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Start a Thread</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Pro tip */}
      <div className="mt-8 p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
        <div className="flex items-start gap-3">
          <span className="text-lg">💡</span>
          <div>
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">Pro tip:</strong> Link threads to tasks to keep conversations in context. 
              Use the link icon when composing a message.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
