import React, { useState } from 'react';
import { MessageCircle, Users, X, Send } from 'lucide-react';
import TrustBadge from '../trust/TrustBadge';
import OnlineIndicator from '../presence/OnlineIndicator';
import TypingIndicator from '../presence/TypingIndicator';
import UserPresenceCard from '../presence/UserPresenceCard';

const CollaborationPanel = ({ projectId, projectName, defaultTab = 'chat' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, user: 'Sarah', text: 'Just pushed the login fix!', time: '2m ago' },
    { id: 2, user: 'You', text: 'Nice! Testing now', time: '1m ago' }
  ]);

  // ⭐ WEEK 8: Simulated typing indicator
  const [typingUsers, setTypingUsers] = useState([]);

  // ⭐ WEEK 8: Online users
  const [onlineUsers, setOnlineUsers] = useState([
    { 
      id: 1, 
      name: 'Sarah', 
      avatar: '👩',
      status: 'online',
      currentActivity: 'Working on login page'
    },
    { 
      id: 2, 
      name: 'Mike', 
      avatar: '👨',
      status: 'online',
      currentActivity: 'Reviewing code'
    },
    { 
      id: 3, 
      name: 'Alex', 
      avatar: '🧑',
      status: 'away',
      lastSeen: '10m ago'
    }
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setMessages([...messages, {
      id: Date.now(),
      user: 'You',
      text: message,
      time: 'Just now'
    }]);
    setMessage('');
    setIsTyping(false);
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    // ⭐ WEEK 8: Broadcast typing indicator
    if (!isTyping && e.target.value) {
      setIsTyping(true);
      // In real app: socket.emit('typing:start', { projectId, userName: 'You' })
      
      // Simulate someone else typing
      setTimeout(() => {
        setTypingUsers(['Sarah']);
        setTimeout(() => setTypingUsers([]), 3000);
      }, 2000);
    }
    
    if (!e.target.value) {
      setIsTyping(false);
      // In real app: socket.emit('typing:stop', { projectId })
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl h-full flex flex-col shadow-xl">
      {/* Header with Trust Badge */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-white">Team Chat</h3>
          {/* ⭐ WEEK 8: Online count */}
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <OnlineIndicator size="xs" isOnline={true} />
            <span>{onlineUsers.filter(u => u.status === 'online').length} online</span>
          </div>
        </div>
        <TrustBadge type="encrypted" size="xs" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-2 border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-purple-500/20 text-purple-300'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4 inline-block mr-1" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'members'
              ? 'bg-purple-500/20 text-purple-300'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 inline-block mr-1" />
          Online ({onlineUsers.filter(u => u.status === 'online').length})
        </button>
      </div>

      {/* Chat Messages */}
      {activeTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-xl ${
                  msg.user === 'You'
                    ? 'bg-purple-500/20 ml-8'
                    : 'bg-slate-700/30 mr-8'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-purple-300">{msg.user}</span>
                  <span className="text-xs text-slate-500">{msg.time}</span>
                </div>
                <p className="text-sm text-white">{msg.text}</p>
              </div>
            ))}

            {/* ⭐ WEEK 8: Typing Indicator */}
            {typingUsers.map((userName, idx) => (
              <TypingIndicator key={idx} userName={userName} isTyping={true} />
            ))}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={handleTyping}
                placeholder="Type a message..."
                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="p-2 bg-purple-600 hover:bg-purple-500 rounded-xl transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </>
      )}

      {/* Members List with Presence */}
      {activeTab === 'members' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {onlineUsers.map((user) => (
            <UserPresenceCard
              key={user.id}
              user={user}
              showActivity={true}
              size="md"
            />
          ))}

          {onlineUsers.filter(u => u.status === 'online').length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              No one is online right now
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollaborationPanel;
