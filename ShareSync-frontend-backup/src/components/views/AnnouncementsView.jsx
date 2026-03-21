// src/components/views/AnnouncementsView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS — Facebook-style social feed for project updates
// Features: likes, comments, avatars, attachments, pin, moderation
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Megaphone, Plus, Pin, Trash2, Clock, Send, X,
  Loader2, RefreshCw, CheckCheck, AlertTriangle,
  Heart, MessageCircle, Paperclip, Image as ImageIcon,
  ChevronDown, ChevronUp, MoreHorizontal,
} from 'lucide-react';
import { toast } from '../ui/toast';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import {
  getAnnouncements, createAnnouncement,
  toggleAnnouncementPin, deleteAnnouncement, markAnnouncementAsRead,
  toggleLike, addComment, deleteComment,
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
  if (!author) return 'Team';
  if (author.firstName) return `${author.firstName} ${author.lastName || ''}`.trim();
  if (author.username) return author.username;
  return 'Team';
}

function getInitials(author) {
  const name = getAuthorName(author);
  if (!name || name === 'Team') return 'T';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarUrl(author) {
  return author?.avatar || author?.profilePicture || null;
}

const AVATAR_COLORS = [
  { bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-700 dark:text-violet-300' },
  { bg: 'bg-cyan-100 dark:bg-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-300' },
  { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-300' },
];

function getAvatarColor(name) {
  const idx = (name || '').charCodeAt(0) % AVATAR_COLORS.length || 0;
  return AVATAR_COLORS[idx];
}

function getId(item) {
  return item?._id || item?.id || '';
}

const TYPE_STYLES = {
  info:    { bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/20', dot: 'bg-violet-500' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-200 dark:border-amber-500/20',   dot: 'bg-amber-500' },
  success: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
  urgent:  { bg: 'bg-rose-50 dark:bg-rose-500/10',     border: 'border-rose-200 dark:border-rose-500/20',     dot: 'bg-rose-500' },
};

// ─── Avatar Component ───────────────────────────────────────────────────────

function Avatar({ author, size = 'md' }) {
  const url = getAvatarUrl(author);
  const name = getAuthorName(author);
  const color = getAvatarColor(name);
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-11 h-11 text-sm' };

  if (url) {
    return <img src={url} alt={name} className={`${sizes[size]} rounded-full object-cover flex-shrink-0`} />;
  }

  return (
    <div className={`${sizes[size]} rounded-full ${color.bg} flex items-center justify-center font-bold ${color.text} flex-shrink-0`}>
      {getInitials(author)}
    </div>
  );
}

// ─── Attachment Display ─────────────────────────────────────────────────────

function AttachmentGallery({ attachments }) {
  const urls = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  if (urls.length === 0) return null;

  return (
    <div className={`mt-3 ${urls.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
      {urls.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-slate-200 dark:border-white/[0.08] hover:opacity-90 transition-opacity">
          <img src={url} alt={`Attachment ${i + 1}`} className="w-full max-h-64 object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
        </a>
      ))}
    </div>
  );
}

// ─── Attachment Input (File Upload from Device) ─────────────────────────────

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

      onFilesChange((prev) => [
        ...prev,
        { file, preview, url: null, uploading: true, error: null },
      ]);

      // Upload immediately through moderation pipeline
      uploadFileToServer(file)
        .then((url) => {
          onFilesChange((prev) =>
            prev.map((a) =>
              a.preview === preview ? { ...a, url, uploading: false } : a
            )
          );
        })
        .catch((err) => {
          const errorMsg =
            err?.response?.data?.message || err?.message || 'Upload failed';
          onFilesChange((prev) =>
            prev.map((a) =>
              a.preview === preview
                ? { ...a, uploading: false, error: errorMsg }
                : a
            )
          );
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
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider flex items-center gap-1.5">
        <Paperclip className="w-3 h-3" /> Attachments
      </label>

      {/* Preview grid */}
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {uploadedFiles.map((a, i) => (
            <div
              key={a.preview}
              className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-white/[0.08] aspect-square bg-slate-50 dark:bg-white/[0.04]"
            >
              <img
                src={a.preview}
                alt={'Attachment ' + (i + 1)}
                className={`w-full h-full object-cover ${a.error ? 'opacity-30' : ''}`}
              />
              {a.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              {a.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20">
                  <span className="text-[9px] text-rose-600 dark:text-rose-400 font-medium px-1 text-center leading-tight">
                    Blocked
                  </span>
                </div>
              )}
              <button
                onClick={() => removeFile(a.preview)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-white/[0.12] text-xs font-medium text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-violet-300 dark:hover:border-violet-500/30 transition-all"
      >
        <ImageIcon className="w-4 h-4" />
        Add Photo
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

// ─── Comment Section ────────────────────────────────────────────────────────

function CommentSection({ item, projectId, currentUserId, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [posting, setPosting] = useState(false);
  const inputRef = useRef(null);

  const comments = Array.isArray(item.comments) ? item.comments : [];
  const commentCount = comments.length;

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const updated = await addComment(projectId, getId(item), {
        text: text.trim(),
        attachments: commentAttachments,
      });
      onUpdate(updated);
      setText('');
      setCommentAttachments([]);
      setExpanded(true);
    } catch (e) {
      toast({ title: e?.response?.data?.message || e?.message || 'Failed to post comment', variant: 'error' });
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      const updated = await deleteComment(projectId, getId(item), commentId);
      onUpdate(updated);
    } catch {
      toast({ title: 'Failed to delete comment', variant: 'error' });
    }
  };

  const visibleComments = expanded ? comments : comments.slice(-2);
  const hiddenCount = comments.length - visibleComments.length;

  return (
    <div className="border-t border-slate-100 dark:border-white/[0.06]">
      {/* Comment count toggle */}
      {commentCount > 2 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full px-5 py-2 text-xs text-slate-500 dark:text-white/40 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-left"
        >
          View all {commentCount} comments
        </button>
      )}

      {/* Comment list */}
      {visibleComments.length > 0 && (
        <div className="px-5 py-3 space-y-3">
          {visibleComments.map((c, i) => (
            <div key={c._id || i} className="flex items-start gap-2.5">
              <Avatar author={c.authorId} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="bg-slate-50 dark:bg-white/[0.04] rounded-xl px-3 py-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">
                    {getAuthorName(c.authorId)}
                  </span>
                  <p className="text-xs text-slate-600 dark:text-white/60 mt-0.5 leading-relaxed">
                    {c.text}
                  </p>
                  <AttachmentGallery attachments={c.attachments} />
                </div>
                <div className="flex items-center gap-3 mt-1 px-1">
                  <span className="text-[10px] text-slate-400 dark:text-white/30">{timeAgo(c.createdAt)}</span>
                  {String(c.authorId?._id || c.authorId) === currentUserId && (
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="text-[10px] text-slate-400 dark:text-white/30 hover:text-rose-500 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment input */}
      <div className="px-5 py-3 flex items-start gap-2.5">
        <Avatar author={{ _id: currentUserId }} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/[0.04] rounded-xl px-3 py-2 border border-transparent focus-within:border-violet-300 dark:focus-within:border-violet-500/30 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
              placeholder="Write a comment..."
              className="flex-1 bg-transparent text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none"
            />
            {posting ? (
              <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin flex-shrink-0" />
            ) : (
              <button
                onClick={handlePost}
                disabled={!text.trim()}
                className="p-1 rounded text-violet-500 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Announcement Card (Facebook-style) ─────────────────────────────────────

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
    } catch {
      toast({ title: 'Failed to like', variant: 'error' });
    } finally {
      setLiking(false);
    }
  };

  return (
    <article className={`rounded-xl border ${style.border} ${isPinned ? style.bg : 'bg-white dark:bg-[#1f1f23]'} overflow-hidden transition-all shadow-sm hover:shadow-md`}>
      {/* Pin banner */}
      {isPinned && (
        <div className="px-5 py-1.5 bg-amber-100/60 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/15 flex items-center gap-1.5">
          <Pin className="w-3 h-3 text-amber-600 dark:text-amber-400 fill-current" />
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pinned</span>
        </div>
      )}

      {/* Header: Avatar + Author + Time + Actions */}
      <div className="px-5 pt-4 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar author={item.authorId} size="md" />
            <div className="min-w-0">
              <span className="text-sm font-semibold text-slate-800 dark:text-white block leading-tight">
                {getAuthorName(item.authorId)}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-slate-400 dark:text-white/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(item.createdAt)}
                </span>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${style.dot}`} title={item.type} />
              </div>
            </div>
          </div>

          {/* Actions menu */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onPin(getId(item))}
              className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/15' : 'text-slate-400 dark:text-white/30 hover:bg-slate-100 dark:hover:bg-white/[0.06]'}`}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(getId(item))}
              className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Body: Title + Message */}
      <div className="px-5 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white leading-snug mb-1">
          {item.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed whitespace-pre-line">
          {item.message}
        </p>

        {/* Attachments */}
        <AttachmentGallery attachments={item.attachments} />
      </div>

      {/* Engagement Counts */}
      {(likeCount > 0 || commentCount > 0) && (
        <div className="px-5 py-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-white/40">
          <div className="flex items-center gap-1.5">
            {likeCount > 0 && (
              <>
                <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center">
                  <Heart className="w-2.5 h-2.5 text-white fill-white" />
                </span>
                <span>{likeCount}</span>
              </>
            )}
          </div>
          {commentCount > 0 && (
            <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="px-5 py-1 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-1">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${
            hasLiked
              ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'
              : 'text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
          }`}
        >
          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500' : ''}`} />
          <span>{hasLiked ? 'Liked' : 'Like'}</span>
        </button>

        <div className="w-px h-5 bg-slate-100 dark:bg-white/[0.06]" />

        <button
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
          onClick={() => {
            const el = document.querySelector(`[data-comment-input="${getId(item)}"]`);
            if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
          }}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>
      </div>

      {/* Comments */}
      <div data-comment-input={getId(item)}>
        <CommentSection
          item={item}
          projectId={projectId}
          currentUserId={currentUserId}
          onUpdate={onUpdate}
        />
      </div>

      {/* Read count */}
      {item.readBy?.length > 0 && (
        <div className="px-5 pb-3 flex items-center gap-1.5">
          <CheckCheck className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] text-slate-400 dark:text-white/30">Read by {item.readBy.length}</span>
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
  // ✅ NEW: File upload state instead of URL list
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [posting, setPosting] = useState(false);
  const mountedRef = useRef(true);

  const anyUploading = uploadedFiles.some((a) => a.uploading);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
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

    if (anyUploading) {
      toast({ title: 'Please wait for uploads to finish', variant: 'error' });
      return;
    }

    setPosting(true);
    try {
      // Collect successfully uploaded URLs
      const attachmentUrls = uploadedFiles
        .filter((a) => a.url && !a.error)
        .map((a) => a.url);

      const created = await createAnnouncement(projectId, {
        title: title.trim(),
        message: message.trim(),
        type,
        pinned,
        attachments: attachmentUrls,
      });
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
    try {
      await deleteAnnouncement(projectId, id);
      toast({ title: 'Announcement deleted', variant: 'default' });
    } catch { toast({ title: 'Failed to delete', variant: 'error' }); }
  };

  const handleUpdate = (updated) => {
    if (!updated) return;
    const uid = getId(updated);
    setAnnouncements(prev =>
      prev.map(a => getId(a) === uid ? updated : a)
    );
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
          <button onClick={load} disabled={loading} className="p-2 rounded-lg text-slate-400 dark:text-white/30 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm">
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
              key={getId(item)}
              item={item}
              projectId={projectId}
              currentUserId={currentUserId}
              onPin={handlePin}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Create Announcement Modal
      ═══════════════════════════════════════════════════════════════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} aria-label="Close" />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between sticky top-0 bg-white dark:bg-[#1f1f23] z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-violet-600 dark:text-violet-400" />
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                        type === t
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

              {/* ✅ NEW: File upload attachments (replaces URL paste) */}
              <AttachmentInput
                uploadedFiles={uploadedFiles}
                onFilesChange={setUploadedFiles}
              />

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
                <button onClick={handleCreate} disabled={!title.trim() || !message.trim() || posting || anyUploading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  {posting ? (
                    'Posting...'
                  ) : anyUploading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                  ) : (
                    <><Send className="w-3.5 h-3.5" /> Post Announcement</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
