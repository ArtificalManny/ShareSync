// src/components/views/AnnouncementsView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS — Facebook-style social feed for project updates
// FIXED: Identity Hot-Swapping (Live AuthContext Avatar sync), 
// High-contrast Light Theme, Bulletproof Data Mapping
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Megaphone, Plus, Pin, PencilLine, Trash2, Clock, Send, X,
  Loader2, RefreshCw, CheckCheck, AlertTriangle,
  Heart, MessageCircle, Paperclip, Image as ImageIcon,
} from 'lucide-react';
import { toast } from '../ui/toast';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import {
  getAnnouncements, createAnnouncement, updateAnnouncement,
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

// ─── Identity Hot-Swap Helpers (Syncs with Navbar/Profile) ──────────────────

function getAvatarOverride() {
  try { return localStorage.getItem("ss.avatarOverride") || null; } catch { return null; }
}

function resolveAvatarUrl(u) {
  const override = getAvatarOverride();
  if (override) return override;
  return u?.avatarUrl || u?.profilePicture || u?.avatar || u?.photoUrl || u?.profile?.avatarUrl || u?.profile?.photoUrl || null;
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

const AVATAR_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
];

function getAvatarColor(name) {
  const idx = (name || '').charCodeAt(0) % AVATAR_COLORS.length || 0;
  return AVATAR_COLORS[idx];
}

function getId(item) {
  return item?._id || item?.id || '';
}

function unwrapAnnouncementPayload(payload) {
  return (
    payload?.data?.announcement ||
    payload?.announcement ||
    payload?.data?.data ||
    payload?.data ||
    payload?.item ||
    payload
  );
}

function getCurrentUserId(user) {
  return String(
    user?.userId ||
    user?._id ||
    user?.id ||
    user?.sub ||
    ''
  );
}

function getLikeId(like) {
  return String(
    like?._id ||
    like?.id ||
    like?.userId?._id ||
    like?.userId?.id ||
    like?.userId ||
    like?.user?._id ||
    like?.user?.id ||
    like?.authorId?._id ||
    like?.authorId ||
    like ||
    ''
  );
}

function getLikeValueForCurrentUser(user) {
  return (
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.sub ||
    user
  );
}

function normalizeAnnouncementLikeState(announcement, currentUser) {
  const currentUserId = getCurrentUserId(currentUser);

  const likesArray = Array.isArray(announcement?.likes)
    ? announcement.likes
    : Array.isArray(announcement?.likedBy)
      ? announcement.likedBy
      : [];

  const hasLiked = currentUserId
    ? likesArray.some((like) => getLikeId(like) === currentUserId)
    : false;

  const countFromLikesCount = Number(announcement?.likesCount);
  const countFromNumericLikes = Number(announcement?.likes);

  const likeCount = Number.isFinite(countFromLikesCount)
    ? countFromLikesCount
    : Number.isFinite(countFromNumericLikes)
      ? countFromNumericLikes
      : likesArray.length;

  return {
    ...announcement,
    likes: likesArray,
    likedBy: likesArray,
    _clientHasLiked: hasLiked,
    _clientLikeCount: Math.max(0, likeCount),
  };
}

function setLocalAnnouncementLike(announcement, currentUser, shouldLike) {
  const currentUserId = getCurrentUserId(currentUser);
  const likes = Array.isArray(announcement?.likes) ? announcement.likes : [];
  const alreadyLiked = currentUserId
    ? likes.some((like) => getLikeId(like) === currentUserId)
    : false;

  let nextLikes = likes;

  if (shouldLike && !alreadyLiked) {
    nextLikes = [...likes, getLikeValueForCurrentUser(currentUser)];
  }

  if (!shouldLike && alreadyLiked) {
    nextLikes = likes.filter((like) => getLikeId(like) !== currentUserId);
  }

  const currentCount =
    Number.isFinite(Number(announcement?._clientLikeCount))
      ? Number(announcement._clientLikeCount)
      : likes.length;

  const nextCount = shouldLike
    ? Math.max(currentCount, likes.length) + (alreadyLiked ? 0 : 1)
    : Math.max(0, currentCount - 1);

  return {
    ...announcement,
    likes: nextLikes,
    _clientHasLiked: shouldLike,
    _clientLikeCount: nextCount,
  };
}

// ─── Time Helper ────────────────────────────────────────────────────────────

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

function formatAnnouncementTimestamp(ts) {
  if (!ts) return 'Date unavailable';

  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const TYPE_STYLES = {
  info: {
    label: 'Info',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
    text: 'text-violet-700',
    accent: 'bg-violet-500',
    soft: 'bg-violet-50/80',
    ring: 'ring-violet-500/10',
    glow: 'shadow-violet-500/10',
    chip: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  warning: {
    label: 'Warning',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    accent: 'bg-amber-500',
    soft: 'bg-amber-50/80',
    ring: 'ring-amber-500/10',
    glow: 'shadow-amber-500/10',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  success: {
    label: 'Success',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    accent: 'bg-emerald-500',
    soft: 'bg-emerald-50/80',
    ring: 'ring-emerald-500/10',
    glow: 'shadow-emerald-500/10',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  urgent: {
    label: 'Urgent',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
    accent: 'bg-rose-500',
    soft: 'bg-rose-50/80',
    ring: 'ring-rose-500/10',
    glow: 'shadow-rose-500/10',
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};
// ─── Hot-Swapped Avatar Component ───────────────────────────────────────────

function Avatar({ author, size = 'md', currentUser = null }) {
  // HOT SWAP LOGIC: If this author is ME, ignore the server and use my live context
  const authorIdStr = String(author?._id || author?.id || author || '');
  const currentUserIdStr = String(currentUser?.userId || currentUser?._id || currentUser?.id || currentUser?.sub || '');
  
  const isMe = currentUserIdStr && authorIdStr === currentUserIdStr;
  const effectiveAuthor = isMe && currentUser ? currentUser : author;

  const url = isMe ? resolveAvatarUrl(currentUser) : resolveAvatarUrl(author);
  const name = getAuthorName(effectiveAuthor);
  const color = getAvatarColor(name);
  const sizes = { sm: 'w-8 h-8 text-[10px]', md: 'w-10 h-10 text-xs', lg: 'w-12 h-12 text-sm' };

  if (url) {
    return <img src={url} alt={name} className={`${sizes[size]} rounded-full object-cover flex-shrink-0 border border-slate-200 shadow-sm`} />;
  }

  return (
    <div className={`${sizes[size]} rounded-full ${color.bg} border border-slate-200/50 flex items-center justify-center font-bold ${color.text} flex-shrink-0 shadow-sm`}>
      {getInitials(effectiveAuthor)}
    </div>
  );
}

// ─── Attachment Components ──────────────────────────────────────────────────

function AttachmentGallery({ attachments }) {
  const urls = Array.isArray(attachments)
    ? attachments.map(a => typeof a === 'string' ? a : (a?.url || a?.fileUrl || null)).filter(Boolean)
    : [];

  if (urls.length === 0) return null;

  const isSingle = urls.length === 1;

  return (
    <div className={`mt-5 ${isSingle ? '' : 'grid grid-cols-2 gap-3'}`}>
      {urls.map((url, i) => (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="announcement-attachment-card group block rounded-2xl border border-slate-200 bg-white p-1 shadow-sm hover:shadow-xl hover:shadow-violet-500/10 transition-all overflow-hidden"
        >
          <img
            src={url}
            alt={`Announcement attachment ${i + 1}`}
            className={`w-full rounded-[1rem] object-cover transition-transform duration-500 group-hover:scale-[1.015] ${
              isSingle ? 'max-h-[420px]' : 'aspect-[4/3]'
            }`}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </a>
      ))}
    </div>
  );
}

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
    <div className="space-y-2 mt-4">
      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
        <Paperclip className="w-4 h-4 text-slate-500" /> Attachments
      </label>

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {uploadedFiles.map((a, i) => (
            <div key={a.preview} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square shadow-sm">
              <img src={a.preview} alt={'Attachment'} className={`w-full h-full object-cover ${a.error ? 'opacity-30' : ''}`} />
              {a.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              {a.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20">
                  <span className="text-[10px] text-rose-700 font-bold px-2 py-1 bg-white/80 rounded-lg text-center leading-tight">Blocked</span>
                </div>
              )}
              <button onClick={() => removeFile(a.preview)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/60 flex items-center justify-center hover:bg-rose-500 transition-colors shadow-sm">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-violet-400 hover:text-violet-600 transition-all">
        <ImageIcon className="w-5 h-5" />
        Upload Image
      </button>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
    </div>
  );
}

// ─── Comment Section ────────────────────────────────────────────────────────

function CommentSection({ item, projectId, currentUser, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const inputRef = useRef(null);
  
  const currentUserId = getCurrentUserId(currentUser);

  const comments = Array.isArray(item.comments) ? item.comments : [];
  const commentCount = comments.length;

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const cleanText = text.trim();
      const updated = await addComment(projectId, getId(item), {
        text: cleanText,
        content: cleanText,
        message: cleanText,
        attachments: [],
      });
      onUpdate(updated);
      setText('');
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

  return (
    <div className="border-t border-slate-100">
      {commentCount > 2 && !expanded && (
        <button onClick={() => setExpanded(true)} className="w-full px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-violet-600 hover:bg-slate-50 transition-colors text-left">
          View all {commentCount} comments
        </button>
      )}

      {visibleComments.length > 0 && (
        <div className="px-6 py-4 space-y-4">
          {visibleComments.map((c, i) => {
            const authorIdStr = String(c.authorId?._id || c.authorId || '');
            const isMe = authorIdStr === currentUserId;
            const authorName = getAuthorName(isMe ? currentUser : c.authorId);

            return (
              <div key={c._id || i} className="flex items-start gap-3">
                <Avatar author={c.authorId} size="sm" currentUser={currentUser} />
                <div className="flex-1 min-w-0">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                    <span className="text-xs font-bold text-slate-900 block mb-0.5">{authorName}</span>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{c.text}</p>
                    <AttachmentGallery attachments={c.attachments} />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 px-2">
                    <span className="text-[11px] font-medium text-slate-400">{timeAgo(c.createdAt)}</span>
                    {isMe && (
                      <button onClick={() => handleDelete(c._id)} className="text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-6 py-4 flex items-start gap-3 bg-slate-50/50">
        <Avatar author={currentUser} size="sm" currentUser={currentUser} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-slate-200 shadow-sm focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
              placeholder="Write a comment..."
              className="flex-1 bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {posting ? (
              <Loader2 className="w-4 h-4 text-violet-500 animate-spin flex-shrink-0" />
            ) : (
              <button onClick={handlePost} disabled={!text.trim()} className="p-1.5 rounded-lg text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-0 disabled:hidden transition-all flex-shrink-0 shadow-sm">
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Announcement Card ──────────────────────────────────────────────────────

function AnnouncementCard({ item, projectId, currentUser, onPin, onDelete, onEdit, onUpdate }) {
  const rawType = String(item.type || 'info').toLowerCase();
  const style = TYPE_STYLES[rawType] || TYPE_STYLES.info;
  const isPinned = item.pinned;
  const isUrgent = rawType === 'urgent';
  const [liking, setLiking] = useState(false);

  const currentUserId = String(currentUser?.userId || currentUser?._id || currentUser?.id || currentUser?.sub || '');
  const authorIdStr = String(item.authorId?._id || item.authorId || '');
  const isMe = currentUserId && authorIdStr === currentUserId;
  const authorName = getAuthorName(isMe ? currentUser : item.authorId);

  const displayTitle = item.title || item.subject || item.name || 'Untitled Announcement';
  const displayMessage = item.message || item.content || item.text || item.description || '';

  const likes = Array.isArray(item.likes)
    ? item.likes
    : Array.isArray(item.likedBy)
      ? item.likedBy
      : [];
  const serverHasLiked = likes.some((like) => getLikeId(like) === currentUserId);
  const hasLiked =
    typeof item._clientHasLiked === 'boolean'
      ? item._clientHasLiked
      : serverHasLiked;

  const likeCount =
    Number.isFinite(Number(item._clientLikeCount))
      ? Number(item._clientLikeCount)
      : Number.isFinite(Number(item.likesCount))
        ? Number(item.likesCount)
        : Number.isFinite(Number(item.likes))
          ? Number(item.likes)
          : likes.length;
  const commentCount = Array.isArray(item.comments) ? item.comments.length : 0;
  const engagementCount = likeCount + commentCount;

  const handleLike = async () => {
    if (liking) return;

    const announcementId = getId(item);
    if (!announcementId) {
      toast({ title: 'Could not find announcement ID', variant: 'error' });
      return;
    }

    if (!currentUserId) {
      toast({ title: 'Please sign in to like announcements', variant: 'error' });
      return;
    }

    const previous = item;
    const nextLiked = !hasLiked;
    const optimistic = setLocalAnnouncementLike(item, currentUser, nextLiked);

    setLiking(true);
    onUpdate(optimistic);

    try {
      const response = await toggleLike(projectId, announcementId);
      const updated = unwrapAnnouncementPayload(response);

      if (updated && getId(updated)) {
        const serverLikes = Array.isArray(updated.likes) ? updated.likes : [];

        onUpdate({
          ...updated,

          // Keep the visual state aligned with the user's click.
          // The backend response may return a stale likes array or a user-id shape
          // that does not match the frontend's currentUserId check.
          likes: nextLiked
            ? serverLikes
            : serverLikes.filter((like) => getLikeId(like) !== currentUserId),

          _clientHasLiked: nextLiked,
          _clientLikeCount: optimistic._clientLikeCount,
        });
      }
    } catch (error) {
      onUpdate(previous);
      toast({
        title: error?.response?.data?.message || error?.message || 'Failed to update like',
        variant: 'error',
      });
    } finally {
      setLiking(false);
    }
  };

  return (
    <article
      className={`announcement-card group relative mb-6 overflow-hidden rounded-[2rem] border bg-white transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:shadow-2xl ${
        isPinned
          ? 'border-amber-200 shadow-amber-500/10'
          : isUrgent
            ? 'border-rose-200 shadow-rose-500/10'
            : 'border-slate-200 hover:shadow-violet-500/10'
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${style.accent}`} />
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {isPinned && (
        <div className="relative flex items-center justify-between gap-3 border-b border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50 to-white px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-sm">
              <Pin className="h-3.5 w-3.5 fill-current" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-800">
              Pinned Broadcast
            </span>
          </div>
          <span className="hidden text-[11px] font-bold text-amber-700/80 sm:inline">
            Stays visible at the top of the feed
          </span>
        </div>
      )}

      <div className="relative px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <Avatar author={item.authorId} size="lg" currentUser={currentUser} />

            <div className="min-w-0 flex-1">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="relative inline-flex max-w-full pb-1">
                    <span className="truncate bg-gradient-to-r from-slate-950 via-violet-800 to-slate-700 bg-clip-text text-xl font-black leading-none tracking-[-0.035em] text-transparent dark:from-white dark:via-violet-100 dark:to-cyan-100">
                      {authorName}
                    </span>
                    <span className="absolute bottom-0 left-0 h-[3px] w-12 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 shadow-sm shadow-violet-500/30" />
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {isMe && (
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 ring-1 ring-violet-200/80 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-400/20">
                      You
                    </span>
                  )}

                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${style.chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {style.label}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Posted {formatAnnouncementTimestamp(item.createdAt)}
                </span>

                {engagementCount > 0 && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>{engagementCount} signal{engagementCount === 1 ? '' : 's'}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1.5">
            <button
              onClick={() => onPin(getId(item))}
              className={`rounded-xl p-2.5 transition-all ${
                isPinned
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="h-4 w-4" />
            </button>

              <button
                onClick={() => onEdit(item)}
                className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-violet-50 hover:text-violet-700"
                title="Edit announcement"
              >
                <PencilLine className="h-4 w-4" />
              </button>

            <button
              onClick={() => onDelete(getId(item))}
              className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative mt-7 overflow-visible pl-5 sm:pl-7">
          <span
            className={`absolute left-0 top-1 h-[calc(Available-0.25rem)] w-1 rounded-full ${style.accent} shadow-[0_0_28px_rgba(124,58,237,0.34)]`}
          />

          <div className="pointer-events-none absolute -left-8 top-0 h-24 w-24 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-4 h-20 w-20 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${style.chip}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                Broadcast
              </span>

              {isPinned && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                  Pinned
                </span>
              )}
            </div>

            <h3 className="max-w-4xl text-2xl font-black leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-3xl">
              {displayTitle}
            </h3>

            <div className="mt-4 h-px w-full max-w-3xl bg-gradient-to-r from-violet-300 via-cyan-200 to-transparent" />

            <p className="mt-5 whitespace-pre-line text-[16px] font-medium leading-8 text-slate-700">
              {displayMessage}
            </p>

            <AttachmentGallery attachments={item.attachments} />
          </div>
        </div>
      </div>

      {(likeCount > 0 || commentCount > 0) && (
        <div className="mx-6 flex items-center justify-between border-t border-slate-100 py-3 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2">
            {likeCount > 0 && (
              <>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 shadow-sm">
                  <Heart className="h-3.5 w-3.5 fill-white text-white" />
                </span>
                <span className="text-slate-700">{likeCount}</span>
              </>
            )}
          </div>

          {commentCount > 0 && (
            <span className="text-slate-700">
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-black transition-all ${
            hasLiked
              ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950 hover:shadow-sm'
          }`}
        >
          <Heart className={`h-4 w-4 ${hasLiked ? 'fill-rose-500' : ''}`} />
          <span>{hasLiked ? 'Liked' : 'Like'}</span>
        </button>

        <div className="h-7 w-px bg-slate-200" />

        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-transparent py-3 text-sm font-black text-slate-600 transition-all hover:border-slate-200 hover:bg-white hover:text-slate-950 hover:shadow-sm"
          onClick={() => {
            const el = document.querySelector(`[data-comment-input="${getId(item)}"]`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.querySelector('input')?.focus();
            }
          }}
        >
          <MessageCircle className="h-4 w-4" />
          <span>Comment</span>
        </button>
      </div>

      <div data-comment-input={getId(item)}>
        <CommentSection item={item} projectId={projectId} currentUser={currentUser} onUpdate={onUpdate} />
      </div>
    </article>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AnnouncementsView({ projectId }) {
  const { user } = useAuth();
  
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [pinned, setPinned] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [posting, setPosting] = useState(false);
  const mountedRef = useRef(true);

  const anyUploading = uploadedFiles.some((a) => a.uploading);
  const resetAnnouncementForm = () => {
    setTitle('');
    setMessage('');
    setType('info');
    setPinned(false);
    setUploadedFiles([]);
  };

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    resetAnnouncementForm();
    setShowCreate(true);
  };

  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement?.title || announcement?.subject || announcement?.name || '');
    setMessage(
      announcement?.message ||
      announcement?.content ||
      announcement?.text ||
      announcement?.description ||
      ''
    );
    setType(String(announcement?.type || 'info').toLowerCase());
    setPinned(Boolean(announcement?.pinned));
    setUploadedFiles([]);
    setShowCreate(true);
  };

  const closeAnnouncementModal = () => {
    setShowCreate(false);
    setEditingAnnouncement(null);
    resetAnnouncementForm();
  };


  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAnnouncements(projectId);
      if (mountedRef.current) {
        const safeData = Array.isArray(data) ? data : [];
        setAnnouncements(
          safeData.map((announcement) =>
            normalizeAnnouncementLikeState(announcement, user)
          )
        );
      }
    } catch (e) {
      if (mountedRef.current) setError(e?.message || 'Failed to load');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => { mountedRef.current = true; load(); return () => { mountedRef.current = false; }; }, [load]);

  const handleCreate = async () => {
    if (!title.trim() || !message.trim() || posting) return;

    if (!editingAnnouncement && anyUploading) {
      toast({ title: 'Please wait for uploads to finish', variant: 'error' });
      return;
    }

    setPosting(true);

    try {
      if (editingAnnouncement) {
        const announcementId = getId(editingAnnouncement);

        if (!announcementId) {
          toast({ title: 'Could not find announcement ID', variant: 'error' });
          return;
        }

        const response = await updateAnnouncement(projectId, announcementId, {
          title: title.trim(),
          message: message.trim(),
          type,
          pinned,
        });

        const updated = unwrapAnnouncementPayload(response);

        setAnnouncements((prev) =>
          prev.map((announcement) =>
            getId(announcement) === announcementId
              ? normalizeAnnouncementLikeState(
                  {
                    ...announcement,
                    ...updated,
                    title: updated?.title || title.trim(),
                    message:
                      updated?.message ||
                      updated?.content ||
                      updated?.text ||
                      message.trim(),
                    type: updated?.type || type,
                    pinned:
                      typeof updated?.pinned === 'boolean'
                        ? updated.pinned
                        : pinned,
                  },
                  user
                )
              : announcement
          )
        );

        closeAnnouncementModal();
        toast({ title: 'Announcement updated!', variant: 'success' });
        return;
      }

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

      const optimisticAnnouncement = {
        ...created,
        authorId: user,
        title: created.title || title.trim(),
        message: created.message || created.content || message.trim(),
        attachments: created.attachments || attachmentUrls,
      };

      setAnnouncements((prev) => [
        normalizeAnnouncementLikeState(optimisticAnnouncement, user),
        ...prev,
      ]);

      closeAnnouncementModal();
      toast({ title: 'Announcement posted!', variant: 'success' });
    } catch (e) {
      toast({
        title:
          e?.response?.data?.message ||
          e?.message ||
          (editingAnnouncement ? 'Failed to update announcement' : 'Failed to post'),
        variant: 'error',
      });
    } finally {
      setPosting(false);
    }
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

  const handleUpdate = (payload) => {
    const updated = unwrapAnnouncementPayload(payload);
    if (!updated) return;

    const uid = getId(updated);
    if (!uid) {
      load();
      return;
    }

    setAnnouncements((prev) =>
      prev.map((announcement) =>
        getId(announcement) === uid
          ? normalizeAnnouncementLikeState({ ...announcement, ...updated }, user)
          : announcement
      )
    );
  };

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <style>
        {`
          .announcements-hero-panel {
            background:
              radial-gradient(circle at 8% 14%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 92% 8%, rgba(34, 211, 238, 0.16), transparent 32%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.82)) !important;
            border-color: rgba(124, 58, 237, 0.20) !important;
            box-shadow:
              0 28px 90px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .announcements-hero-panel {
            background:
              radial-gradient(circle at 8% 14%, rgba(139, 92, 246, 0.22), transparent 34%),
              radial-gradient(circle at 92% 8%, rgba(34, 211, 238, 0.13), transparent 32%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.90)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 34px 110px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .announcements-primary-button {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
            box-shadow:
              0 18px 44px rgba(109, 40, 217, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
            border: 1px solid rgba(196, 181, 253, 0.70) !important;
          }

          .announcements-primary-button:hover {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
            box-shadow:
              0 24px 58px rgba(109, 40, 217, 0.46),
              inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
          }

          .announcement-card {
            background:
              radial-gradient(circle at 5% 0%, rgba(139, 92, 246, 0.10), transparent 32%),
              radial-gradient(circle at 96% 6%, rgba(34, 211, 238, 0.08), transparent 30%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92)) !important;
            border-color: rgba(148, 163, 184, 0.34) !important;
            box-shadow:
              0 22px 70px rgba(15, 23, 42, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
          }

          .announcement-card:hover {
            border-color: rgba(124, 58, 237, 0.32) !important;
            box-shadow:
              0 32px 90px rgba(124, 58, 237, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .announcement-card {
            background:
              radial-gradient(circle at 5% 0%, rgba(139, 92, 246, 0.16), transparent 32%),
              radial-gradient(circle at 96% 6%, rgba(34, 211, 238, 0.10), transparent 30%),
              linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.82)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 28px 90px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
          }

          .announcement-message-panel {
            background:
              linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(248, 250, 252, 0.70)) !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.70),
              0 14px 34px rgba(15, 23, 42, 0.06) !important;
          }

          .dark .announcement-message-panel {
            background:
              linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(30, 41, 59, 0.54)) !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.07),
              0 18px 44px rgba(0, 0, 0, 0.30) !important;
          }

          .announcement-attachment-card {
            background:
              linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.86)) !important;
            border-color: rgba(148, 163, 184, 0.36) !important;
            box-shadow:
              0 18px 46px rgba(15, 23, 42, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.70) !important;
          }

          .announcement-attachment-card:hover {
            border-color: rgba(124, 58, 237, 0.32) !important;
            box-shadow:
              0 28px 70px rgba(124, 58, 237, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .announcement-create-modal {
            background:
              radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.10), transparent 34%),
              radial-gradient(circle at 92% 0%, rgba(34, 211, 238, 0.08), transparent 32%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)) !important;
            border-color: rgba(124, 58, 237, 0.18) !important;
            box-shadow:
              0 34px 110px rgba(15, 23, 42, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .announcement-create-modal {
            background:
              radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.16), transparent 34%),
              radial-gradient(circle at 92% 0%, rgba(34, 211, 238, 0.10), transparent 32%),
              linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 38px 120px rgba(0, 0, 0, 0.48),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .announcements-broadcast-hero {
            isolation: isolate;
            transform: translateZ(0);
          }

          .announcements-broadcast-hero::before {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 5px;
            z-index: 2;
            background: linear-gradient(90deg, #8b5cf6 0%, #22d3ee 45%, #10b981 72%, #f59e0b 100%);
            box-shadow:
              0 0 32px rgba(34, 211, 238, 0.42),
              0 0 48px rgba(139, 92, 246, 0.28);
          }

          .announcements-broadcast-hero::after {
            content: "";
            position: absolute;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            background-image:
              linear-gradient(rgba(148, 163, 184, 0.085) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.085) 1px, transparent 1px),
              radial-gradient(circle at 76% 38%, rgba(245, 158, 11, 0.12), transparent 28%);
            background-size: 34px 34px, 34px 34px, auto;
            mask-image: linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%);
            opacity: 0.82;
          }

          .dark .announcements-broadcast-hero::after {
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.055) 1px, transparent 1px),
              radial-gradient(circle at 76% 38%, rgba(245, 158, 11, 0.10), transparent 28%);
            opacity: 0.70;
          }

          .announcements-hero-orbit {
            z-index: 1;
          }

          .announcements-hero-icon {
            position: relative;
            background:
              radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.35), transparent 24%),
              conic-gradient(from 210deg, #0f172a, #7c3aed, #22d3ee, #10b981, #0f172a) !important;
            border: 1px solid rgba(255, 255, 255, 0.52);
            box-shadow:
              0 18px 44px rgba(15, 23, 42, 0.20),
              0 0 42px rgba(124, 58, 237, 0.22),
              inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
          }

          .announcements-hero-icon::before {
            content: "";
            position: absolute;
            inset: -9px;
            border-radius: 1.55rem;
            border: 1px solid rgba(34, 211, 238, 0.24);
            box-shadow: 0 0 28px rgba(34, 211, 238, 0.20);
            animation: announcementPulse 2.9s ease-in-out infinite;
          }

          @keyframes announcementPulse {
            0%, 100% {
              opacity: 0.55;
              transform: scale(0.98);
            }
            50% {
              opacity: 1;
              transform: scale(1.04);
            }
          }

          .announcements-hero-pill {
            background:
              linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(237, 233, 254, 0.78)) !important;
            border-color: rgba(139, 92, 246, 0.28) !important;
            box-shadow:
              0 10px 28px rgba(124, 58, 237, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.86) !important;
          }

          .dark .announcements-hero-pill {
            background:
              linear-gradient(135deg, rgba(124, 58, 237, 0.20), rgba(15, 23, 42, 0.74)) !important;
            border-color: rgba(167, 139, 250, 0.28) !important;
            color: rgba(221, 214, 254, 0.98) !important;
            box-shadow:
              0 14px 34px rgba(0, 0, 0, 0.26),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .announcements-hero-title {
            font-size: clamp(2rem, 3.8vw, 3.6rem) !important;
            line-height: 0.95 !important;
            letter-spacing: -0.055em !important;
            background: linear-gradient(135deg, #0f172a 0%, #111827 34%, #7c3aed 72%, #0891b2 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent !important;
            text-shadow: 0 18px 46px rgba(15, 23, 42, 0.10);
          }

          .dark .announcements-hero-title {
            background: linear-gradient(135deg, #ffffff 0%, #ddd6fe 36%, #a78bfa 70%, #67e8f9 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent !important;
            text-shadow: 0 22px 58px rgba(0, 0, 0, 0.42);
          }

          .announcements-hero-copy {
            color: rgba(51, 65, 85, 0.86) !important;
          }

          .dark .announcements-hero-copy {
            color: rgba(226, 232, 240, 0.72) !important;
          }

          .announcements-stat-pill {
            background:
              linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.74)) !important;
            border-color: rgba(148, 163, 184, 0.28) !important;
            box-shadow:
              0 12px 30px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.82) !important;
            backdrop-filter: blur(14px);
          }

          .dark .announcements-stat-pill {
            background:
              linear-gradient(135deg, rgba(15, 23, 42, 0.68), rgba(30, 41, 59, 0.44)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            color: rgba(226, 232, 240, 0.84) !important;
            box-shadow:
              0 14px 34px rgba(0, 0, 0, 0.30),
              inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          }

          .announcements-refresh-button {
            background:
              linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.80)) !important;
            border-color: rgba(148, 163, 184, 0.30) !important;
            box-shadow:
              0 14px 34px rgba(15, 23, 42, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.82) !important;
          }

          .announcements-refresh-button:hover {
            transform: translateY(-1px);
            border-color: rgba(124, 58, 237, 0.34) !important;
            box-shadow:
              0 18px 42px rgba(124, 58, 237, 0.16),
              inset 0 1px 0 rgba(255, 255, 255, 0.86) !important;
          }

          .dark .announcements-refresh-button {
            background:
              linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(30, 41, 59, 0.52)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            color: rgba(226, 232, 240, 0.78) !important;
            box-shadow:
              0 16px 42px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          }

          .announcements-hero-cta {
            min-height: 3.35rem;
            padding-inline: 1.35rem !important;
            letter-spacing: 0.01em;
          }

        `}
      </style>
      <div className="announcements-broadcast-hero announcements-hero-panel relative overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-sm">
        <div className="announcements-hero-orbit pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(124,58,237,0.12),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(20,184,166,0.10),transparent_30%)]" />

        <div className="relative flex flex-col gap-5 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="announcements-hero-icon flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 shadow-xl shadow-slate-900/20">
              <Megaphone className="h-7 w-7 text-white" />
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="announcements-hero-pill rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">
                  Signal Board
                </span>

                {sorted.some((a) => a.pinned) && (
                  <span className="announcements-hero-pill rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                    Pinned active
                  </span>
                )}
              </div>

              <h2 className="announcements-hero-title text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Announcements
              </h2>

              <p className="announcements-hero-copy mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                Broadcast high-signal updates, decisions, warnings, and project-wide context your team should not miss.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="announcements-stat-pill rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                  {sorted.length} update{sorted.length === 1 ? '' : 's'}
                </span>

                <span className="announcements-stat-pill rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                  {sorted.filter((a) => a.pinned).length} pinned
                </span>

                <span className="announcements-stat-pill rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                  Team-visible
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:self-start">
            <button
              onClick={load}
              disabled={loading}
              className="announcements-refresh-button flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"
              title="Refresh announcements"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={openCreateModal}
              className="announcements-hero-cta announcements-primary-button relative isolate inline-flex items-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-violet-500/40"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.26)',
                }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl border border-violet-200/80"
              />
              <Plus className="relative z-10 h-5 w-5 text-white drop-shadow-sm" />
              <span className="relative z-10 text-white drop-shadow-sm">
                Post Update
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {loading && announcements.length === 0 ? (
          <div className="flex items-center gap-3 py-20 justify-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            <span className="text-base font-bold">Loading broadcast feed...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-rose-200 shadow-sm">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
            <p className="text-base font-bold text-slate-800">{error}</p>
            <button onClick={load} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors">Try again</button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><Megaphone className="w-10 h-10 text-slate-400" /></div>
            <p className="text-xl font-black text-slate-900 mb-2">No announcements yet</p>
            <p className="text-sm font-medium text-slate-500 mb-8 max-w-sm mx-auto">No broadcasts yet. Post the first high-signal update so the team knows what changed, what matters, and what happens next.</p>
            <button onClick={openCreateModal} className="px-6 py-3 text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" /> Post First Announcement
            </button>
          </div>
        ) : (
          sorted.map(item => (
            <AnnouncementCard key={getId(item)} item={item} projectId={projectId} currentUser={user} onPin={handlePin} onDelete={handleDelete} onUpdate={handleUpdate} 
                onEdit={openEditModal}/>
          ))
        )}
      </div>

      {showCreate && (
        <div className="pc-create-viewport fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
          <button
            type="button"
            className="pc-create-backdrop fixed inset-0 bg-black/5 backdrop-blur-[2px] pointer-events-auto"
            onClick={closeAnnouncementModal}
            aria-label="Close post announcement modal backdrop"
          />

          <div className="announcement-create-modal pc-create-modal pointer-events-auto relative w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(139,92,246,0.16)]">
            <div className="border-b border-slate-200/80 bg-white">
              <div className="flex items-center justify-between gap-5 px-8 py-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/25">
                    <Megaphone className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-700">
                      Team Broadcast
                    </p>
                    <h2 className="mt-1 text-2xl font-black leading-none tracking-tight text-slate-950">
                      {editingAnnouncement ? 'Save Changes' : 'Post Announcement'}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeAnnouncementModal}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  aria-label="Close post announcement modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto bg-white px-8 py-8">
              <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
                  Type Category
                </label>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {['info', 'warning', 'success', 'urgent'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-black capitalize transition-all ${
                        type === t
                          ? `${TYPE_STYLES[t].chip} shadow-sm ring-4 ${TYPE_STYLES[t].ring}`
                          : 'border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${TYPE_STYLES[t].dot}`} />
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
                  Headline <span className="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="The bottom line up front..."
                  maxLength={200}
                  autoFocus
                  className="mt-2 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-4 text-lg font-black text-slate-950 placeholder-slate-400 transition-all focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
                  Details <span className="text-rose-500">*</span>
                </label>

                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Expand on the context here..."
                  rows={6}
                  maxLength={5000}
                  className="mt-2 w-full resize-none rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium leading-7 text-slate-900 placeholder-slate-400 transition-all focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                />
              </div>

              <AttachmentInput uploadedFiles={uploadedFiles} onFilesChange={setUploadedFiles} />

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-amber-200 hover:bg-amber-50/60">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Pin className="h-4 w-4" />
                  </span>

                  <div>
                    <span className="block text-sm font-black text-slate-800">
                      Pin to top of feed
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Use this for decisions, warnings, or must-read updates.
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={e => setPinned(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-4 border-t border-slate-200 bg-slate-50 px-6 py-5">
              <button
                onClick={closeAnnouncementModal}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={handleCreate}
                disabled={!title.trim() || !message.trim() || posting || anyUploading}
                className="announcements-primary-button relative isolate flex items-center gap-2 overflow-hidden rounded-2xl px-8 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-100"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      title.trim() && message.trim() && !posting && !anyUploading
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)'
                        : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%)',
                    boxShadow:
                      title.trim() && message.trim() && !posting && !anyUploading
                        ? 'inset 0 1px 0 rgba(255, 255, 255, 0.26), 0 16px 36px rgba(109, 40, 217, 0.34)'
                        : 'inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 10px 24px rgba(109, 40, 217, 0.20)',
                  }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl border border-violet-200/80"
                />

                {posting ? (
                  <>
                    <Loader2 className="relative z-10 h-4 w-4 animate-spin text-white" />
                    <span className="relative z-10 text-white drop-shadow-sm">
                      Transmitting...
                    </span>
                  </>
                ) : anyUploading ? (
                  <>
                    <Loader2 className="relative z-10 h-4 w-4 animate-spin text-white" />
                    <span className="relative z-10 text-white drop-shadow-sm">
                      Uploading...
                    </span>
                  </>
                ) : (
                  <>
                    <Send className="relative z-10 h-4 w-4 text-white drop-shadow-sm" />
                    <span className="relative z-10 text-white drop-shadow-sm">
                      Broadcast Update
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
