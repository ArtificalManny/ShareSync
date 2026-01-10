import React, { useContext, useEffect, useState } from 'react';
import { MessageContext } from '../../context/MessageContext';
import { MessageCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import NewConversationModal from './NewConversationModal';

export default function MessageList() {
  const { conversations, loadConversations, loadMessages, activeConversation } = useContext(MessageContext);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getOtherUser = (conversation) => {
    const { sender, recipient } = conversation;
    return sender || recipient;
  };

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Messages</h2>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            + New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!conversations || conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageCircle size={64} className="text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No conversations yet</h3>
              <p className="text-sm text-slate-500 mb-4">
                Start a new conversation to begin messaging
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Start Conversation
              </button>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conversation) => {
                const otherUser = getOtherUser(conversation);
                const isActive = conversation.conversationId === activeConversation;

                return (
                  <motion.button
                    key={conversation.conversationId}
                    onClick={() => loadMessages(conversation.conversationId)}
                    className={`w-full text-left rounded-xl px-4 py-3 transition-all ${
                      isActive
                        ? 'bg-indigo-600/20 border border-indigo-500/50'
                        : 'hover:bg-slate-800/50 border border-transparent'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={
                            otherUser?.profilePicture ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              otherUser?.username || 'User'
                            )}`
                          }
                          alt={otherUser?.username || 'User'}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700"
                        />
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-white truncate">
                            {otherUser?.firstName && otherUser?.lastName
                              ? `${otherUser.firstName} ${otherUser.lastName}`
                              : otherUser?.username || 'Unknown User'}
                          </p>
                          <span className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
                            <Clock size={12} />
                            {formatTimestamp(conversation.lastMessage?.createdAt)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-400 truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>

                        {conversation.lastMessage?.energy && (
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${
                                conversation.lastMessage.energy === 'urgent'
                                  ? 'bg-red-500/20 text-red-400'
                                  : conversation.lastMessage.energy === 'normal'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-green-500/20 text-green-400'
                              }`}
                            >
                              {conversation.lastMessage.energy}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <NewConversationModal isOpen={showNewModal} onClose={() => setShowNewModal(false)} />
    </>
  );
}
