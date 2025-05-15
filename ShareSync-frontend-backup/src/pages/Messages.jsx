import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Messages = ({ user }) => {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [chats, setChats] = useState([
    {
      id: 1,
      user: 'Alice',
      lastMessage: 'Hey, how’s the project going?',
      timestamp: '2025-05-14T07:00:00Z',
      messages: [
        { sender: 'Alice', content: 'Hey, how’s the project going?', timestamp: '2025-05-14T07:00:00Z' },
        { sender: user?.username || 'You', content: 'It’s going well! Just finishing some tasks.', timestamp: '2025-05-14T07:05:00Z' },
      ],
    },
    {
      id: 2,
      user: 'Bob',
      lastMessage: 'Can we discuss the timeline?',
      timestamp: '2025-05-14T06:30:00Z',
      messages: [
        { sender: 'Bob', content: 'Can we discuss the timeline?', timestamp: '2025-05-14T06:30:00Z' },
      ],
    },
  ]);

  const handleSendMessage = (chatId) => {
    if (!newMessage.trim()) return;

    const updatedChats = chats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [
            ...chat.messages,
            { sender: user?.username || 'You', content: newMessage, timestamp: new Date().toISOString() },
          ],
          lastMessage: newMessage,
          timestamp: new Date().toISOString(),
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setNewMessage('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex space-x-6">
      {/* Chat List */}
      <div className="w-1/3">
        <h2 className="text-2xl font-display text-vibrant-pink mb-6 animate-fade-in">Messages</h2>
        <div className="space-y-4">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`card glassmorphic transform hover:scale-105 transition-transform cursor-pointer ${
                selectedChat?.id === chat.id ? 'border-2 border-vibrant-pink' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={`https://via.placeholder.com/40?text=${chat.user[0]}`}
                  alt={chat.user}
                  className="w-10 h-10 rounded-full animate-pulse-glow"
                />
                <div>
                  <h3 className="text-lg font-display text-vibrant-pink">{chat.user}</h3>
                  <p className="text-sm text-gray-300">{chat.lastMessage}</p>
                  <p className="text-xs text-gray-400">{new Date(chat.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="w-2/3">
        {selectedChat ? (
          <div className="card glassmorphic animate-fade-in h-[calc(100vh-12rem)] flex flex-col">
            <div className="flex items-center space-x-3 p-4 border-b border-vibrant-pink">
              <img
                src={`https://via.placeholder.com/40?text=${selectedChat.user[0]}`}
                alt={selectedChat.user}
                className="w-10 h-10 rounded-full animate-pulse-glow"
              />
              <h3 className="text-xl font-display text-vibrant-pink">{selectedChat.user}</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {selectedChat.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-4 flex ${msg.sender === user?.username ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      msg.sender === user?.username
                        ? 'bg-vibrant-pink text-white'
                        : 'bg-dark-navy text-gray-300'
                    } animate-slide-in`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-vibrant-pink">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                />
                <button
                  onClick={() => handleSendMessage(selectedChat.id)}
                  className="btn-primary neumorphic hover:scale-105 transition-transform"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card glassmorphic animate-fade-in h-[calc(100vh-12rem)] flex items-center justify-center">
            <p className="text-white text-lg">Select a chat to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;