import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  AlertCircle, 
  Trophy, 
  DollarSign,
  Pin,
  X,
  Check,
  Clock,
  Plus
} from 'lucide-react';
import { getAnnouncements, markAnnouncementAsRead, createAnnouncement } from '../../api/announcements';

const Announcements = ({ projectId, currentUserId }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, [projectId]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements(projectId);
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAnnouncementIcon = (type) => {
    const iconMap = {
      'general': <Megaphone className="w-5 h-5 text-purple-400" />,
      'important': <AlertCircle className="w-5 h-5 text-orange-400" />,
      'milestone': <Trophy className="w-5 h-5 text-yellow-400" />,
      'payment': <DollarSign className="w-5 h-5 text-emerald-400" />,
    };
    return iconMap[type] || iconMap['general'];
  };

  const getTypeEmoji = (type) => {
    const emojiMap = {
      'general': '📢',
      'important': '⚠️',
      'milestone': '✅',
      'payment': '💰',
    };
    return emojiMap[type] || '📢';
  };

  const handleMarkAsRead = async (announcementId) => {
    try {
      await markAnnouncementAsRead(announcementId);
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const isUnread = (announcement) => {
    return !announcement.readBy?.some((r) => r.userId === currentUserId);
  };

  if (loading) {
    return (
      <div className="bg-slate-800/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-700 rounded w-1/4"></div>
          <div className="h-16 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  const pinnedAnnouncements = announcements.filter((a) => a.pinned);

  return (
    <>
      <div className="bg-slate-800/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-white">
            <Megaphone className="w-5 h-5 text-purple-400" />
            Announcements
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {pinnedAnnouncements.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm">No announcements yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Create one to keep everyone informed
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pinnedAnnouncements.map((announcement) => (
              <div
                key={announcement._id}
                className={`p-4 rounded-xl border transition-all ${
                  isUnread(announcement)
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-slate-900/30 border-slate-700/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getAnnouncementIcon(announcement.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        <span>{getTypeEmoji(announcement.type)}</span>
                        {announcement.title}
                        {announcement.pinned && (
                          <Pin className="w-3 h-3 text-purple-400" />
                        )}
                      </h4>
                      {isUnread(announcement) && (
                        <span className="px-2 py-0.5 bg-purple-600 rounded-full text-xs font-medium">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      {announcement.message}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>
                          {announcement.authorId?.firstName} {announcement.authorId?.lastName}
                        </span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                      </div>
                      {isUnread(announcement) && (
                        <button
                          onClick={() => handleMarkAsRead(announcement._id)}
                          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateAnnouncementModal
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchAnnouncements();
          }}
        />
      )}
    </>
  );
};

const CreateAnnouncementModal = ({ projectId, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) return;

    try {
      setCreating(true);
      await createAnnouncement(projectId, {
        title: title.trim(),
        message: message.trim(),
        type,
        pinned: true,
      });
      onCreated();
    } catch (error) {
      console.error('Failed to create announcement:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Create Announcement</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'general', label: '📢 General', color: 'purple' },
                { value: 'important', label: '⚠️ Important', color: 'orange' },
                { value: 'milestone', label: '✅ Milestone', color: 'yellow' },
                { value: 'payment', label: '💰 Payment', color: 'emerald' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    type === t.value
                      ? `bg-${t.color}-500/20 border-${t.color}-500 text-${t.color}-400`
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-purple-500/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Payment sent to beneficiary Y"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide details about this announcement..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none"
              maxLength={2000}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !title.trim() || !message.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Announcements;
