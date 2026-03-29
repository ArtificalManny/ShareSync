// src/components/views/AnnouncementsView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS — Facebook-style social feed for project updates
// FIXED: High contrast typography, bulletproof data mapping (title/content), 
// instant identity injection, and resilient attachment parsing.
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
  // Ensure we check all common avatar key names
  return author?.avatar || author?.profilePicture || author?.avatarUrl || null;
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
  info:    { bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/20', dot: 'bg-violet-500', text: 'text-violet-700' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-200 dark:border-amber-500/20',   dot: 'bg-amber-500', text: 'text-amber-700' },
  success: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  urgent:  { bg: 'bg-rose-50 dark:bg-rose-500/10',     border: 'border-rose-200 dark:border-rose-500/20',     dot: 'bg-rose-500', text: 'text-rose-700' },
};

// ─── Avatar Component ───────────────────────────────────────────────────────

function Avatar({ author, size = 'md' }) {
  const url = getAvatarUrl(author);
  const name = getAuthorName(author);
  const color = getAvatarColor(name);
  const sizes = { sm: 'w-8 h-8 text-[10px]', md: 'w-10 h-10 text-xs', lg: 'w-12 h-12 text-sm' };

  if (url) {
    return <img src={url} alt={name} className={`${sizes[size]} rounded-full object-cover flex-shrink-0 border border-slate-200 shadow-sm`} />;
  }

  return (
    <div className={`${sizes[size]} rounded-full ${color.bg} border border-slate-200/50 flex items-center justify-center font-bold ${color.text} flex-shrink-0 shadow-sm`}>
      {getInitials(author)}
    </div>
  );
}

// ─── Attachment Display ─────────────────────────────────────────────────────

