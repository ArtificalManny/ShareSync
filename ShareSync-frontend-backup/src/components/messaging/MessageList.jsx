import React, { useContext, useEffect, useMemo, useState } from 'react';
import { MessageContext } from '../../context/MessageContext';
import { MessageCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import NewConversationModal from './NewConversationModal';

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
      value.member?._id ||
      value.member?.id ||
      value.sub ||
      ''
    );
  }

  return '';
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const hasUserIdentity = (user) => {
  return Boolean(
    extractId(user) ||
    normalizeText(user?.email) ||
    normalizeText(user?.username || user?.handle)
  );
};

const unwrapParticipantUser = (participant) => {
  if (!participant) return null;

  if (participant.userId && typeof participant.userId === 'object') return participant.userId;
  if (participant.user && typeof participant.user === 'object') return participant.user;
  if (participant.member && typeof participant.member === 'object') return participant.member;

  return participant;
};

const normalizeResolvedUser = (user) => {
  if (!user) return null;

  const avatarUrl = resolveAvatarUrl(user);

  return {
    ...user,
    avatarUrl: avatarUrl || user.avatarUrl || user.profilePicture || null,
    profilePicture: user.profilePicture || avatarUrl || user.avatarUrl || null,
  };
};

const dedupeUsers = (users) => {
  const seen = new Set();

  return (users || []).filter((user, index) => {
    const key =
      extractId(user) ||
      normalizeText(user?.email) ||
      normalizeText(user?.username || user?.handle) ||
      `idx:${index}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

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

  return normalizeResolvedUser({
    ...(storedUser || {}),
    ...(authUser || {}),
    _resolvedId:
      extractId(authUser) ||
      extractId(storedUser) ||
      extractId(storedUser?.user) ||
      '',
  });
};

const getConversationId = (conversationOrValue) => {
  if (!conversationOrValue) return '';

  if (typeof conversationOrValue === 'string' || typeof conversationOrValue === 'number') {
    return String(conversationOrValue);
  }

  return String(
    conversationOrValue.conversationId ||
      conversationOrValue._id ||
      conversationOrValue.id ||
      ''
  );
};

const getConversationParticipants = (conversation) => {
  const rawParticipants = Array.isArray(conversation?.participants)
    ? conversation.participants
    : [];

  const participantUsers = dedupeUsers(
    rawParticipants.map(unwrapParticipantUser).filter(Boolean)
  );

  if (participantUsers.length) return participantUsers;

  return dedupeUsers(
    [
      conversation?.otherParticipant,
      conversation?.otherUser,
      conversation?.recipient,
      conversation?.recipientId,
      conversation?.sender,
      conversation?.senderId,
    ]
      .map(unwrapParticipantUser)
      .filter(Boolean)
  );
};

const getSafeOtherUser = (conversation, currentUser) => {
  const explicitOther = normalizeResolvedUser(
    unwrapParticipantUser(conversation?.otherParticipant || conversation?.otherUser)
  );
  if (explicitOther) return explicitOther;

  const participants = getConversationParticipants(conversation);
  if (!participants.length) return null;

  const currentKnown = hasUserIdentity(currentUser);

  if (currentKnown) {
    const matchedOther = participants.find(
      (participant) => !isSameUser(participant, currentUser)
    );

    if (matchedOther) {
      return normalizeResolvedUser(matchedOther);
    }
  }

  const recipientCandidate = unwrapParticipantUser(
    conversation?.recipient || conversation?.recipientId
  );
  if (
    recipientCandidate &&
    (!currentKnown || !isSameUser(recipientCandidate, currentUser))
  ) {
    return normalizeResolvedUser(recipientCandidate);
  }

  const senderCandidate = unwrapParticipantUser(
    conversation?.sender || conversation?.senderId
  );
  if (
    senderCandidate &&
    (!currentKnown || !isSameUser(senderCandidate, currentUser))
  ) {
    return normalizeResolvedUser(senderCandidate);
  }

  if (participants.length > 1) {
    return normalizeResolvedUser(participants[1]);
  }

  return normalizeResolvedUser(participants[0]);
};

const getDisplayName = (user) => {
  if (!user) return 'Unknown User';

  const first = (user.firstName || '').trim();
  const last = (user.lastName || '').trim();
  const full = [first, last].filter(Boolean).join(' ').trim();

  return full || user.username || user.email || 'Unknown User';
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
        alt={getDisplayName(user)}
        className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-full bg-indigo-500/15 border border-indigo-500/30 ring-2 ring-slate-700 flex items-center justify-center">
      <span className="text-sm font-semibold text-indigo-300">{getInitials(user)}</span>
    </div>
  );
};

export default function MessageList() {
  const { conversations, loadConversations, loadMessages, activeConversation } =
    useContext(MessageContext);
  const { user: authUser } = useAuth();
  const currentUser = useMemo(() => resolveCurrentUser(authUser), [authUser]);

  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    loadConversations?.();
  }, [loadConversations]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';

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

  const isActiveConversation = (conversation) => {
    const conversationId = getConversationId(conversation);
    const activeId = getConversationId(activeConversation);
    return conversationId && activeId && conversationId === activeId;
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
              <h3 className="text-lg font-semibold text-slate-300 mb-2">
                No conversations yet
              </h3>
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
                const otherUser = getSafeOtherUser(conversation, currentUser);
                const isActive = isActiveConversation(conversation);
                const conversationId = getConversationId(conversation);
                const lastMessageAt =
                  conversation.lastMessage?.createdAt ||
                  conversation.lastMessage?.sentAt ||
                  conversation.lastActivityAt ||
                  conversation.updatedAt;

                return (
                  <motion.button
                    key={conversationId || Math.random()}
                    onClick={() => conversationId && loadMessages?.(conversationId)}
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
                        <Avatar user={otherUser} />
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-white truncate">
                            {getDisplayName(otherUser)}
                          </p>
                          <span className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
                            <Clock size={12} />
                            {formatTimestamp(lastMessageAt)}
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

      <NewConversationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
      />
    </>
  );
}
