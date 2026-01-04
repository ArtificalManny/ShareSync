import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, X, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import TrustBadge from '../trust/TrustBadge';
import { useIsMobile } from '../../hooks/useMobile';

const Announcements = ({ projectId, currentUserId }) => {
  const isMobile = useIsMobile();
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: 'Beta Launch Next Week!',
      content: 'We\'re launching on Product Hunt next Tuesday. Everyone please test the final build.',
      author: 'Sarah',
      timestamp: '2h ago',
      pinned: true
    },
    {
      id: 2,
      title: 'Weekly Sync Moved',
      content: 'Moving our weekly sync to Friday at 3pm instead of Thursday.',
      author: 'Mike',
      timestamp: '1d ago',
      pinned: false
    }
  ]);

  const [expanded, setExpanded] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;

    setAnnouncements([
      {
        id: Date.now(),
        ...newAnnouncement,
        author: 'You',
        timestamp: 'Just now',
        pinned: false
      },
      ...announcements
    ]);

    setNewAnnouncement({ title: '', content: '' });
    setShowCreateModal(false);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Announcements</h3>
              {/* ⭐ WEEK 7: Trust Badge */}
              <TrustBadge type="private" size="xs" inline />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isMobile && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {expanded && (
        <div className="p-4 space-y-3">
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No announcements yet</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-4 rounded-xl border transition-all ${
                  announcement.pinned
                    ? 'bg-orange-500/10 border-orange-500/30'
                    : 'bg-slate-900/50 border-slate-700/50 hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-1">{announcement.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{announcement.author}</span>
                      <span>•</span>
                      <span>{announcement.timestamp}</span>
                    </div>
                  </div>
                  {announcement.pinned && (
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs font-semibold rounded-full">
                      Pinned
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300">{announcement.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">New Announcement</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="What's the announcement?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Details</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder="Add more details..."
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all"
              >
                Post Announcement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
