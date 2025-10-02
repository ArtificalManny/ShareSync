// src/pages/Messenger.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Check if messaging is enabled via env or localStorage override */
function isMessagingEnabled() {
  const envOn = import.meta?.env?.VITE_MESSAGES_ENABLED === 'true';
  const lsOn = (typeof window !== 'undefined') && localStorage.getItem('ss:features:messages') === 'on';
  return envOn || lsOn;
}

const Messages = ({ user }) => {
  const navigate = useNavigate();

  // feature flag
  const [enabled, setEnabled] = useState(isMessagingEnabled());
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'ss:features:messages') setEnabled(isMessagingEnabled());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const enableNow = () => {
    localStorage.setItem('ss:features:messages', 'on');
    setEnabled(true);
  };

  // demo chats (kept from your version)
  const [chats, setChats] = useState(() => ([
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
  ]));

  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  // choose first chat by default once enabled/loaded
  useEffect(() => {
    if (enabled && chats.length && !selectedChat) setSelectedChat(chats[0]);
  }, [enabled, chats, selectedChat]);

  const handleSendMessage = (chatId) => {
    const text = newMessage.trim();
    if (!text) return;

    const updated = chats.map((chat) => {
      if (chat.id !== chatId) return chat;
      const now = new Date().toISOString();
      return {
        ...chat,
        messages: [...chat.messages, { sender: user?.username || 'You', content: text, timestamp: now }],
        lastMessage: text,
        timestamp: now,
      };
    });

    setChats(updated);
    setNewMessage('');
  };

  const onComposerKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && selectedChat) {
      e.preventDefault();
      handleSendMessage(selectedChat.id);
    }
  };

  // ---------- Disabled state ----------
  if (!enabled) {
    return (
      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
        <section className="rounded-2xl border border-border bg-surface p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">Messaging is disabled</h1>
          <p className="text-muted mb-6">
            This workspace hasn’t turned on direct messages yet. Enable it for development to preview the UI.
          </p>
          <div className="inline-flex items-center gap-3">
            <button
              className="rounded-full bg-indigo-600 text-white text-sm px-4 py-2 hover:bg-indigo-700"
              onClick={enableNow}
            >
              Enable messaging (dev)
            </button>
            <a
              href="/projects"
              className="rounded-full border border-border px-4 py-2 text-sm hover:bg-white/60"
            >
              Back to Projects
            </a>
          </div>
        </section>
      </main>
    );
  }

  // ---------- Enabled UI ----------
  return (
    <main
      className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-4"
      aria-label="Direct messages"
    >
      <div className="grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] gap-4 h-full">
        {/* Chat list */}
        <aside className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-2">
              {chats.map((chat) => {
                const active = selectedChat?.id === chat.id;
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full text-left rounded-xl border px-3 py-3 transition
                      ${active ? 'border-indigo-300 bg-white/80 dark:bg-slate-900/80' : 'border-border hover:bg-surface-100'}`}
                    aria-current={active ? 'true' : 'false'}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(chat.user)}`}
                        alt={chat.user}
                        className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium truncate">{chat.user}</p>
                          <span className="text-xs text-muted shrink-0">
                            {new Date(chat.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted truncate">{chat.lastMessage}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Thread */}
        <section className="rounded-2xl border border-border bg-surface h-full flex flex-col">
          {!selectedChat ? (
            <div className="flex-1 grid place-items-center text-muted">
              Select a conversation to start messaging.
            </div>
          ) : (
            <>
              <header className="px-4 py-3 border-b border-border flex items-center gap-3">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedChat.user)}`}
                  alt={selectedChat.user}
                  className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                />
                <h3 className="font-semibold">{selectedChat.user}</h3>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedChat.messages.map((msg, idx) => {
                  const mine = msg.sender === (user?.username || 'You');
                  return (
                    <div key={idx} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-xl px-3 py-2 text-sm
                          ${mine ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-border'}`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[11px] mt-1 ${mine ? 'text-white/80' : 'text-muted'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <footer className="px-4 py-3 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    selectedChat && handleSendMessage(selectedChat.id);
                  }}
                  className="flex gap-2"
                  aria-label="Message composer"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={onComposerKeyDown}
                    placeholder="Type a message…"
                    className="flex-1 rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Message text"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-60"
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </button>
                </form>
              </footer>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default Messages;
