// src/components/project/Announcements.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: Project Announcements
// - Uses the central EmptyAnnouncements state for consistency.
// - High contrast headers, 8px grid spacing, hover micro-interactions.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Megaphone, Plus, X, ChevronDown, ChevronUp, Pin, Clock } from 'lucide-react';
import TrustBadge from '../trust/TrustBadge';
import { useIsMobile } from '../../hooks/useMobile';
import { EmptyAnnouncements } from '../ui/EmptyState';

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
    <div className="bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm transition-all overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-500/20 rounded-xl flex items-center justify-center border border-violet-200 dark:border-violet-500/20 shadow-sm">
              <Megaphone className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-[18px] font-black text-slate-900 dark:text-white tracking-tight">Announcements</h3>
              <div className="mt-0.5">
                <TrustBadge type="private" size="xs" inline />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isMobile && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 border border-transparent dark:border-white/5"
              >
                <Plus className="w-4 h-4" /> Post
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {expanded && (
        <div className="p-5 bg-white dark:bg-transparent">
          {announcements.length === 0 ? (
            <EmptyAnnouncements onPost={() => setShowCreateModal(true)} />
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-5 rounded-xl border transition-all duration-300 hover:shadow-md ${
                    announcement.pinned
                      ? 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20'
                      : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 hover:border-violet-300 dark:hover:border-violet-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight mb-1">{announcement.title}</h4>
                      <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <span className="text-violet-600 dark:text-violet-400">{announcement.author}</span>
                        <span className="opacity-50">•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{announcement.timestamp}</span>
                      </div>
                    </div>
                    {announcement.pinned && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-black rounded-lg uppercase tracking-widest shadow-sm">
                        <Pin className="w-3 h-3 fill-current" /> Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed">{announcement.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-black text-slate-900 dark:text-white tracking-tight">New Announcement</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Title</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="What's the update?"
                  className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[14px] text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-shadow"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Details</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder="Share the details..."
                  rows={5}
                  className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[14px] text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none transition-shadow"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl font-bold text-[14px] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!newAnnouncement.title.trim()} className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-[14px] disabled:opacity-50 transition-colors shadow-sm hover:shadow-md">
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
