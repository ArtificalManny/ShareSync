// src/components/views/ThreadsView.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageCircle, Pin, Link2, Search, Plus, Filter,
  ChevronRight, Clock, Users, Paperclip, MoreHorizontal,
  Star, Bell, BellOff, Archive, ExternalLink, Hash
} from 'lucide-react';
import { getProjectThreads } from '../../api/threads';

const CHANNELS = [
  { id: 'all', label: 'All Threads', icon: MessageCircle },
  { id: 'planning', label: 'Planning', icon: Hash },
  { id: 'design', label: 'Design', icon: Hash },
  { id: 'ops', label: 'Ops', icon: Hash },
  { id: 'general', label: 'General', icon: Hash },
];

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
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {thread.isPinned && <Pin className="w-3.5 h-3.5 text-warning-400 flex-shrink-0" />}
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
      
      <div className="flex items-start gap-3 mb-3">
        <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center text-sm flex-shrink-0">
          {thread.lastAuthor.avatar || '👤'}
        </div>
        <p className="text-sm text-text-tertiary line-clamp-2">
          <span className="text-text-secondary font-medium">{thread.lastAuthor.name}:</span> {thread.lastMessage}
        </p>
      </div>
      
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
            <span>{thread.participants?.length || 0}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <MessageCircle className="w-3 h-3" />
          <span>{thread.replyCount} replies</span>
        </div>
      </div>
    </div>
  );
}

export default function ThreadsView({ projectId, onOpenFullChat }) {
  const [activeChannel, setActiveChannel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      if (!projectId) return;
      setLoading(true);
      try {
        const rawThreads = await getProjectThreads(projectId);
        
        // Map backend ThreadDocument to the UI's expected format
        const mappedThreads = rawThreads.map(t => {
          // Fallback logic for names and avatars
          const author = t.lastReplyBy || t.createdBy;
          const authorName = author?.firstName ? `${author.firstName} ${author.lastName || ''}`.trim() : 'Team Member';
          const authorAvatar = author?.avatar || '👤';

          // Format Date intelligently
          const dateObj = new Date(t.lastReplyAt || t.createdAt);
          const isToday = new Date().toDateString() === dateObj.toDateString();
          const timeString = isToday 
            ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : dateObj.toLocaleDateString();

          return {
            id: t._id,
            title: t.title,
            isPinned: t.isPinned || false,
            lastMessage: t.replyCount > 0 ? 'New activity in thread' : 'Thread started. Be the first to reply!',
            lastAuthor: { name: authorName, avatar: authorAvatar },
            participants: t.participants || [],
            replyCount: t.replyCount || 0,
            unreadCount: 0, // Placeholder until unread API is wired
            linkedTask: t.linkedTasks?.length ? { id: t.linkedTasks[0], title: 'Linked Task' } : null,
            updatedAt: timeString,
            channel: t.category || 'general'
          };
        });

        setThreads(mappedThreads);
      } catch (err) {
        console.error("Failed to load threads:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [projectId]);
  
  const filteredThreads = useMemo(() => {
    return threads.filter(thread => {
      if (activeChannel !== 'all' && thread.channel !== activeChannel) return false;
      if (showPinnedOnly && !thread.isPinned) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          thread.title.toLowerCase().includes(query) ||
          thread.lastAuthor.name.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [threads, activeChannel, showPinnedOnly, searchQuery]);
  
  const pinnedThreads = filteredThreads.filter(t => t.isPinned);
  const regularThreads = filteredThreads.filter(t => !t.isPinned);
  
  const handleThreadClick = (thread) => {
    // Jump straight to the full messages view, potentially passing thread ID in state later
    onOpenFullChat?.();
  };
  
  const handleNewThread = () => {
    onOpenFullChat?.(); // Currently routes to the main messages hub to create
  };

  return (
    <div className="p-10 max-w-[1200px] mx-auto relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface-0/50 backdrop-blur-sm">
           <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

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
      
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-1 border border-white/[0.06]">
          {CHANNELS.map(channel => {
            const Icon = channel.icon;
            const isActive = activeChannel === channel.id;
            
            return (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-brand-500/15 text-brand-400' : 'text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04]'}`}
              >
                <Icon className="w-4 h-4" />
                <span>{channel.label}</span>
              </button>
            );
          })}
        </div>
        
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
        
        <button
          onClick={() => setShowPinnedOnly(!showPinnedOnly)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showPinnedOnly ? 'bg-warning-500/10 border-warning-500/30 text-warning-400' : 'bg-surface-1 border-white/[0.06] text-text-tertiary hover:text-text-secondary'}`}
        >
          <Pin className="w-4 h-4" />
          <span>Pinned</span>
        </button>
      </div>
      
      <div className="space-y-3">
        {pinnedThreads.length > 0 && !showPinnedOnly && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Pin className="w-4 h-4 text-warning-400" />
              <span className="text-sm font-medium text-text-secondary">Pinned</span>
            </div>
            {pinnedThreads.map(thread => <ThreadCard key={thread.id} thread={thread} onThreadClick={handleThreadClick} />)}
            {regularThreads.length > 0 && (
              <div className="flex items-center gap-2 mt-6 mb-3">
                <Clock className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm font-medium text-text-secondary">Recent</span>
              </div>
            )}
          </>
        )}
        
        {showPinnedOnly ? (
          filteredThreads.map(thread => <ThreadCard key={thread.id} thread={thread} onThreadClick={handleThreadClick} />)
        ) : (
          regularThreads.map(thread => <ThreadCard key={thread.id} thread={thread} onThreadClick={handleThreadClick} />)
        )}
        
        {filteredThreads.length === 0 && !loading && (
          <div className="py-16 text-center border border-dashed border-white/[0.1] rounded-2xl bg-surface-1/30">
            <MessageCircle className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No threads found</h3>
            <p className="text-sm text-text-tertiary mb-6">
              {searchQuery ? 'Try a different search term' : 'The General thread should have loaded automatically. Check the console if it failed.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
