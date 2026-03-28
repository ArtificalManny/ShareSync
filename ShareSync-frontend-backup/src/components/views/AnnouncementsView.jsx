// src/components/views/AnnouncementsView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS — Phase 2 Polish (Gebbia-Grade Visuals)
// Features: tactile cards, standardized typography, inviting empty states.
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
  toggleAnnouncementPin, deleteAnnouncement, toggleLike, addComment, deleteComment,
} from '../../api/announcements';

// ─── Upload helper ──────────────────────────────────────────────────────────

async function uploadFileToServer(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await client.post('/uploads/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = res.data;
  if (data?.ok === false) {
    throw new Error(data?.moderation?.reason || 'Upload blocked by moderation');
  }

  const url = data?.url || data?.file?.url || data?.data?.url;
  if (!url) throw new Error('Upload succeeded but no URL returned');
  return url;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function getAuthorName(author) {
  if (!author) return 'Team Admin';
  if (author.firstName) return `${author.firstName} ${author.lastName || ''}`.trim();
  if (author.username) return author.username;
  return 'Team Admin';
}

function getInitials(author) {
  const name = getAuthorName(author);
  if (!name || name === 'Team Admin') return 'TA';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarUrl(author) {
  return author?.avatar || author?.profilePicture || null;
}

const AVATAR_COLORS = [
  { bg: 'bg-brand-subtle', text: 'text-brand' },
  { bg: 'bg-info-subtle', text: 'text-info-600' },
  { bg: 'bg-warning-subtle', text: 'text-warning' },
  { bg: 'bg-success-subtle', text: 'text-success' },
];

function getAvatarColor(name) {
  const idx = (name || '').charCodeAt(0) % AVATAR_COLORS.length || 0;
  return AVATAR_COLORS[idx];
}

function getId(item) {
  return item?._id || item?.id || '';
}

const TYPE_STYLES = {
  info:    { bg: 'bg-brand-subtle', border: 'border-brand-200', dot: 'bg-brand' },
  warning: { bg: 'bg-warning-subtle', border: 'border-warning-200', dot: 'bg-warning' },
  success: { bg: 'bg-success-subtle', border: 'border-success-200', dot: 'bg-success' },
  urgent:  { bg: 'bg-error-subtle', border: 'border-error-200', dot: 'bg-error' },
};

// ─── Avatar Component ───────────────────────────────────────────────────────

function Avatar({ author, size = 'md' }) {
  const url = getAvatarUrl(author);
  const name = getAuthorName(author);
  const color = getAvatarColor(name);
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-10 h-10 text-[13px]', lg: 'w-12 h-12 text-[15px]' };

  if (url) {
    return <img src={url} alt={name} className={`${sizes[size]} rounded-full object-cover flex-shrink-0 shadow-sm`} />;
  }

  return (
    <div className={`${sizes[size]} rounded-full ${color.bg} flex items-center justify-center font-bold ${color.text} flex-shrink-0 shadow-sm border border-white/10`}>
      {getInitials(author)}
    </div>
  );
}

// ─── Attachment Display ─────────────────────────────────────────────────────

function AttachmentGallery({ attachments }) {
  const urls = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  if (urls.length === 0) return null;

  return (
    <div className={`mt-4 ${urls.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
      {urls.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-border-default hover:opacity-90 transition-opacity shadow-sm">
          <img src={url} alt={`Attachment ${i + 1}`} className="w-full max-h-72 object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
        </a>
      ))}
    </div>
  );
}

// ─── Attachment Input ───────────────────────────────────────────────────────

function AttachmentInput({ uploadedFiles, onFilesChange }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Only image files are supported', variant: 'error' });
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'File must be under 10MB', variant: 'error' });
        continue;
      }

      const preview = URL.createObjectURL(file);

      onFilesChange((prev) => [...prev, { file, preview, url: null, uploading: true, error: null }]);

      uploadFileToServer(file)
        .then((url) => {
          onFilesChange((prev) => prev.map((a) => a.preview === preview ? { ...a, url, uploading: false } : a));
        })
        .catch((err) => {
          const errorMsg = err?.response?.data?.message || err?.message || 'Upload failed';
          onFilesChange((prev) => prev.map((a) => a.preview === preview ? { ...a, uploading: false, error: errorMsg } : a));
          toast({ title: errorMsg, variant: 'error' });
        });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (preview) => {
    URL.revokeObjectURL(preview);
    onFilesChange((prev) => prev.filter((a) => a.preview !== preview));
  };

  return (
    <div className="space-y-3">
      <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
        <Paperclip className="w-3.5 h-3.5" /> Attachments
      </label>

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {uploadedFiles.map((a, i) => (
            <div key={a.preview} className="relative rounded-xl overflow-hidden border border-border-default aspect-square bg-surface-secondary">
              <img src={a.preview} alt={'Attachment ' + (i + 1)} className={`w-full h-full object-cover ${a.error ? 'opacity-30' : ''}`} />
              {a.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              {a.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-error/20">
                  <span className="text-[10px] text-error font-bold px-1 text-center leading-tight">Blocked</span>
                </div>
              )}
              <button onClick={() => removeFile(a.preview)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-dashed border-border-default text-[13px] font-bold text-text-secondary hover:bg-surface-secondary hover:border-brand-300 hover:text-brand transition-all">
        <ImageIcon className="w-4 h-4" /> Add Photo
      </button>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
    </div>
  );
}

// ─── Comment Section ────────────────────────────────────────────────────────

function CommentSection({ item, projectId, currentUserId, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const inputRef = useRef(null);

  const comments = Array.isArray(item.comments) ? item.comments : [];
  const commentCount = comments.length;

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const updated = await addComment(projectId, getId(item), { text: text.trim(), attachments: [] });
      onUpdate(updated);
      setText('');
      setExpanded(true);
    } catch (e) {
      toast({ title: 'Failed to post comment', variant: 'error' });
    } finally {
      setPosting(false);
    }
  };

  const visibleComments = expanded ? comments : comments.slice(-2);

  return (
    <div className="border-t border-border-default/50 bg-surface-secondary/30">
      {commentCount > 2 && !expanded && (
        <button onClick={() => setExpanded(true)} className="w-full px-6 py-3 text-[12px] font-bold text-text-tertiary hover:text-brand hover:bg-surface-secondary transition-colors text-left tracking-wide">
          View all {commentCount} comments
        </button>
      )}

      {visibleComments.length > 0 && (
        <div className="px-6 py-4 space-y-4">
          {visibleComments.map((c, i) => (
            <div key={c._id || i} className="flex items-start gap-3">
              <Avatar author={c.authorId} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="bg-surface-secondary rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-border-default/50">
                  <span className="text-[13px] font-bold text-text-primary tracking-tight">
                    {getAuthorName(c.authorId)}
                  </span>
                  <p className="text-[13px] text-text-secondary mt-0.5 leading-relaxed">
                    {c.text}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-1.5 px-2">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{timeAgo(c.createdAt)}</span>
                  {String(c.authorId?._id || c.authorId) === currentUserId && (
                    <button onClick={() => deleteComment(projectId, getId(item), c._id).then(onUpdate)} className="text-[10px] font-bold text-text-tertiary hover:text-error uppercase tracking-wider transition-colors">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 py-4 flex items-start gap-3 border-t border-border-default/30">
        <Avatar author={{ _id: currentUserId }} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 bg-surface-primary rounded-xl px-3 py-2 border border-border-default focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-500/20 transition-all shadow-sm">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
              placeholder="Write a comment..."
              className="flex-1 bg-transparent text-[13px] font-medium text-text-primary placeholder-text-tertiary focus:outline-none"
            />
            {posting ? (
              <Loader2 className="w-4 h-4 text-brand animate-spin flex-shrink-0" />
            ) : (
              <button onClick={handlePost} disabled={!text.trim()} className="p-1.5 rounded-lg text-brand hover:bg-brand-subtle disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Announcement Card ──────────────────────────────────────────────────────

function AnnouncementCard({ item, projectId, currentUserId, onPin, onDelete, onUpdate }) {
  const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;
  const isPinned = item.pinned;
  const [liking, setLiking] = useState(false);

  const likes = Array.isArray(item.likes) ? item.likes : [];
  const likeCount = likes.length;
  const hasLiked = likes.some(l => String(l?._id || l) === currentUserId);
  const commentCount = Array.isArray(item.comments) ? item.comments.length : 0;

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const updated = await toggleLike(projectId, getId(item));
      onUpdate(updated);
    } catch { toast({ title: 'Failed to like', variant: 'error' }); } 
    finally { setLiking(false); }
  };

  return (
    <article className={`card-surface dashboard-section flex flex-col ${isPinned ? 'border-warning-300 ring-1 ring-warning-200 shadow-md' : ''}`}>
      {isPinned && (
        <div className="px-6 py-2 bg-warning-subtle border-b border-warning-200 flex items-center gap-2 rounded-t-xl">
          <Pin className="w-3.5 h-3.5 text-warning fill-current" />
          <span className="text-[11px] font-black text-warning uppercase tracking-widest">Pinned Update</span>
        </div>
      )}

      <div className="px-6 pt-6 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <Avatar author={item.authorId} size="md" />
            <div className="min-w-0">
              <span className="text-[15px] font-bold text-text-primary tracking-tight block leading-tight">
                {getAuthorName(item.authorId)}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {timeAgo(item.createdAt)}
                </span>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${style.dot}`} title={item.type} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onPin(getId(item))} className={`p-2 rounded-lg transition-colors ${isPinned ? 'text-warning bg-warning-subtle' : 'text-text-tertiary hover:bg-surface-secondary'}`} title={isPinned ? 'Unpin' : 'Pin'}>
              <Pin className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(getId(item))} className="p-2 rounded-lg text-text-tertiary hover:text-error hover:bg-error-subtle transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pt-3 pb-4">
        <h3 className="text-[16px] font-black text-text-primary tracking-tight leading-snug mb-2">
          {item.title}
        </h3>
        <p className="text-[14px] text-text-secondary leading-relaxed whitespace-pre-line">
          {item.message}
        </p>
        <AttachmentGallery attachments={item.attachments} />
      </div>

      {(likeCount > 0 || commentCount > 0) && (
        <div className="px-6 py-3 flex items-center justify-between text-[12px] font-bold text-text-tertiary border-t border-border-default/50">
          <div className="flex items-center gap-1.5">
            {likeCount > 0 && (
              <>
                <span className="w-5 h-5 rounded-full bg-error flex items-center justify-center shadow-sm">
                  <Heart className="w-3 h-3 text-white fill-white" />
                </span>
                <span className="tabular-nums">{likeCount}</span>
              </>
            )}
          </div>
          {commentCount > 0 && <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>}
        </div>
      )}

      <div className="px-6 py-2 border-t border-border-default flex items-center gap-2">
        <button onClick={handleLike} disabled={liking} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all ${hasLiked ? 'text-error bg-error-subtle' : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'}`}>
          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-error' : ''}`} />
          <span>{hasLiked ? 'Liked' : 'Like'}</span>
        </button>
        <div className="w-px h-6 bg-border-default" />
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-all" onClick={() => { const el = document.querySelector(`[data-comment-input="${getId(item)}"]`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.querySelector('input').focus(); } }}>
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>
      </div>

      <div data-comment-input={getId(item)}>
        <CommentSection item={item} projectId={projectId} currentUserId={currentUserId} onUpdate={onUpdate} />
      </div>

      {item.readBy?.length > 0 && (
        <div className="px-6 pb-4 pt-2 flex items-center gap-1.5 bg-surface-secondary/30 rounded-b-xl">
          <CheckCheck className="w-3.5 h-3.5 text-success" />
          <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Read by {item.readBy.length}</span>
        </div>
      )}
    </article>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AnnouncementsView({ projectId }) {
  const { user } = useAuth();
  const currentUserId = String(user?.userId || user?._id || user?.id || user?.sub || '');

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [pinned, setPinned] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [posting, setPosting] = useState(false);
  const mountedRef = useRef(true);

  const anyUploading = uploadedFiles.some((a) => a.uploading);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true); setError(null);
    try {
      const data = await getAnnouncements(projectId);
      if (mountedRef.current) setAnnouncements(Array.isArray(data) ? data : []);
    } catch (e) {
      if (mountedRef.current) setError(e?.message || 'Failed to load');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { mountedRef.current = true; load(); return () => { mountedRef.current = false; }; }, [load]);

  const handleCreate = async () => {
    if (!title.trim() || !message.trim() || posting) return;
    if (anyUploading) { toast({ title: 'Please wait for uploads to finish', variant: 'error' }); return; }

    setPosting(true);
    try {
      const attachmentUrls = uploadedFiles.filter((a) => a.url && !a.error).map((a) => a.url);
      const created = await createAnnouncement(projectId, { title: title.trim(), message: message.trim(), type, pinned, attachments: attachmentUrls });
      setAnnouncements(prev => [created, ...prev]);
      setTitle(''); setMessage(''); setType('info'); setPinned(false); setUploadedFiles([]); setShowCreate(false);
      toast({ title: 'Announcement posted!', variant: 'success' });
    } catch (e) {
      toast({ title: e?.response?.data?.message || e?.message || 'Failed to post', variant: 'error' });
    } finally { setPosting(false); }
  };

  const handlePin = async (id) => {
    try {
      const updated = await toggleAnnouncementPin(projectId, id);
      setAnnouncements(prev => prev.map(a => getId(a) === id ? { ...a, ...updated } : a));
    } catch { toast({ title: 'Failed to pin', variant: 'error' }); }
  };

  const handleDelete = async (id) => {
    setAnnouncements(prev => prev.filter(a => getId(a) !== id));
    try { await deleteAnnouncement(projectId, id); toast({ title: 'Announcement deleted', variant: 'default' }); } 
    catch { toast({ title: 'Failed to delete', variant: 'error' }); }
  };

  const handleUpdate = (updated) => {
    if (!updated) return;
    const uid = getId(updated);
    setAnnouncements(prev => prev.map(a => getId(a) === uid ? updated : a));
  };

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between dashboard-section">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-subtle rounded-xl border border-brand-200 flex items-center justify-center shadow-sm">
            <Megaphone className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-text-primary tracking-tight">Announcements</h2>
            <p className="text-[14px] font-medium text-text-secondary mt-0.5">Broadcast updates to your team and spectators</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={load} disabled={loading} className="p-2.5 rounded-xl text-text-tertiary hover:bg-surface-secondary hover:text-text-primary disabled:opacity-50 transition-colors shadow-sm border border-border-default bg-surface-primary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-brand hover:bg-brand-600 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            <Plus className="w-4 h-4" /> Share an Update
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {loading && announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand" />
            <span className="text-[14px] font-bold tracking-wide">Loading announcements...</span>
          </div>
        ) : error ? (
          <div className="card-surface text-center py-16 dashboard-section">
            <AlertTriangle className="w-10 h-10 text-error/50 mx-auto mb-4" />
            <p className="text-[15px] font-bold text-text-secondary">{error}</p>
            <button onClick={load} className="mt-3 text-[13px] font-bold text-brand hover:underline">Try again</button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="card-surface text-center py-20 border border-dashed border-border-default dashboard-section">
            <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Megaphone className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-[18px] font-black text-text-primary tracking-tight mb-2">This is a quiet project.</h3>
            <p className="text-[14px] font-medium text-text-secondary mb-6 max-w-sm mx-auto">Share an update, milestone, or critical info to get things moving and keep the team aligned.</p>
            <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 text-[13px] font-bold bg-brand hover:bg-brand-600 text-white rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto hover:-translate-y-0.5">
              <Plus className="w-4 h-4" /> Share an Update
            </button>
          </div>
        ) : (
          sorted.map(item => (
            <AnnouncementCard
              key={getId(item)} item={item} projectId={projectId} currentUserId={currentUserId}
              onPin={handlePin} onDelete={handleDelete} onUpdate={handleUpdate}
            />
          ))
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} aria-label="Close" />
          <div className="relative w-full max-w-lg rounded-2xl border border-border-default bg-surface-primary shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transform transition-all scale-100 opacity-100">

            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-surface-primary z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-subtle flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h2 className="text-[16px] font-black text-text-primary tracking-tight">Share an Update</h2>
                  <p className="text-[12px] font-medium text-text-secondary">Visible to all members and spectators</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-surface-secondary transition-colors">
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Type</label>
                <div className="flex gap-2 mt-2">
                  {['info', 'warning', 'success', 'urgent'].map(t => (
                    <button key={t} onClick={() => setType(t)}
                      className={`px-4 py-2 rounded-xl text-[12px] font-bold capitalize transition-all border ${
                        type === t
                          ? `${TYPE_STYLES[t].bg} ${TYPE_STYLES[t].border} text-text-primary shadow-sm`
                          : 'bg-surface-primary border-border-default text-text-secondary hover:bg-surface-secondary'
                      }`}>
                      <span className={`inline-block w-2 h-2 rounded-full ${TYPE_STYLES[t].dot} mr-2`} />
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">
                  Title <span className="text-error">*</span>
                </label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="What's the update?" maxLength={200} autoFocus
                  className="mt-2 w-full px-4 py-3 rounded-xl text-[14px] font-medium bg-surface-secondary border border-border-default text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-500/20 transition-all shadow-inner" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">
                  Message <span className="text-error">*</span>
                </label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Share the details..." rows={5} maxLength={5000}
                  className="mt-2 w-full px-4 py-3 rounded-xl text-[14px] font-medium resize-none bg-surface-secondary border border-border-default text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-500/20 transition-all shadow-inner" />
              </div>

              <AttachmentInput uploadedFiles={uploadedFiles} onFilesChange={setUploadedFiles} />

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-surface-secondary transition-colors border border-transparent hover:border-border-default">
                <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-border-default text-brand focus:ring-brand bg-surface-primary" />
                <span className="text-[13px] font-bold text-text-secondary">Pin this update to the top</span>
              </label>

              <div className="flex items-center gap-3 pt-4 border-t border-border-default">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl text-[14px] font-bold bg-surface-secondary text-text-secondary hover:bg-border-default transition-colors">
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={!title.trim() || !message.trim() || posting || anyUploading}
                  className="flex-1 py-3 rounded-xl text-[14px] font-bold bg-brand hover:bg-brand-600 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md">
                  {posting ? 'Posting...' : anyUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Send className="w-4 h-4" /> Share Update</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
