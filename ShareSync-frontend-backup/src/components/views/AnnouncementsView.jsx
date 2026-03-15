
// src/components/views/AnnouncementsView.jsx

// Social-feed style announcements — create, pin, delete, read tracking

import React, { useState, useEffect, useCallback, useRef } from 'react';

import {

  Megaphone, Plus, Pin, Trash2, Clock, Send, X,

  Loader2, RefreshCw, CheckCheck, AlertTriangle,

} from 'lucide-react';

import { toast } from '../ui/toast';

import {

  getAnnouncements, createAnnouncement,

  toggleAnnouncementPin, deleteAnnouncement, markAnnouncementAsRead,

} from '../../api/announcements';

 

function timeAgo(ts) {

  if (!ts) return '';

  const d = Date.now() - new Date(ts).getTime();

  if (isNaN(d) || d < 0) return '';

  const m = Math.floor(d / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);

  if (m < 1) return 'Just now';

  if (m < 60) return `${m}m ago`;

  if (h < 24) return `${h}h ago`;

  if (dy < 7) return `${dy}d ago`;

  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

}

 

const TYPE_STYLES = {

  info:    { bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/20', dot: 'bg-violet-500' },

  warning: { bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-200 dark:border-amber-500/20',   dot: 'bg-amber-500' },

  success: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500' },

  urgent:  { bg: 'bg-rose-50 dark:bg-rose-500/10',     border: 'border-rose-200 dark:border-rose-500/20',     dot: 'bg-rose-500' },

};

 

function AnnouncementCard({ item, projectId, onPin, onDelete }) {

  const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;

  const isPinned = item.pinned;

 

  return (

    <article className={`rounded-xl border ${style.border} ${isPinned ? style.bg : 'bg-white dark:bg-[#1f1f23]'} overflow-hidden transition-all`}>

      {/* Pin banner */}

      {isPinned && (

        <div className="px-4 py-1.5 bg-amber-100/60 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/15 flex items-center gap-1.5">

          <Pin className="w-3 h-3 text-amber-600 dark:text-amber-400 fill-current" />

          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pinned</span>

        </div>

      )}

 

      <div className="p-5">

        {/* Header: type dot + title + actions */}

        <div className="flex items-start justify-between gap-3 mb-3">

          <div className="flex items-start gap-3 min-w-0 flex-1">

            <div className={`w-2.5 h-2.5 rounded-full ${style.dot} mt-1.5 flex-shrink-0`} />

            <div className="min-w-0 flex-1">

              <h3 className="text-sm font-semibold text-slate-800 dark:text-white leading-snug">

                {item.title}

              </h3>

              <div className="flex items-center gap-2 mt-1.5">

                <span className="text-[11px] text-slate-500 dark:text-white/40">

                  {item.authorId?.firstName ? `${item.authorId.firstName} ${item.authorId.lastName || ''}`.trim() : 'Team'}

                </span>

                <span className="text-slate-300 dark:text-white/15">·</span>

                <span className="text-[11px] text-slate-400 dark:text-white/30 flex items-center gap-1">

                  <Clock className="w-3 h-3" />

                  {timeAgo(item.createdAt)}

                </span>

              </div>

            </div>

          </div>

 

          {/* Actions */}

          <div className="flex items-center gap-1 flex-shrink-0">

            <button onClick={() => onPin(item._id || item.id)}

              className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/15' : 'text-slate-400 dark:text-white/30 hover:bg-slate-100 dark:hover:bg-white/[0.06]'}`}

              title={isPinned ? 'Unpin' : 'Pin'}>

              <Pin className="w-3.5 h-3.5" />

            </button>

            <button onClick={() => onDelete(item._id || item.id)}

              className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"

              title="Delete">

              <Trash2 className="w-3.5 h-3.5" />

            </button>

          </div>

        </div>

 

        {/* Body */}

        <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed pl-5.5">

          {item.message}

        </p>

 

        {/* Read count */}

        {item.readBy?.length > 0 && (

          <div className="flex items-center gap-1.5 mt-3 pl-5.5">

            <CheckCheck className="w-3 h-3 text-emerald-500" />

            <span className="text-[10px] text-slate-400 dark:text-white/30">

              Read by {item.readBy.length}

            </span>

          </div>

        )}

      </div>

    </article>

  );

}

 

export default function AnnouncementsView({ projectId }) {

  const [announcements, setAnnouncements] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState('');

  const [message, setMessage] = useState('');

  const [type, setType] = useState('info');

  const [pinned, setPinned] = useState(false);

  const [posting, setPosting] = useState(false);

  const mountedRef = useRef(true);

 

  const load = useCallback(async () => {

    if (!projectId) return;

    setLoading(true);

    setError(null);

    try {

      const data = await getAnnouncements(projectId);

      if (mountedRef.current) setAnnouncements(data);

    } catch (e) {

      if (mountedRef.current) setError(e?.message || 'Failed to load');

    } finally {

      if (mountedRef.current) setLoading(false);

    }

  }, [projectId]);

 

  useEffect(() => { mountedRef.current = true; load(); return () => { mountedRef.current = false; }; }, [load]);

 

  const handleCreate = async () => {

    if (!title.trim() || !message.trim() || posting) return;

    setPosting(true);

    try {

      const created = await createAnnouncement(projectId, { title: title.trim(), message: message.trim(), type, pinned });

      setAnnouncements(prev => [created, ...prev]);

      setTitle(''); setMessage(''); setType('info'); setPinned(false); setShowCreate(false);

      toast({ title: 'Announcement posted!', variant: 'success' });

    } catch (e) {

      toast({ title: e?.message || 'Failed to post', variant: 'error' });

    } finally { setPosting(false); }

  };

 

  const handlePin = async (id) => {

    try {

      const updated = await toggleAnnouncementPin(projectId, id);

      setAnnouncements(prev => prev.map(a => (a._id || a.id) === id ? { ...a, pinned: updated.pinned ?? !a.pinned } : a));

    } catch { toast({ title: 'Failed to pin', variant: 'error' }); }

  };

 

  const handleDelete = async (id) => {

    setAnnouncements(prev => prev.filter(a => (a._id || a.id) !== id));

    try {

      await deleteAnnouncement(projectId, id);

      toast({ title: 'Announcement deleted', variant: 'default' });

    } catch { toast({ title: 'Failed to delete', variant: 'error' }); }

  };

 

  // Sort: pinned first, then by date

  const sorted = [...announcements].sort((a, b) => {

    if (a.pinned && !b.pinned) return -1;

    if (!a.pinned && b.pinned) return 1;

    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

  });

 

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="p-2 bg-violet-50 dark:bg-violet-500/15 rounded-lg border border-violet-100 dark:border-violet-500/20">

            <Megaphone className="w-5 h-5 text-violet-600 dark:text-violet-400" />

          </div>

          <div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Announcements</h2>

            <p className="text-sm text-slate-500 dark:text-white/40">Broadcast updates to your team and spectators</p>

          </div>

        </div>

 

        <div className="flex items-center gap-2">

          <button onClick={load} disabled={loading}

            className="p-2 rounded-lg text-slate-400 dark:text-white/30 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-colors">

            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />

          </button>

          <button onClick={() => setShowCreate(true)}

            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm">

            <Plus className="w-4 h-4" />

            Post

          </button>

        </div>

      </div>

 

      {/* Feed */}

      <div className="space-y-4">

        {loading && announcements.length === 0 ? (

          <div className="flex items-center gap-2 py-12 justify-center text-slate-400 dark:text-white/30">

            <Loader2 className="w-5 h-5 animate-spin" />

            <span className="text-sm">Loading announcements...</span>

          </div>

        ) : error ? (

          <div className="text-center py-12">

            <AlertTriangle className="w-8 h-8 text-slate-400 dark:text-white/20 mx-auto mb-3" />

            <p className="text-sm text-slate-500 dark:text-white/40">{error}</p>

            <button onClick={load} className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:underline">Try again</button>

          </div>

        ) : sorted.length === 0 ? (

          <div className="text-center py-16 bg-white dark:bg-[#1f1f23] rounded-xl border border-dashed border-slate-200 dark:border-white/[0.06]">

            <div className="w-14 h-14 bg-violet-100 dark:bg-violet-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">

              <Megaphone className="w-7 h-7 text-violet-500 dark:text-violet-400" />

            </div>

            <p className="text-sm font-medium text-slate-600 dark:text-white/60 mb-1">No announcements yet</p>

            <p className="text-xs text-slate-400 dark:text-white/30 mb-4">Post your first update to keep everyone in the loop</p>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center gap-1.5 mx-auto">
              <Plus className="w-3.5 h-3.5" /> Post First Announcement
            </button>

          </div>

        ) : (

          sorted.map(item => (

            <AnnouncementCard

              key={item._id || item.id}

              item={item}

              projectId={projectId}

              onPin={handlePin}

              onDelete={handleDelete}

            />

          ))

        )}

      </div>

 

      {/* Create Modal */}

      {showCreate && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">

          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} aria-label="Close" />

          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden">

 

            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">

                  <Megaphone className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />

                </div>

                <div>

                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Post Announcement</h2>

                  <p className="text-xs text-slate-500 dark:text-white/40">Visible to all members and spectators</p>

                </div>

              </div>

              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">

                <X className="w-4 h-4 text-slate-400 dark:text-white/40" />

              </button>

            </div>

 

            <div className="p-5 space-y-4">

              {/* Type selector */}

              <div>

                <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">Type</label>

                <div className="flex gap-2 mt-2">

                  {['info', 'warning', 'success', 'urgent'].map(t => (

                    <button key={t} onClick={() => setType(t)}

                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border

                        ${type === t

                          ? `${TYPE_STYLES[t].bg} ${TYPE_STYLES[t].border}`

                          : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/[0.05]'

                        }`}>

                      <span className={`inline-block w-2 h-2 rounded-full ${TYPE_STYLES[t].dot} mr-1.5`} />

                      {t}

                    </button>

                  ))}

                </div>

              </div>

 

              {/* Title */}

              <div>

                <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">

                  Title <span className="text-rose-500">*</span>

                </label>

                <input type="text" value={title} onChange={e => setTitle(e.target.value)}

                  placeholder="What's the update?" maxLength={200} autoFocus

                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-shadow" />

              </div>

 

              {/* Message */}

              <div>

                <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">

                  Message <span className="text-rose-500">*</span>

                </label>

                <textarea value={message} onChange={e => setMessage(e.target.value)}

                  placeholder="Share the details..." rows={4} maxLength={5000}

                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-sm resize-none bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-shadow" />

              </div>

 

              {/* Pin toggle */}

              <label className="flex items-center gap-2 cursor-pointer">

                <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)}

                  className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-violet-600 focus:ring-violet-500" />

                <span className="text-xs text-slate-600 dark:text-white/50">Pin this announcement</span>

              </label>

 

              {/* Actions */}

              <div className="flex items-center gap-3 pt-2">

                <button onClick={() => setShowCreate(false)}

                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/[0.10] transition-colors">

                  Cancel

                </button>

                <button onClick={handleCreate} disabled={!title.trim() || !message.trim() || posting}

                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-sm">

                  {posting ? 'Posting...' : <><Send className="w-3.5 h-3.5" /> Post Announcement</>}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

