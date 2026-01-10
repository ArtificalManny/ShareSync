import React, { useContext, useEffect, useRef } from 'react';
import { MessageContext } from '../../context/MessageContext';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MessageThread() {
  const { messages, activeConversation, loading } = useContext(MessageContext);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeConversation) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Select a conversation</h3>
          <p className="text-sm text-slate-500">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEnergyColor = (energy) => {
    switch (energy) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'normal':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'async':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      default:
        return 'bg-slate-700/50 text-slate-400 border-slate-600/50';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => {
            const isCurrentUser = message.senderId?._id === message.recipientId?._id; // Adjust based on your user check
            const showAvatar = index === 0 || messages[index - 1]?.senderId?._id !== message.senderId?._id;

            return (
              <motion.div
                key={message._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {showAvatar ? (
                    <img
                      src={
                        message.senderId?.profilePicture ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          message.senderId?.username || 'User'
                        )}`
                      }
                      alt={message.senderId?.username || 'User'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700"
                    />
                  ) : (
                    <div className="w-8 h-8" />
                  )}
                </div>

                {/* Message bubble */}
                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isCurrentUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-100 border border-slate-700'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 mt-1 px-2">
                    <span className="text-xs text-slate-500">{formatTime(message.createdAt)}</span>
                    {message.energy && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${getEnergyColor(
                          message.energy
                        )}`}
                      >
                        {message.energy}
                      </span>
                    )}
                    {message.isRead && isCurrentUser && (
                      <span className="text-xs text-slate-500">Read</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