function AttachmentGallery({ attachments }) {
  // Resilient attachment parsing: handles arrays of strings OR arrays of objects
  const urls = Array.isArray(attachments) 
    ? attachments.map(a => typeof a === 'string' ? a : (a?.url || a?.fileUrl || null)).filter(Boolean) 
    : [];
    
  if (urls.length === 0) return null;

  return (
    <div className={`mt-4 ${urls.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
      {urls.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <img src={url} alt={`Attachment ${i + 1}`} className="w-full max-h-72 object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
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
            <div
              key={a.preview}
              className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square shadow-sm"
            >
              <img
                src={a.preview}
                alt={'Attachment ' + (i + 1)}
                className={`w-full h-full object-cover ${a.error ? 'opacity-30' : ''}`}
              />
              {a.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              {a.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20">
                  <span className="text-[10px] text-rose-700 font-bold px-2 py-1 bg-white/80 rounded-lg text-center leading-tight">
                    Blocked
                  </span>
                </div>
              )}
              <button
                onClick={() => removeFile(a.preview)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/60 flex items-center justify-center hover:bg-rose-500 transition-colors shadow-sm"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-violet-400 hover:text-violet-600 transition-all"
      >
        <ImageIcon className="w-5 h-5" />
        Upload Image
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

  return (
    <div className="border-t border-slate-100">
      {commentCount > 2 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-violet-600 hover:bg-slate-50 transition-colors text-left"
        >
          View all {commentCount} comments
        </button>
      )}

      {visibleComments.length > 0 && (
        <div className="px-6 py-4 space-y-4">
          {visibleComments.map((c, i) => (
            <div key={c._id || i} className="flex items-start gap-3">
              <Avatar author={c.authorId} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <span className="text-xs font-bold text-slate-900 block mb-0.5">
                    {getAuthorName(c.authorId)}
                  </span>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">
                    {c.text}
                  </p>
                  <AttachmentGallery attachments={c.attachments} />
                </div>
                <div className="flex items-center gap-3 mt-1.5 px-2">
                  <span className="text-[11px] font-medium text-slate-400">{timeAgo(c.createdAt)}</span>
                  {String(c.authorId?._id || c.authorId) === currentUserId && (
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors"
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

      <div className="px-6 py-4 flex items-start gap-3 bg-slate-50/50">
        <Avatar author={{ _id: currentUserId }} size="sm" />
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
              <button
                onClick={handlePost}
                disabled={!text.trim()}
                className="p-1.5 rounded-lg text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-0 disabled:hidden transition-all flex-shrink-0 shadow-sm"
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

  // Fallback accessors to guarantee data renders regardless of backend naming conventions
  const displayTitle = item.title || item.subject || item.name || 'Untitled Announcement';
  const displayMessage = item.message || item.content || item.text || item.description || '';

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
    <article className={`rounded-2xl border ${style.border} ${isPinned ? style.bg : 'bg-white'} overflow-hidden transition-all shadow-sm hover:shadow-md mb-6`}>
      {isPinned && (
        <div className="px-6 py-2 bg-amber-100/80 border-b border-amber-200 flex items-center gap-2">
          <Pin className="w-3.5 h-3.5 text-amber-700 fill-current" />
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-widest">Pinned</span>
        </div>
      )}

      <div className="px-6 pt-5 pb-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar author={item.authorId} size="md" />
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 block leading-tight">
                {getAuthorName(item.authorId)}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo(item.createdAt)}
                </span>
                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}>
                  {item.type || 'info'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => onPin(getId(item))}
              className={`p-2 rounded-xl transition-all ${isPinned ? 'text-amber-600 bg-amber-100 hover:bg-amber-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(getId(item))}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pt-3 pb-4">
        <h3 className="text-lg font-black tracking-tight text-slate-900 leading-snug mb-2">
          {displayTitle}
        </h3>
        <p className="text-base font-medium text-slate-700 leading-relaxed whitespace-pre-line">
          {displayMessage}
        </p>

        <AttachmentGallery attachments={item.attachments} />
      </div>

      {(likeCount > 0 || commentCount > 0) && (
        <div className="px-6 py-3 flex items-center justify-between text-xs font-bold text-slate-500 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {likeCount > 0 && (
              <>
                <span className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center shadow-sm">
                  <Heart className="w-3 h-3 text-white fill-white" />
                </span>
                <span className="text-slate-600">{likeCount}</span>
              </>
            )}
          </div>
          {commentCount > 0 && (
            <span className="text-slate-600">{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
          )}
        </div>
      )}

      <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            hasLiked
              ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
              : 'text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200'
          }`}
        >
          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500' : ''}`} />
          <span>{hasLiked ? 'Liked' : 'Like'}</span>
        </button>

        <div className="w-px h-6 bg-slate-200" />

        <button
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
          onClick={() => {
            const el = document.querySelector(`[data-comment-input="${getId(item)}"]`);
            if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.querySelector('input').focus(); }
          }}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>
      </div>

      <div data-comment-input={getId(item)}>
        <CommentSection
          item={item}
          projectId={projectId}
          currentUserId={currentUserId}
          onUpdate={onUpdate}
        />
      </div>

      {item.readBy?.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-2 bg-slate-50">
          <CheckCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold text-slate-500">Read by {item.readBy.length} members</span>
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

      // Instant Identity Injection: We manually apply the user data to the new card
      // so it shows your name and avatar instantly before the backend refresh catches up.
      const optimisticAnnouncement = {
        ...created,
        authorId: created.authorId || {
          _id: currentUserId,
          firstName: user?.firstName,
          lastName: user?.lastName,
          username: user?.username,
          avatar: user?.profilePicture || user?.avatarUrl || user?.avatar
        },
        title: created.title || title.trim(),
        message: created.message || created.content || message.trim(),
        attachments: created.attachments || attachmentUrls
      };

      setAnnouncements(prev => [optimisticAnnouncement, ...prev]);
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

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header - High Contrast */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-xl shadow-md">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Announcements</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Broadcast high-signal updates to your team</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={load} disabled={loading} className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50 transition-all border border-transparent hover:border-slate-200 shadow-sm">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5">
            <Plus className="w-5 h-5" />
            Post Update
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {loading && announcements.length === 0 ? (
          <div className="flex items-center gap-3 py-20 justify-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            <span className="text-base font-bold">Loading comms array...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-rose-200 shadow-sm">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
            <p className="text-base font-bold text-slate-800">{error}</p>
            <button onClick={load} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors">Try again</button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Megaphone className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-xl font-black text-slate-900 mb-2">No announcements yet</p>
            <p className="text-sm font-medium text-slate-500 mb-8 max-w-sm mx-auto">It's quiet here. Post your first high-signal update to align the team.</p>
            <button onClick={() => setShowCreate(true)} className="px-6 py-3 text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" /> Post First Announcement
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
          <button className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} aria-label="Close" />
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Megaphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Post Announcement</h2>
                  <p className="text-sm font-medium text-slate-500">Visible to all project members</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2.5 rounded-xl hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              {/* Type selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Type Category</label>
                <div className="flex gap-3 mt-3">
                  {['info', 'warning', 'success', 'urgent'].map(t => (
                    <button key={t} onClick={() => setType(t)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold capitalize transition-all border-2 ${
                        type === t
                          ? `${TYPE_STYLES[t].bg} ${TYPE_STYLES[t].border} ${TYPE_STYLES[t].text} shadow-sm`
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                      }`}>
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${TYPE_STYLES[t].dot} mr-2`} />
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                  Headline <span className="text-rose-500">*</span>
                </label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="The bottom line up front..." maxLength={200} autoFocus
                  className="mt-2 w-full px-4 py-3.5 rounded-xl text-lg font-black bg-slate-50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition-all" />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                  Details <span className="text-rose-500">*</span>
                </label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Expand on the context here..." rows={6} maxLength={5000}
                  className="mt-2 w-full px-4 py-3.5 rounded-xl text-base font-medium resize-none bg-slate-50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition-all" />
              </div>

              <AttachmentInput
                uploadedFiles={uploadedFiles}
                onFilesChange={setUploadedFiles}
              />

              <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                <span className="text-sm font-bold text-slate-700">Pin to top of feed</span>
              </label>
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-4">
              <button onClick={() => setShowCreate(false)}
                className="px-6 py-3 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={!title.trim() || !message.trim() || posting || anyUploading}
                className="px-8 py-3 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 flex items-center gap-2">
                {posting ? (
                  'Transmitting...'
                ) : anyUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Send className="w-4 h-4" /> Broadcast Update</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
