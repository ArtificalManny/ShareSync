// src/pages/Messages.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE D: Empty States That Inspire - Messages Page
// ═══════════════════════════════════════════════════════════════════════════════
//
// UPDATES:
// - ⭐ PHASE D: EmptyInbox celebration when inbox is empty
// - ⭐ PHASE D: Streak tracking for inbox zero
// - Integrated with momentum context
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal,
  Star,
  Archive,
  Trash2,
  Send,
} from 'lucide-react';
import MessageList from '../components/messaging/MessageList';
import MessageThread from '../components/messaging/MessageThread';
import MessageComposer from '../components/messaging/MessageComposer';

// ⭐ PHASE D: Import empty state components
import EmptyInbox, { EmptyInboxCompact } from '../components/empty-states/EmptyInbox';

// ⭐ Import momentum context if available
import { useMomentumContext } from '../contexts/MomentumContext';

/* ─────────────────────────────────────────────────────────────────────────
   MOCK DATA - Replace with real API calls
───────────────────────────────────────────────────────────────────────── */
const MOCK_CONVERSATIONS = [
  {
    id: '1',
    participants: [{ name: 'Sarah Chen', avatar: null }],
    lastMessage: 'Great work on the momentum engine!',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    unread: true,
    starred: true,
  },
  {
    id: '2', 
    participants: [{ name: 'Alex Rivera', avatar: null }],
    lastMessage: 'Can you review the PR when you get a chance?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    unread: true,
    starred: false,
  },
  {
    id: '3',
    participants: [{ name: 'Jordan Park', avatar: null }],
    lastMessage: 'Meeting rescheduled to 3pm',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    unread: false,
    starred: false,
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   CONVERSATION LIST ITEM
───────────────────────────────────────────────────────────────────────── */
const ConversationItem = ({ conversation, isSelected, onClick }) => {
  const { participants, lastMessage, timestamp, unread, starred } = conversation;
  const name = participants[0]?.name || 'Unknown';
  
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 1000 * 60 * 60) {
      return `${Math.floor(diff / (1000 * 60))}m`;
    }
    if (diff < 1000 * 60 * 60 * 24) {
      return `${Math.floor(diff / (1000 * 60 * 60))}h`;
    }
    return `${Math.floor(diff / (1000 * 60 * 60 * 24))}d`;
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-start gap-3 p-4
        transition-all duration-200
        ${isSelected 
          ? 'bg-brand-500/10 border-l-2 border-l-brand-500' 
          : 'hover:bg-surface-2 border-l-2 border-l-transparent'
        }
        ${unread ? 'bg-surface-1/50' : ''}
      `}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-brand-400">
          {name.charAt(0)}
        </span>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm truncate ${unread ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
            {name}
          </span>
          <span className="text-xs text-text-tertiary ml-2 flex-shrink-0">
            {formatTime(timestamp)}
          </span>
        </div>
        <p className={`text-sm truncate ${unread ? 'text-text-secondary' : 'text-text-tertiary'}`}>
          {lastMessage}
        </p>
      </div>
      
      {/* Indicators */}
      <div className="flex flex-col items-center gap-1">
        {starred && <Star className="w-3 h-3 text-warning-500 fill-warning-500" />}
        {unread && <div className="w-2 h-2 rounded-full bg-brand-500" />}
      </div>
    </button>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN MESSAGES PAGE
───────────────────────────────────────────────────────────────────────── */
export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'starred'
  const [showComposer, setShowComposer] = useState(false);
  
  // ⭐ PHASE D: Track inbox zero streak
  const [inboxZeroStreak, setInboxZeroStreak] = useState(3);
  const [bestStreak, setBestStreak] = useState(5);
  const [inboxZeroAchievedAt, setInboxZeroAchievedAt] = useState(null);
  
  // Get momentum context if available
  let momentumContext = { glowLevel: 2, isFireMode: false };
  try {
    momentumContext = useMomentumContext();
  } catch (e) {
    // Context not available, use defaults
  }
  
  const { glowLevel, isFireMode } = momentumContext;

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      // TODO: Replace with real API call
      setTimeout(() => {
        setConversations(MOCK_CONVERSATIONS);
        setLoading(false);
      }, 1000);
    };
    loadConversations();
  }, []);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = conv.participants.some(p => 
        p.name.toLowerCase().includes(searchLower)
      );
      const messageMatch = conv.lastMessage.toLowerCase().includes(searchLower);
      if (!nameMatch && !messageMatch) return false;
    }
    
    // Category filter
    if (filter === 'unread') return conv.unread;
    if (filter === 'starred') return conv.starred;
    return true;
  });

  // Check for inbox zero
  const hasUnreadMessages = conversations.some(c => c.unread);
  const isInboxZero = !loading && conversations.length > 0 && !hasUnreadMessages;
  
  // Track when inbox zero is achieved
  useEffect(() => {
    if (isInboxZero && !inboxZeroAchievedAt) {
      setInboxZeroAchievedAt(new Date());
    } else if (!isInboxZero && inboxZeroAchievedAt) {
      setInboxZeroAchievedAt(null);
    }
  }, [isInboxZero, inboxZeroAchievedAt]);

  // Handle archiving all (achieve inbox zero)
  const handleArchiveAll = () => {
    setConversations(prev => prev.map(c => ({ ...c, unread: false })));
  };

  // Handle compose
  const handleCompose = () => {
    setShowComposer(true);
  };

  return (
    <div className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-4 h-full">
        
        {/* ═══════════════════════════════════════════════════════════════════
            LEFT: Conversation List
        ═══════════════════════════════════════════════════════════════════ */}
        <aside className="rounded-2xl border border-white/[0.06] bg-surface-1 overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Messages</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCompose}
                  className="p-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-2 rounded-lg
                  bg-surface-2 border border-white/[0.06]
                  text-sm text-text-primary
                  placeholder:text-text-tertiary
                  focus:border-brand-500/50 focus:outline-none
                  transition-colors
                "
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-1 mt-3">
              {['all', 'unread', 'starred'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium capitalize
                    transition-all duration-200
                    ${filter === f 
                      ? 'bg-brand-500/10 text-brand-400' 
                      : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
                    }
                  `}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              // Loading skeleton
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-surface-2" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-surface-2 rounded w-3/4" />
                      <div className="h-3 bg-surface-2 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length > 0 ? (
              <div className="divide-y divide-white/[0.06]">
                {filteredConversations.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isSelected={selectedConversation?.id === conv.id}
                    onClick={() => setSelectedConversation(conv)}
                  />
                ))}
              </div>
            ) : isInboxZero ? (
              /* ⭐ PHASE D: Inbox Zero Celebration (compact) */
              <div className="p-4">
                <EmptyInboxCompact 
                  streak={inboxZeroStreak}
                  onCompose={handleCompose}
                />
              </div>
            ) : (
              // No results for search/filter
              <div className="p-8 text-center">
                <Search className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
                <p className="text-sm text-text-secondary">No messages found</p>
                <p className="text-xs text-text-tertiary mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
          
          {/* Quick actions footer */}
          {hasUnreadMessages && (
            <div className="p-3 border-t border-white/[0.06] bg-surface-0">
              <button
                onClick={handleArchiveAll}
                className="
                  w-full flex items-center justify-center gap-2 
                  px-4 py-2 rounded-lg
                  text-xs font-medium text-text-secondary
                  hover:bg-surface-2 transition-colors
                "
              >
                <Archive className="w-4 h-4" />
                Mark all as read
              </button>
            </div>
          )}
        </aside>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT: Active Thread + Composer
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-white/[0.06] bg-surface-1 h-full flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-brand-400">
                      {selectedConversation.participants[0]?.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-text-primary">
                      {selectedConversation.participants[0]?.name}
                    </h3>
                    <p className="text-xs text-text-tertiary">Active now</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors">
                    <Star className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Thread Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <MessageThread conversation={selectedConversation} />
              </div>
              
              {/* Composer */}
              <div className="p-4 border-t border-white/[0.06]">
                <MessageComposer />
              </div>
            </>
          ) : isInboxZero ? (
            /* ⭐ PHASE D: Full Inbox Zero Celebration */
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyInbox
                streak={inboxZeroStreak}
                bestStreak={bestStreak}
                achievedAt={inboxZeroAchievedAt}
                achievements={['Speed Reader', 'Quick Responder']}
                onCompose={handleCompose}
                showConfetti={true}
                showStreak={true}
                showAchievements={true}
                variant="celebratory"
              />
            </div>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-text-tertiary" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Select a conversation
                </h3>
                <p className="text-sm text-text-secondary max-w-sm">
                  Choose a message from the list or start a new conversation
                </p>
                <button
                  onClick={handleCompose}
                  className="
                    mt-4 inline-flex items-center gap-2
                    px-4 py-2 rounded-lg
                    bg-brand-500 text-white text-sm font-medium
                    hover:bg-brand-600 transition-colors
                  "
                >
                  <Plus className="w-4 h-4" />
                  New Message
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      
      {/* Compose Modal (if needed) */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-1 rounded-2xl border border-white/[0.06] w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">New Message</h3>
            <input
              type="text"
              placeholder="To: Search for a person..."
              className="
                w-full px-4 py-3 rounded-lg mb-4
                bg-surface-2 border border-white/[0.06]
                text-text-primary placeholder:text-text-tertiary
                focus:border-brand-500/50 focus:outline-none
              "
            />
            <textarea
              placeholder="Write your message..."
              rows={4}
              className="
                w-full px-4 py-3 rounded-lg mb-4 resize-none
                bg-surface-2 border border-white/[0.06]
                text-text-primary placeholder:text-text-tertiary
                focus:border-brand-500/50 focus:outline-none
              "
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowComposer(false)}
                className="px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowComposer(false)}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
