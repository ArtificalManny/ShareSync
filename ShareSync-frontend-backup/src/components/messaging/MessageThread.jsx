import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MessageContext } from '../../context/MessageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const safeParseJSON = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const readStoredUser = () => {
  try {
    const raw =
      localStorage.getItem('ss.user') ||
      localStorage.getItem('user') ||
      localStorage.getItem('auth.user');

    if (!raw) return null;

    const parsed = safeParseJSON(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const resolveAvatarUrl = (u) => {
  if (!u) return null;

  return (
    u.avatarUrl ||
    u.profilePicture ||
    u.avatar ||
    u.photoUrl ||
    u.image ||
    u.profile?.avatarUrl ||
    u.profile?.photoUrl ||
    null
  );
};

const extractId = (value) => {
  if (!value) return '';

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'object') {
    return String(
      value._id ||
      value.id ||
      value.userId?._id ||
      value.userId?.id ||
      value.user?._id ||
      value.user?.id ||
      value.senderId?._id ||
      value.senderId?.id ||
      value.sub ||
      ''
    );
  }

  return '';
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const isSameUser = (a, b) => {
  if (!a || !b) return false;

  const aId = extractId(a);
  const bId = extractId(b);
  if (aId && bId) return aId === bId;

  const aEmail = normalizeText(a.email);
  const bEmail = normalizeText(b.email);
  if (aEmail && bEmail) return aEmail === bEmail;

  const aUsername = normalizeText(a.username || a.handle);
  const bUsername = normalizeText(b.username || b.handle);
  if (aUsername && bUsername) return aUsername === bUsername;

  return false;
};

const resolveCurrentUser = (authUser) => {
  const storedUser = readStoredUser();

  return {
    ...(storedUser || {}),
    ...(authUser || {}),
    _resolvedId:
      extractId(authUser) ||
      extractId(storedUser) ||
      extractId(storedUser?.user) ||
      '',
    avatarUrl:
      resolveAvatarUrl(authUser) ||
      resolveAvatarUrl(storedUser) ||
      authUser?.avatarUrl ||
      authUser?.profilePicture ||
      storedUser?.avatarUrl ||
      storedUser?.profilePicture ||
      null,
    profilePicture:
      authUser?.profilePicture ||
      resolveAvatarUrl(authUser) ||
      storedUser?.profilePicture ||
      resolveAvatarUrl(storedUser) ||
      null,
  };
};

const getMessageSenderCandidate = (message) => {
  return message?.senderId || message?.sender || message?.user || message?.author || null;
};

const isOwnMessageSafe = (message, currentUser) => {
  const sender = getMessageSenderCandidate(message);

  if (sender && isSameUser(sender, currentUser)) {
    return true;
  }

  const senderId = extractId(sender);
  const currentId = extractId(currentUser);

  return Boolean(senderId && currentId && senderId === currentId);
};

const getInitials = (user) => {
  if (!user) return '?';

  const first = (user.firstName || '').trim();
  const last = (user.lastName || '').trim();

  if (first || last) {
    return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
  }

  if (user.username) return user.username.slice(0, 2).toUpperCase();
  if (user.email) return user.email.slice(0, 2).toUpperCase();

  return '?';
};

const Avatar = ({ user }) => {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = resolveAvatarUrl(user);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={user?.username || user?.firstName || 'User'}
        className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 ring-2 ring-slate-700 flex items-center justify-center">
      <span className="text-[10px] font-semibold text-indigo-300">{getInitials(user)}</span>
    </div>
  );
};

export default function MessageThread() {
  const { messages, activeConversation, loading } = useContext(MessageContext);
  const { user: authUser } = useAuth();
  const currentUser = useMemo(() => resolveCurrentUser(authUser), [authUser]);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeConversation) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            Select a conversation
          </h3>
          <p className="text-sm text-slate-500">
            Choose a conversation from the list to start messaging
          </p>
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
    if (!timestamp) return '';

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('en-US', {
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
          {(messages || []).map((message, index) => {
            const isCurrentUser = isOwnMessageSafe(message, currentUser);

            const currentSender = getMessageSenderCandidate(message);
            const previousSender =
              index > 0 ? getMessageSenderCandidate(messages[index - 1]) : null;

            const showAvatar =
              index === 0 || !isSameUser(currentSender, previousSender);

            const bubbleUser = isCurrentUser ? currentUser : currentSender;

            return (
              <motion.div
                key={message._id || message.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {showAvatar ? <Avatar user={bubbleUser} /> : <div className="w-8 h-8" />}
                </div>

                {/* Message bubble */}
                <div
                  className={`flex flex-col ${
                    isCurrentUser ? 'items-end' : 'items-start'
                  } max-w-[70%]`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isCurrentUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-100 border border-slate-700'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 mt-1 px-2">
                    <span className="text-xs text-slate-500">
                      {formatTime(message.createdAt || message.sentAt || message.timestamp)}
                    </span>
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
