// src/components/views/AnnouncementsView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS — Facebook-style social feed
// ⭐ FIX: Restored TYPE_STYLES & Fixed Identity Resolution
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Megaphone, Plus, Pin, Trash2, Clock, Send, X,
  Loader2, RefreshCw, CheckCheck, AlertTriangle,
  Heart, MessageCircle, Paperclip, Image as ImageIcon,
} from 'lucide-react';
import { toast } from '../ui/toast';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import {
  getAnnouncements, createAnnouncement,
  toggleAnnouncementPin, deleteAnnouncement,
  toggleLike, addComment, deleteComment,
} from '../../api/announcements';

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_STYLES = {
  info:    { bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/20', dot: 'bg-violet-500' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-200 dark:border-amber-500/20',   dot: 'bg-amber-500' },
  success: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
  urgent:  { bg: 'bg-rose-50 dark:bg-rose-500/10',     border: 'border-rose-200 dark:border-rose-500/20',     dot: 'bg-rose-500' },
};

const AVATAR_COLORS = [
  { bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-700 dark:text-violet-300' },
  { bg: 'bg-cyan-100 dark:bg-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-300' },
  { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-300' },
];

// ─── Upload helper ──────────────────────────────────────────────────────────

async function uploadFileToServer(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await client.post('/uploads/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const data = res.data;
  if (data?.ok === false) throw new Error(data?.moderation?.reason || 'Upload blocked');
  const url = data?.url || data?.file?.url || data?.data?.url;
  if (!url) throw new Error('No URL returned');
  return url;
}

// ─── Self-Healing Helpers ───────────────────────────────────────────────────

function resolveAuthor(author, currentUser) {
  if (author && typeof author === 'object' && author.firstName) return author;
  
  const authorId = typeof author === 'string' ? author : (author?._id || author?.id);
  const currentId = currentUser?.userId || currentUser?._id || currentUser?.id;
  
  if (authorId && currentId && String(authorId) === String(currentId)) {
    return currentUser;
  }
  return null;
}

function getAuthorName(author, currentUser) {
  const resolved = resolveAuthor(author, currentUser);
  if (!resolved) return 'Team';
  if (resolved.firstName) return `${resolved.firstName} ${resolved.lastName || ''}`.trim();
  if (resolved.username) return resolved.username;
  return 'Team';
}

function getAvatarUrl(author, currentUser) {
  const resolved = resolveAuthor(author, currentUser);
  if (!resolved) return null;
  return resolved.profilePicture || resolved.avatarUrl || resolved.avatar || resolved.photoUrl || null;
}

function getInitials(author, currentUser) {
  const name = getAuthorName(author, currentUser);
  if (!name || name === 'Team') return 'T';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(ts) {
  if (!ts) return '';
  const d = Date.now() - new Date(ts).getTime();
  if (isNaN(d) || d < 0) return 'Just now';
  const m = Math.floor(d / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (dy < 7) return `${dy}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getAvatarColor(name) {
  const idx = (name || '').charCodeAt(0) % AVATAR_COLORS.length || 0;
  return AVATAR_COLORS[idx];
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function Avatar({ author, currentUser, size = 'md' }) {
  const [imgError, setImgError] = useState(false);
  const url = getAvatarUrl(author, currentUser);
  const name = getAuthorName(author, currentUser);
  const color = getAvatarColor(name);
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-11 h-11 text-sm' };

  return (
    <div className={`${sizes[size]} rounded-full ${color.bg} flex items-center justify-center font-bold ${color.text} flex-shrink-0 relative overflow-hidden`}>
      {url && !imgError ? (
        <img 
          src={url} 
          alt={name} 
          className="w-full h-full object-cover absolute inset-0 z-10" 
          onError={() => setImgError(true)}
        />
      ) : null}
      <span className="relative z-0">{getInitials(author, currentUser)}</span>
    </div>
  );
}

function AttachmentGallery({ attachments }) {
  const urls = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  if (urls.length === 0) return null;
  return (
    <div className={`mt-3 ${urls.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
      {urls.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-slate-200 dark:border-white/[0.08] hover:opacity-90 transition-opacity">
          <img src={url} alt="Attachment" className="w-full max-h-64 object-cover" />
        </a>
      ))}
    </div>
  );
}

function CommentSection({ item, projectId, currentUserId, currentUser, onUpdate }) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const comments = Array.isArray(item.comments) ? item.comments : [];
  
  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const updated = await addComment(projectId, item._id || item.id, { text: text.trim() });
      onUpdate(updated);
      setText('');
    } catch { toast({ title: 'Failed to post', variant: 'error' }); } finally { setPosting(false); }
  };

  return (
    <div className="border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/30 dark:bg-black/10">
      {comments.map((c, i) => (
        <div key={c._id || i} className="px-5 py-3 flex gap-3">
          <Avatar author={c.authorId} currentUser={currentUser} size="sm" />
          <div className="flex-1 bg-white dark:bg-white/[0.03] rounded-2xl px-3 py-2 border border-slate-100 dark:border-white/[0.05]">
            <p className="text-xs font-bold text-slate-800 dark:text-white">{getAuthorName(c.authorId, currentUser)}</p>
            <p className="text-xs text-slate-600 dark:text-white/60 mt-0.5">{c.text}</p>
          </div>
        </div>
      ))}
      <div className="px-5 py-3 flex gap-3">
        <Avatar author={{ _id: currentUserId }} currentUser={currentUser} size="sm" />
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-white/[0.05] rounded-xl px-3 py-2 border border-slate-200 dark:border-white/[0.1]">
          <input 
            type="text" value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePost()}
            placeholder="Write a comment..." className="flex-1 bg-transparent text-xs focus:outline-none" 
          />
          <button onClick={handlePost} disabled={!text.trim()} className="text-violet-500"><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementCard({ item, projectId, currentUserId, currentUser, onPin, onDelete, onUpdate }) {
  const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;
  const isPinned = item.pinned;
  const likes = Array.isArray(item.likedBy) ? item.likedBy : [];
  const hasLiked = likes.some(l => String(l?._id || l) === currentUserId);

  const handleLike = async () => {
    try {
      const updated = await toggleLike(projectId, item._id || item.id);
      onUpdate(updated);
    } catch { toast({ title: 'Error', variant: 'error' }); }
  };

  return (
    <article className={`rounded-2xl border ${style.border} bg-white dark:bg-[#1f1f23] overflow-hidden shadow-sm`}>
      {isPinned && (
        <div className="px-5 py-2 bg-amber-50 dark:bg-amber-500/5 border-b border-amber-100 dark:border-amber-500/10 flex items-center gap-2">
          <Pin className="w-3 h-3 text-amber-500 fill-current" />
          <span className="text-[10px] font-bold text-amber-600 uppercase">Pinned Update</span>
        </div>
      )}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar author={item.authorId} currentUser={currentUser} size="md" />
          <div>
            <span className="text-sm font-bold text-slate-900 dark:text-white block">{getAuthorName(item.authorId, currentUser)}</span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(item.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onPin(item._id || item.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"><Pin className="w-4 h-4" /></button>
          <button onClick={() => onDelete(item._id || item.id)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="px-5 py-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
        <p className="text-sm text-slate-600 dark:text-white/70 whitespace-pre-line">{item.message}</p>
        <AttachmentGallery attachments={item.attachments} />
      </div>
      <div className="px-5 py-2 border-t border-slate-100 dark:border-white/[0.05] flex gap-4">
        <button onClick={handleLike} className={`flex items-center gap-1.5 text-xs font-bold ${hasLiked ? 'text-rose-500' : 'text-slate-500'}`}>
          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} /> {likes.length}
        </button>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <MessageCircle className="w-4 h-4" /> {item.comments?.length || 0}
        </div>
      </div>
      <CommentSection item={item} projectId={projectId} currentUserId={currentUserId} currentUser={currentUser} onUpdate={onUpdate} />
    </article>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AnnouncementsView({ projectId }) {
  const { user: currentUser } = useAuth();
  const currentUserId = String(currentUser?.userId || currentUser?._id || currentUser?.id || '');
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', pinned: false });

  const load = useCallback(async () => {
    try {
      const data = await getAnnouncements(projectId);
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch { toast({ title: 'Load failed', variant: 'error' }); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    try {
      const created = await createAnnouncement(projectId, form);
      setAnnouncements(prev => [created, ...prev]);
      setShowCreate(false); setForm({ title: '', message: '', type: 'info', pinned: false });
    } catch { toast({ title: 'Post failed', variant: 'error' }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-black text-slate-900 dark:text-white">Announcements</h2></div>
        <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold shadow-lg hover:bg-violet-700 transition-all">Post Update</button>
      </div>

      <div className="space-y-4">
        {loading ? <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-500" /></div>
        : announcements.map(a => (
          <AnnouncementCard 
            key={a._id || a.id} item={a} projectId={projectId} 
            currentUserId={currentUserId} currentUser={currentUser} 
            onUpdate={u => setAnnouncements(prev => prev.map(x => (x._id || x.id) === (u._id || u.id) ? u : x))}
            onDelete={id => setAnnouncements(prev => prev.filter(x => (x._id || x.id) !== id))}
            onPin={async id => { const u = await toggleAnnouncementPin(projectId, id); setAnnouncements(prev => prev.map(x => (x._id || x.id) === id ? u : x)); }}
          />
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1f1f23] w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-white/10">
             <div className="flex justify-between mb-6">
               <h3 className="text-xl font-black">New Broadcast</h3>
               <button onClick={() => setShowCreate(false)}><X /></button>
             </div>
             <div className="space-y-4">
                <input 
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-none focus:ring-2 ring-violet-500"
                  placeholder="Subject" value={form.title} onChange={e => setForm({...form, title: e.target.value})} 
                />
                <textarea 
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-none focus:ring-2 ring-violet-500 h-32"
                  placeholder="Broadcast message..." value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                />
                <button onClick={handleCreate} className="w-full py-4 bg-violet-600 text-white font-bold rounded-2xl shadow-xl">Send Announcement</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
