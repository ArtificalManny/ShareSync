import React, { useState, useContext, useEffect, useMemo } from 'react';
import { MessageContext } from '../../context/MessageContext';
import { X, Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

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
        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-indigo-500/15 border border-indigo-500/30 ring-2 ring-slate-700 flex items-center justify-center">
      <span className="text-xs font-semibold text-indigo-300">{getInitials(user)}</span>
    </div>
  );
};

const normalizeSearchResults = (payload) => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.results)) return data.results;

  return [];
};

export default function NewConversationModal({ isOpen, onClose }) {
  const { startConversation } = useContext(MessageContext);
  const { user: authUser } = useAuth();
  const currentUser = useMemo(() => resolveCurrentUser(authUser), [authUser]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setLoading(false);
    }
  }, [isOpen]);

  // Search for users
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);

    try {
      let response;

      try {
        response = await client.get('/users/search', {
          params: { q: query },
        });
      } catch {
        response = await client.get('/user/search', {
          params: { q: query },
        });
      }

      const results = normalizeSearchResults(response?.data);
      const filtered = results.filter((user) => !isSameUser(user, currentUser));

      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    try {
      if (isSameUser(user, currentUser)) {
        return;
      }

      await startConversation(extractId(user));
      onClose();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white">New Conversation</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search for a user..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="px-2 pb-2">
                {searchResults.map((user) => (
                  <button
                    key={extractId(user) || user.email || user.username}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <Avatar user={user} />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white">{getDisplayName(user)}</p>
                      <p className="text-sm text-slate-500">
                        {user.username ? `@${user.username}` : user.email || 'User'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <User size={48} className="text-slate-600 mb-3" />
                <p className="text-sm text-slate-400">No users found</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search size={48} className="text-slate-600 mb-3" />
                <p className="text-sm text-slate-400">
                  Search for a user to start messaging
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
