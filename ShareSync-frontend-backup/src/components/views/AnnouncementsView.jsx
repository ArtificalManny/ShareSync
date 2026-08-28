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
  ExternalLink, FileText, Link2, Search,
  ListTodo, Target, Milestone,
} from 'lucide-react';
import { toast } from '../ui/toast';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import {
  getAnnouncements, createAnnouncement, updateAnnouncement,
  toggleAnnouncementPin, deleteAnnouncement, markAnnouncementAsRead,
  toggleLike, addComment, deleteComment, votePoll,
} from '../../api/announcements';
import {
  fetchProjectFilesForReference,
} from '../../api/taskApi';
import {
  listTasks,
} from '../../api/tasks';
import {
  getMilestones,
} from '../../api/milestones';

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

function normalizeAnnouncementAffectedReference(
  value,
  kind,
) {
  if (!value) return null;

  const source =
    typeof value === 'object'
      ? value
      : {};

  const id = String(
    typeof value === 'string'
      ? value
      : source?._id ||
          source?.id ||
          source?.taskId ||
          source?.milestoneId ||
          ''
  ).trim();

  if (!id) return null;

  const fallbackLabel =
    kind === 'move'
      ? 'Move'
      : 'Milestone';

  return {
    ...source,
    id,
    title:
      source?.title ||
      source?.name ||
      source?.label ||
      `${fallbackLabel} ${id.slice(-6)}`,
    status:
      source?.status ||
      source?.scheduleState ||
      '',
    priority:
      source?.priority ||
      '',
  };
}

function normalizeAnnouncementAffectedList(
  values,
  kind,
) {
  const unique = new Map();

  (
    Array.isArray(values)
      ? values
      : []
  )
    .map((value) =>
      normalizeAnnouncementAffectedReference(
        value,
        kind,
      )
    )
    .filter(Boolean)
    .forEach((item) => {
      if (!unique.has(item.id)) {
        unique.set(item.id, item);
      }
    });

  return Array.from(unique.values());
}

function formatAnnouncementWorkStatus(value) {
  const clean = String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ');

  if (!clean) return '';

  return clean.replace(
    /\b\w/g,
    (character) =>
      character.toUpperCase()
  );
}

function selectAnnouncementAffectedReferences(
  options,
  selectedIds,
  kind,
) {
  const selected = new Set(
    (
      Array.isArray(selectedIds)
        ? selectedIds
        : []
    ).map(String)
  );

  return normalizeAnnouncementAffectedList(
    options,
    kind,
  ).filter((item) =>
    selected.has(item.id)
  );
}

function resolveAnnouncementAffectedReferences(
  responseValues,
  options,
  selectedIds,
  kind,
) {
  const selected =
    selectAnnouncementAffectedReferences(
      options,
      selectedIds,
      kind,
    );

  const selectedById = new Map(
    selected.map((item) => [
      item.id,
      item,
    ])
  );

  const rawValues =
    Array.isArray(responseValues)
      ? responseValues
      : [];

  const rawById = new Map(
    rawValues
      .map((value) => {
        const normalized =
          normalizeAnnouncementAffectedReference(
            value,
            kind,
          );

        return normalized
          ? [normalized.id, value]
          : null;
      })
      .filter(Boolean)
  );

  const normalizedResponse =
    normalizeAnnouncementAffectedList(
      rawValues,
      kind,
    );

  if (normalizedResponse.length === 0) {
    return selected;
  }

  return normalizedResponse.map((item) => {
    const selectedItem =
      selectedById.get(item.id);

    const rawValue =
      rawById.get(item.id);

    const hasExplicitTitle = Boolean(
      rawValue &&
        typeof rawValue === 'object' &&
        String(
          rawValue?.title ||
            rawValue?.name ||
            rawValue?.label ||
            ''
        ).trim()
    );

    if (
      !selectedItem ||
      hasExplicitTitle
    ) {
      return item;
    }

    return {
      ...item,
      title: selectedItem.title,
      status:
        item.status ||
        selectedItem.status,
      priority:
        item.priority ||
        selectedItem.priority,
    };
  });
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

function createPollOptionState(text = '') {
  return { text };
}

function getPollVoteId(vote) {
  return String(
    vote?._id ||
    vote?.id ||
    vote?.userId?._id ||
    vote?.userId?.id ||
    vote?.userId ||
    vote?.user?._id ||
    vote?.user?.id ||
    vote ||
    ''
  );
}

function getPollOptionVotes(option) {
  return Array.isArray(option?.votes) ? option.votes : [];
}

function normalizePollForSubmit(enabled, question, options) {
  if (!enabled) return null;

  const cleanQuestion = String(question || '').trim();
  const cleanOptions = (Array.isArray(options) ? options : [])
    .map((option) => ({
      text: String(option?.text || option || '').trim(),
    }))
    .filter((option) => option.text)
    .slice(0, 5);

  if (!cleanQuestion || cleanOptions.length < 2) return null;

  return {
    question: cleanQuestion,
    options: cleanOptions,
    closed: false,
  };
}

function makeRenderablePoll(poll) {
  if (!poll?.question || !Array.isArray(poll?.options) || poll.options.length < 2) {
    return null;
  }

  return {
    question: poll.question,
    closed: Boolean(poll.closed),
    createdAt: poll.createdAt || new Date().toISOString(),
    options: poll.options.map((option, index) => ({
      id: option.id || `option-${index + 1}`,
      text: option.text,
      votes: Array.isArray(option.votes) ? option.votes : [],
    })),
  };
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
    poll: announcement?.poll || null,
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


const ANNOUNCEMENT_ALLOWED_TAGS = new Set(['P','BR','STRONG','B','EM','I','U','SPAN','DIV','UL','OL','LI']);
const ANNOUNCEMENT_BLOCKED_TAGS = ['script','style','iframe','object','embed','link','meta','form','input','button','textarea','select','option'];
const ANNOUNCEMENT_FONT_SIZE_MAP = { 1:'12px', 2:'14px', 3:'16px', 4:'18px', 5:'20px', 6:'24px', 7:'32px' };

function isSafeAnnouncementColor(value) {
  const color = String(value || '').trim();
  return /^#[0-9a-f]{3,8}$/i.test(color) || /^(rgb|rgba|hsl|hsla)\([0-9%.,\s]+\)$/i.test(color) || /^(black|white|gray|grey|slate|red|orange|amber|yellow|green|emerald|teal|cyan|blue|indigo|violet|purple|pink|rose)$/i.test(color);
}

function isSafeAnnouncementFontFamily(value) {
  const family = String(value || '').trim();
  return !!family && family.length <= 80 && !/url|expression|javascript|data:/i.test(family) && /^[a-z0-9\s"',-]+$/i.test(family);
}

function isSafeAnnouncementFontSize(value) {
  return /^(12|13|14|15|16|18|20|24|28|32)px$/i.test(String(value || '').trim());
}

function isSafeAnnouncementLineHeight(value) {
  return /^(1|1\.15|1\.3|1\.5|1\.75|2)$/.test(String(value || '').trim());
}

function sanitizeAnnouncementStyle(style) {
  const safe = [];
  if (isSafeAnnouncementColor(style.color)) safe.push(`color: ${style.color}`);
  if (isSafeAnnouncementFontFamily(style.fontFamily)) safe.push(`font-family: ${style.fontFamily}`);
  if (isSafeAnnouncementFontSize(style.fontSize)) safe.push(`font-size: ${style.fontSize}`);
  if (isSafeAnnouncementLineHeight(style.lineHeight)) safe.push(`line-height: ${style.lineHeight}`);
  return safe.join('; ');
}

function sanitizeAnnouncementHtml(html = '') {
  const raw = String(html || '');
  if (!raw.trim()) return '';

  if (typeof DOMParser === 'undefined' || typeof document === 'undefined') {
    return raw.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '').replace(/\son\w+='[^']*'/gi, '').replace(/javascript:/gi, '');
  }

  const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, 'text/html');
  const root = doc.body.firstElementChild || doc.body;

  root.querySelectorAll(ANNOUNCEMENT_BLOCKED_TAGS.join(',')).forEach((node) => node.remove());

  root.querySelectorAll('font').forEach((font) => {
    const span = doc.createElement('span');
    const face = font.getAttribute('face');
    const color = font.getAttribute('color');
    const size = ANNOUNCEMENT_FONT_SIZE_MAP[font.getAttribute('size')];
    if (isSafeAnnouncementFontFamily(face)) span.style.fontFamily = face;
    if (isSafeAnnouncementColor(color)) span.style.color = color;
    if (isSafeAnnouncementFontSize(size)) span.style.fontSize = size;
    while (font.firstChild) span.appendChild(font.firstChild);
    font.replaceWith(span);
  });

  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 8) return child.remove();
      if (child.nodeType === 3) return;
      if (child.nodeType !== 1) return child.remove();

      walk(child);

      if (!ANNOUNCEMENT_ALLOWED_TAGS.has(child.tagName.toUpperCase())) {
        while (child.firstChild) child.parentNode.insertBefore(child.firstChild, child);
        child.remove();
        return;
      }

      const safeStyle = sanitizeAnnouncementStyle(child.style);
      Array.from(child.attributes).forEach((attr) => child.removeAttribute(attr.name));
      if (safeStyle) child.setAttribute('style', safeStyle);
    });
  };

  walk(root);
  return root.innerHTML.trim();
}

function escapeAnnouncementHtml(text = '') {
  const div = document.createElement('div');
  div.textContent = String(text || '');
  return div.innerHTML;
}

function announcementTextToHtml(text = '') {
  const raw = String(text || '');
  if (!raw.trim()) return '';
  if (typeof document === 'undefined') return raw;
  return sanitizeAnnouncementHtml(
    raw.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${escapeAnnouncementHtml(p).replace(/\n/g, '<br />')}</p>`).join('')
  );
}

function getAnnouncementBodyHtml(announcement) {
  const raw = announcement?.message || announcement?.content || announcement?.text || announcement?.description || '';
  const body = String(raw || '');
  if (!body.trim()) return '';
  return /<\/?[a-z][\s\S]*>/i.test(body) ? sanitizeAnnouncementHtml(body) : announcementTextToHtml(body);
}

function getAnnouncementPlainText(html = '') {
  const safe = sanitizeAnnouncementHtml(html);
  if (typeof document === 'undefined') return safe.replace(/<[^>]*>/g, ' ');
  const div = document.createElement('div');
  div.innerHTML = safe;
  return div.textContent || div.innerText || '';
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


function normalizeAnnouncementFileReference(file) {
  const fileId = String(
    file?.fileId ||
    file?._id ||
    file?.id ||
    ''
  ).trim();

  const fileName = String(
    file?.fileName ||
    file?.name ||
    file?.originalName ||
    'Project file'
  ).trim();

  const fileUrl = String(
    file?.fileUrl ||
    file?.url ||
    ''
  ).trim();

  const fileType = String(
    file?.fileType ||
    file?.mimeType ||
    file?.extension ||
    ''
  ).trim();

  const rawFileSize = Number(
    file?.fileSize ??
    file?.size ??
    file?.sizeInBytes ??
    0
  );

  const fileSize =
    Number.isFinite(rawFileSize) &&
    rawFileSize >= 0
      ? rawFileSize
      : 0;

  if (!fileId || !fileName || !fileUrl) {
    return null;
  }

  return {
    fileId,
    fileName,
    fileUrl,
    fileType,
    fileSize,
    source: 'project_file',
    linkedAt:
      file?.linkedAt ||
      null,
  };
}

function normalizeAnnouncementFileReferenceList(files) {
  const seen = new Set();

  return (Array.isArray(files) ? files : [])
    .map(normalizeAnnouncementFileReference)
    .filter((file) => {
      if (!file || seen.has(file.fileId)) {
        return false;
      }

      seen.add(file.fileId);
      return true;
    });
}

function formatAnnouncementFileSize(bytes) {
  const size = Number(bytes || 0);

  if (!Number.isFinite(size) || size <= 0) {
    return 'Project file';
  }

  if (size < 1024) {
    return `${Math.round(size)} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function resolveAnnouncementFileUrl(value) {
  const raw = String(value || '').trim();

  if (!raw) return '';

  if (
    /^(https?:|blob:|data:)/i.test(raw)
  ) {
    return raw;
  }

  const apiBase = String(
    client?.defaults?.baseURL || ''
  ).trim();

  if (!apiBase) {
    return raw;
  }

  try {
    return new URL(
      raw,
      apiBase.endsWith('/')
        ? apiBase
        : `${apiBase}/`
    ).toString();
  } catch {
    return raw;
  }
}

function AnnouncementFileReferences({
  references,
}) {
  const files =
    normalizeAnnouncementFileReferenceList(
      references
    );

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700">
        <Link2 className="h-3.5 w-3.5" />
        Project Files
      </div>

      {files.map((file) => {
        const href =
          resolveAnnouncementFileUrl(
            file.fileUrl
          );

        return (
          <a
            key={file.fileId}
            href={href || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/50 px-4 py-3 transition-all hover:border-cyan-200 hover:bg-cyan-50 hover:shadow-md hover:shadow-cyan-500/10"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-100">
              <FileText className="h-5 w-5" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-slate-900">
                {file.fileName}
              </span>

              <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                {formatAnnouncementFileSize(
                  file.fileSize
                )}
              </span>
            </span>

            <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-cyan-700" />
          </a>
        );
      })}
    </div>
  );
}

function AnnouncementProjectFileInput({
  projectId,
  selectedFiles,
  onChange,
  disabled = false,
}) {
  const [pickerOpen, setPickerOpen] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [projectFiles, setProjectFiles] =
    useState([]);

  const [
    loadingProjectFiles,
    setLoadingProjectFiles,
  ] = useState(false);

  const [
    projectFileError,
    setProjectFileError,
  ] = useState('');

  const normalizedSelected =
    normalizeAnnouncementFileReferenceList(
      selectedFiles
    );

  const selectedIds = new Set(
    normalizedSelected.map(
      (file) => file.fileId
    )
  );

  const availableFiles =
    projectFiles.filter(
      (file) =>
        !selectedIds.has(file.fileId)
    );

  const loadProjectFiles =
    useCallback(async () => {
      if (
        !pickerOpen ||
        !projectId
      ) {
        return;
      }

      setLoadingProjectFiles(true);
      setProjectFileError('');

      try {
        const files =
          await fetchProjectFilesForReference(
            projectId,
            {
              search: searchTerm,
              limit: 100,
            }
          );

        setProjectFiles(
          normalizeAnnouncementFileReferenceList(
            files
          )
        );
      } catch (error) {
        setProjectFileError(
          error?.response?.data?.message ||
          error?.message ||
          'Failed to load project Files'
        );
      } finally {
        setLoadingProjectFiles(false);
      }
    }, [
      pickerOpen,
      projectId,
      searchTerm,
    ]);

  useEffect(() => {
    if (!pickerOpen) return undefined;

    const timer = window.setTimeout(
      loadProjectFiles,
      180
    );

    return () =>
      window.clearTimeout(timer);
  }, [
    pickerOpen,
    loadProjectFiles,
  ]);

  const addFile = (file) => {
    if (
      disabled ||
      normalizedSelected.length >= 10
    ) {
      return;
    }

    onChange(
      normalizeAnnouncementFileReferenceList([
        ...normalizedSelected,
        file,
      ])
    );
  };

  const removeFile = (fileId) => {
    if (disabled) return;

    onChange(
      normalizedSelected.filter(
        (file) =>
          file.fileId !== fileId
      )
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700">
            <Link2 className="h-4 w-4 text-cyan-600" />
            Project Files
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Reference an existing File without uploading it again.
          </p>
        </div>

        <button
          type="button"
          disabled={
            disabled ||
            !projectId
          }
          onClick={() =>
            setPickerOpen(
              (current) => !current
            )
          }
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pickerOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}

          {pickerOpen
            ? 'Close'
            : 'Link project file'}
        </button>
      </div>

      {normalizedSelected.length > 0 && (
        <div className="space-y-2">
          {normalizedSelected.map(
            (file) => (
              <div
                key={file.fileId}
                className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/50 px-4 py-3"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-100">
                  <FileText className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-900">
                    {file.fileName}
                  </span>

                  <span className="block text-xs font-semibold text-slate-500">
                    {formatAnnouncementFileSize(
                      file.fileSize
                    )}
                  </span>
                </span>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    removeFile(file.fileId)
                  }
                  title="Remove File reference"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          )}
        </div>
      )}

      {pickerOpen && (
        <div className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-lg shadow-cyan-500/10">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-cyan-300 focus-within:bg-white">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search project Files..."
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          {loadingProjectFiles ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm font-bold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
              Loading project Files...
            </div>
          ) : projectFileError ? (
            <p className="py-5 text-center text-sm font-bold text-rose-600">
              {projectFileError}
            </p>
          ) : availableFiles.length > 0 ? (
            <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto">
              {availableFiles.map(
                (file) => (
                  <button
                    key={file.fileId}
                    type="button"
                    disabled={
                      disabled ||
                      normalizedSelected.length >= 10
                    }
                    onClick={() =>
                      addFile(file)
                    }
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
                      <FileText className="h-5 w-5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-slate-900">
                        {file.fileName}
                      </span>

                      <span className="block text-xs font-semibold text-slate-500">
                        {formatAnnouncementFileSize(
                          file.fileSize
                        )}
                      </span>
                    </span>

                    <Link2 className="h-4 w-4 shrink-0 text-cyan-600" />
                  </button>
                )
              )}
            </div>
          ) : (
            <p className="py-5 text-center text-sm font-semibold text-slate-500">
              No available project Files found.
            </p>
          )}

          {normalizedSelected.length >= 10 && (
            <p className="mt-3 text-xs font-bold text-amber-700">
              An announcement can reference up to 10 project Files.
            </p>
          )}
        </div>
      )}
    </section>
  );
}


function RichAnnouncementBodyEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const lastHtmlRef = useRef('');
  const didInitializeRef = useRef(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const nextHtml = getAnnouncementBodyHtml({ message: value });

    if (!didInitializeRef.current) {
      editor.innerHTML = nextHtml;
      lastHtmlRef.current = nextHtml;
      didInitializeRef.current = true;
      return;
    }

    if (nextHtml !== lastHtmlRef.current && editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
      lastHtmlRef.current = nextHtml;
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const cleanHtml = sanitizeAnnouncementHtml(editor.innerHTML);
    lastHtmlRef.current = cleanHtml;
    onChange(cleanHtml);
  }, [onChange]);

  const runCommand = (command, commandValue = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const applyInlineStyle = (styles) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    const selection = window.getSelection();
    let range = selection && selection.rangeCount ? selection.getRangeAt(0) : null;

    if (!range || !editor.contains(range.commonAncestorContainer)) {
      const fallbackRange = document.createRange();
      fallbackRange.selectNodeContents(editor);
      fallbackRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(fallbackRange);
      range = fallbackRange;
    }

    const span = document.createElement('span');

    Object.entries(styles).forEach(([key, styleValue]) => {
      if (!styleValue) return;
      span.style[key] = styleValue;
    });

    if (range.collapsed) {
      span.appendChild(document.createTextNode('\u200b'));
      range.insertNode(span);

      const nextRange = document.createRange();
      nextRange.setStart(span.firstChild, 1);
      nextRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(nextRange);
    } else {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);

      const nextRange = document.createRange();
      nextRange.selectNodeContents(span);
      nextRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(nextRange);
    }

    syncFromEditor();
  };

  const handlePaste = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const html = event.clipboardData?.getData('text/html');
    const text = event.clipboardData?.getData('text/plain');
    document.execCommand('insertHTML', false, html ? sanitizeAnnouncementHtml(html) : announcementTextToHtml(text || ''));
    emitChange();
  };

  const stopEditorShortcutPropagation = (event) => {
    event.stopPropagation();
    event.nativeEvent?.stopImmediatePropagation?.();
  };

  const toolbarButtonClass = 'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-700 transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700';
  const toolbarSelectClass = 'rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10';

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 transition-all focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/80 px-3 py-2">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); runCommand('bold'); }} className={toolbarButtonClass} title="Bold">B</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); runCommand('italic'); }} className={`${toolbarButtonClass} italic`} title="Italic">I</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); runCommand('underline'); }} className={`${toolbarButtonClass} underline`} title="Underline">U</button>
        <span className="mx-1 h-6 w-px bg-slate-200" />

        <select className={toolbarSelectClass} defaultValue="" onChange={(e) => { applyInlineStyle({ fontFamily: e.target.value }); e.target.value = ''; }} title="Font family">
          <option value="" disabled>Font</option>
          <option value="Inter, sans-serif">Inter</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Times New Roman', serif">Times</option>
          <option value="'Courier New', monospace">Mono</option>
        </select>

        <select className={toolbarSelectClass} defaultValue="" onChange={(e) => { applyInlineStyle({ fontSize: e.target.value }); e.target.value = ''; }} title="Font size">
          <option value="" disabled>Size</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
        </select>

        <select className={toolbarSelectClass} defaultValue="" onChange={(e) => { applyInlineStyle({ lineHeight: e.target.value }); e.target.value = ''; }} title="Line spacing">
          <option value="" disabled>Spacing</option>
          <option value="1">Tight</option>
          <option value="1.3">Normal</option>
          <option value="1.5">Relaxed</option>
          <option value="1.75">Loose</option>
          <option value="2">Double</option>
        </select>

        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-700 transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700">
          Color
          <input type="color" defaultValue="#334155" className="h-5 w-7 cursor-pointer rounded border-0 bg-transparent p-0" onChange={(e) => applyInlineStyle({ color: e.target.value })} title="Font color" />
        </label>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        dir="ltr"
        style={{ direction: 'ltr', unicodeBidi: 'normal', textAlign: 'left', transform: 'none' }}
        aria-label="Announcement details"
        role="textbox"
        onInput={emitChange}
        onBlur={emitChange}
        onPaste={handlePaste}
        onKeyDownCapture={stopEditorShortcutPropagation}
        onKeyUpCapture={stopEditorShortcutPropagation}
        onBeforeInputCapture={stopEditorShortcutPropagation}
        className="min-h-[170px] w-full px-5 py-4 text-base font-medium leading-7 text-slate-900 focus:outline-none [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  );
}

// ─── Comment Section ────────────────────────────────────────────────────────

function PollComposer({ enabled, setEnabled, question, setQuestion, options, setOptions }) {
  const safeOptions = Array.isArray(options) && options.length ? options : [createPollOptionState(), createPollOptionState()];

  const updateOption = (index, nextText) => {
    setOptions(
      safeOptions.map((option, optionIndex) =>
        optionIndex === index ? { ...option, text: nextText } : option
      )
    );
  };

  const addOption = () => {
    if (safeOptions.length >= 5) return;
    setOptions([...safeOptions, createPollOptionState()]);
  };

  const removeOption = (index) => {
    if (safeOptions.length <= 2) return;
    setOptions(safeOptions.filter((_, optionIndex) => optionIndex !== index));
  };

  return (
    <section className="space-y-3">
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.22em] text-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.45)]" />
          Poll
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          aria-label="Add poll to announcement"
          className="h-6 w-6 shrink-0 cursor-pointer rounded-lg border-2 border-slate-300 text-violet-600 accent-violet-600"
        />
      </label>

      {enabled && (
        <div className="space-y-3 rounded-[28px] border-2 border-violet-200 bg-violet-50/40 p-5 shadow-[0_18px_45px_rgba(79,70,229,0.08)]">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Poll question"
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-[15px] font-bold text-slate-900 placeholder-slate-400 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
          />

          {safeOptions.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="min-w-0 flex-1 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3.5 text-[15px] font-bold text-slate-900 placeholder-slate-400 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
              {safeOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="rounded-xl px-3 py-2 text-sm font-black text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          {safeOptions.length < 5 && (
            <button
              type="button"
              onClick={addOption}
              className="rounded-xl px-1 py-2 text-sm font-black text-violet-600 transition hover:text-violet-700"
            >
              Add option
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function AnnouncementPollBlock({ item, projectId, currentUser, onUpdate }) {
  const [votingOptionId, setVotingOptionId] = useState(null);

  const poll = item?.poll;
  const options = Array.isArray(poll?.options)
    ? poll.options
    : [];

  const currentUserId =
    getCurrentUserId(currentUser);

  const totalVotes = options.reduce(
    (sum, option) =>
      sum + getPollOptionVotes(option).length,
    0
  );

  if (!poll?.question || options.length < 2) {
    return null;
  }

  /*
   * The backend stores the authenticated user's ObjectId
   * inside the votes array of their selected option.
   *
   * This means the participation indicator survives refreshes:
   * we derive the user's current vote from persisted server data,
   * rather than from temporary component state.
   */
  const selectedOptionId = currentUserId
    ? options.find((option) =>
        getPollOptionVotes(option).some(
          (vote) =>
            getPollVoteId(vote) === currentUserId
        )
      )?.id ?? null
    : null;

  const hasVoted = Boolean(selectedOptionId);

  const handleVote = async (optionId) => {
    if (
      !projectId ||
      !getId(item) ||
      !optionId ||
      votingOptionId
    ) {
      return;
    }

    setVotingOptionId(optionId);

    try {
      const response = await votePoll(
        projectId,
        getId(item),
        optionId
      );

      const updated =
        unwrapAnnouncementPayload(response);

      onUpdate?.(
        normalizeAnnouncementLikeState(
          updated,
          currentUser
        )
      );
    } catch (error) {
      toast({
        title:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to vote',
        variant: 'error',
      });
    } finally {
      setVotingOptionId(null);
    }
  };

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50/80 via-white to-cyan-50/50 p-4 shadow-sm shadow-violet-500/[0.04]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">
            Team Poll
          </span>

          {hasVoted && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white/90 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-violet-700 shadow-sm">
              <span
                aria-hidden="true"
                className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-600 text-[9px] leading-none text-white"
              >
                ✓
              </span>
              Participated
            </span>
          )}
        </div>

        <span className="shrink-0 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-black text-slate-500 shadow-sm">
          {totalVotes}{' '}
          {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      <p className="mb-3 text-sm font-black leading-snug text-slate-900">
        {poll.question}
      </p>

      <div className="space-y-2">
        {options.map((option, index) => {
          const optionId = String(
            option?.id || `option-${index + 1}`
          );

          const votes =
            getPollOptionVotes(option);

          const voteCount = votes.length;

          const percent = totalVotes > 0
            ? Math.round(
                (voteCount / totalVotes) * 100
              )
            : 0;

          const isMyVote =
            String(selectedOptionId || '') ===
            optionId;

          const isVoting =
            String(votingOptionId || '') ===
            optionId;

          const voteInProgress =
            Boolean(votingOptionId);

          const canInteract =
            Boolean(projectId) &&
            !poll.closed &&
            !voteInProgress;

          return (
            <button
              key={optionId}
              type="button"
              onClick={() => {
                if (
                  !canInteract ||
                  isMyVote
                ) {
                  return;
                }

                handleVote(optionId);
              }}
              disabled={
                !canInteract ||
                isMyVote
              }
              aria-pressed={isMyVote}
              aria-label={
                isMyVote
                  ? `${option.text}. Your vote. ${percent} percent, ${voteCount} votes.`
                  : `${option.text}. ${percent} percent, ${voteCount} votes.`
              }
              title={
                isMyVote
                  ? 'This is your current vote'
                  : poll.closed
                    ? 'This poll is closed'
                    : undefined
              }
              className={`group relative w-full overflow-hidden rounded-xl border text-left transition-all duration-200 ${
                isMyVote
                  ? 'border-violet-300 bg-violet-50/90 shadow-sm shadow-violet-500/10'
                  : 'border-slate-200/90 bg-white/90 hover:border-violet-300 hover:bg-white hover:shadow-sm'
              } ${
                canInteract && !isMyVote
                  ? 'cursor-pointer'
                  : 'cursor-default'
              }`}
            >
              {/* Result fill */}
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-0 left-0 transition-[width] duration-500 ease-out ${
                  isMyVote
                    ? 'bg-violet-100/80'
                    : 'bg-slate-100/70'
                }`}
                style={{
                  width: `${percent}%`,
                }}
              />

              <span className="relative z-10 flex min-h-[52px] items-center justify-between gap-4 px-4 py-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-black transition-all ${
                      isMyVote
                        ? 'border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                        : 'border-slate-300 bg-white text-transparent group-hover:border-violet-300'
                    }`}
                  >
                    {isMyVote ? '✓' : ''}
                  </span>

                  <span
                    className={`truncate text-sm font-black ${
                      isMyVote
                        ? 'text-violet-800'
                        : 'text-slate-700'
                    }`}
                  >
                    {option.text}
                  </span>

                  {isMyVote && (
                    <span className="hidden shrink-0 rounded-full border border-violet-200 bg-white/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-violet-700 shadow-sm sm:inline-flex">
                      Your vote
                    </span>
                  )}

                  {isVoting && (
                    <span className="shrink-0 text-[10px] font-bold text-violet-500">
                      Saving…
                    </span>
                  )}
                </span>

                <span
                  className={`shrink-0 text-xs font-black ${
                    isMyVote
                      ? 'text-violet-700'
                      : 'text-slate-500'
                  }`}
                >
                  {percent}% · {voteCount}
                </span>
              </span>

              {isMyVote && (
                <span className="relative z-10 -mt-2 block px-[46px] pb-2.5 text-[10px] font-bold text-violet-600 sm:hidden">
                  Your vote
                </span>
              )}
            </button>
          );
        })}
      </div>

      {poll.closed && (
        <div className="mt-3 text-[10px] font-bold text-slate-400">
          Final results · Poll closed
        </div>
      )}
    </div>
  );
}

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

function AnnouncementAffectedWorkReferences({
  moves,
  milestones,
}) {
  const normalizedMoves =
    normalizeAnnouncementAffectedList(
      moves,
      'move',
    );

  const normalizedMilestones =
    normalizeAnnouncementAffectedList(
      milestones,
      'milestone',
    );

  if (
    normalizedMoves.length === 0 &&
    normalizedMilestones.length === 0
  ) {
    return null;
  }

  const renderReference = (
    item,
    kind,
  ) => {
    const isMove = kind === 'move';
    const Icon = isMove
      ? ListTodo
      : Target;

    const status =
      formatAnnouncementWorkStatus(
        item.status
      );

    return (
      <div
        key={`${kind}-${item.id}`}
        className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 ${
          isMove
            ? 'border-violet-100 bg-violet-50/55'
            : 'border-emerald-100 bg-emerald-50/55'
        }`}
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ${
            isMove
              ? 'text-violet-700 ring-violet-100'
              : 'text-emerald-700 ring-emerald-100'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block text-[10px] font-black uppercase tracking-[0.17em] ${
              isMove
                ? 'text-violet-600'
                : 'text-emerald-600'
            }`}
          >
            {isMove
              ? 'Affected Move'
              : 'Affected milestone'}
          </span>

          <span className="mt-0.5 block truncate text-sm font-black text-slate-900">
            {item.title}
          </span>

          {status ? (
            <span className="mt-0.5 block text-xs font-semibold text-slate-500">
              {status}
            </span>
          ) : null}
        </span>
      </div>
    );
  };

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-slate-500" />

        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
          Affected work
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {normalizedMoves.map((item) =>
          renderReference(
            item,
            'move',
          )
        )}

        {normalizedMilestones.map(
          (item) =>
            renderReference(
              item,
              'milestone',
            )
        )}
      </div>
    </section>
  );
}

function AnnouncementAffectedWorkInput({
  moves,
  milestones,
  selectedMoveIds,
  selectedMilestoneIds,
  onMoveIdsChange,
  onMilestoneIdsChange,
  loading = false,
  error = '',
  disabled = false,
}) {
  const [
    moveSearch,
    setMoveSearch,
  ] = useState('');

  const [
    milestoneSearch,
    setMilestoneSearch,
  ] = useState('');

  const normalizedMoves =
    normalizeAnnouncementAffectedList(
      moves,
      'move',
    );

  const normalizedMilestones =
    normalizeAnnouncementAffectedList(
      milestones,
      'milestone',
    );

  const moveIds = (
    Array.isArray(selectedMoveIds)
      ? selectedMoveIds
      : []
  ).map(String);

  const milestoneIds = (
    Array.isArray(selectedMilestoneIds)
      ? selectedMilestoneIds
      : []
  ).map(String);

  const filterItems = (
    items,
    search,
  ) => {
    const query = String(search || '')
      .trim()
      .toLowerCase();

    if (!query) return items;

    return items.filter((item) =>
      [
        item.title,
        item.status,
        item.priority,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        )
    );
  };

  const toggleId = (
    currentIds,
    id,
    onChange,
  ) => {
    if (currentIds.includes(id)) {
      onChange(
        currentIds.filter(
          (currentId) =>
            currentId !== id
        )
      );
      return;
    }

    if (currentIds.length >= 10) {
      toast({
        title:
          'An announcement can reference up to 10 items of each type',
        variant: 'error',
      });
      return;
    }

    onChange([
      ...currentIds,
      id,
    ]);
  };

  const renderList = ({
    items,
    selectedIds,
    onChange,
    kind,
    search,
    setSearch,
  }) => {
    const isMove = kind === 'move';
    const Icon = isMove
      ? ListTodo
      : Milestone;

    const filteredItems =
      filterItems(
        items,
        search,
      );

    return (
      <div
        className={`rounded-2xl border bg-white p-3 ${
          isMove
            ? 'border-violet-100'
            : 'border-emerald-100'
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span
            className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] ${
              isMove
                ? 'text-violet-700'
                : 'text-emerald-700'
            }`}
          >
            <Icon className="h-4 w-4" />

            {isMove
              ? 'Moves'
              : 'Milestones'}
          </span>

          <span className="text-xs font-black text-slate-400">
            {selectedIds.length}/10
          </span>
        </div>

        <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-violet-300 focus-within:bg-white">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />

          <input
            type="search"
            value={search}
            disabled={disabled}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder={
              isMove
                ? 'Search Moves...'
                : 'Search milestones...'
            }
            className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60"
          />

          {search ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                setSearch('')
              }
              className="text-slate-400 hover:text-slate-700 disabled:opacity-50"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {filteredItems.length > 0 ? (
          <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const checked =
                selectedIds.includes(
                  item.id
                );

              const limitReached =
                !checked &&
                selectedIds.length >= 10;

              return (
                <label
                  key={`${kind}-${item.id}`}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                    checked
                      ? isMove
                        ? 'border-violet-200 bg-violet-50'
                        : 'border-emerald-200 bg-emerald-50'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  } ${
                    disabled ||
                    limitReached
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={
                      disabled ||
                      limitReached
                    }
                    onChange={() =>
                      toggleId(
                        selectedIds,
                        item.id,
                        onChange,
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />

                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      isMove
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-slate-900">
                      {item.title}
                    </span>

                    <span className="block text-xs font-semibold text-slate-500">
                      {formatAnnouncementWorkStatus(
                        item.status
                      ) ||
                        (isMove
                          ? 'Move'
                          : 'Milestone')}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-5 text-center text-xs font-bold text-slate-500">
            {search
              ? 'No matching work found.'
              : isMove
                ? 'No Moves are available.'
                : 'No milestones are available.'}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
          <Link2 className="h-5 w-5" />
        </span>

        <div>
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-700">
            Affected work
          </span>

          <span className="mt-1 block text-xs font-semibold text-slate-500">
            Connect this broadcast to the Moves and milestones it affects.
          </span>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-7 text-sm font-bold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
          Loading project work...
        </div>
      ) : error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {renderList({
            items: normalizedMoves,
            selectedIds: moveIds,
            onChange: onMoveIdsChange,
            kind: 'move',
            search: moveSearch,
            setSearch: setMoveSearch,
          })}

          {renderList({
            items:
              normalizedMilestones,
            selectedIds:
              milestoneIds,
            onChange:
              onMilestoneIdsChange,
            kind: 'milestone',
            search:
              milestoneSearch,
            setSearch:
              setMilestoneSearch,
          })}
        </div>
      )}
    </section>
  );
}

function AnnouncementCard({ item, projectId, currentUser, onPin, onDelete, onEdit, onUpdate, readOnly = false }) {
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

            <div
              dir="ltr"
              style={{ direction: 'ltr', unicodeBidi: 'normal', textAlign: 'left', transform: 'none' }}
              className="announcement-rich-body mt-5 text-[16px] font-medium leading-8 text-slate-700 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_strong]:font-black [&_b]:font-black [&_em]:italic [&_i]:italic [&_u]:underline"
              dangerouslySetInnerHTML={{ __html: getAnnouncementBodyHtml(item) }}
            />

            <AttachmentGallery attachments={item.attachments} />
            <AnnouncementFileReferences
              references={item.fileReferences}
            />
            <AnnouncementAffectedWorkReferences
              moves={item.affectedMoveIds}
              milestones={
                item.affectedMilestoneIds
              }
            />
            <AnnouncementPollBlock
              item={item}
              projectId={readOnly ? undefined : projectId}
              currentUser={currentUser}
              onUpdate={readOnly ? undefined : onUpdate}
            />

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
        {!readOnly && (
          <CommentSection
            item={item}
            projectId={projectId}
            currentUser={currentUser}
            onUpdate={onUpdate}
          />
        )}
      </div>
    </article>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AnnouncementsView({ projectId, readOnly = false }) {
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
  const [
    linkedProjectFiles,
    setLinkedProjectFiles,
  ] = useState([]);
  const [
    linkedMoveIds,
    setLinkedMoveIds,
  ] = useState([]);
  const [
    linkedMilestoneIds,
    setLinkedMilestoneIds,
  ] = useState([]);
  const [
    announcementMoveOptions,
    setAnnouncementMoveOptions,
  ] = useState([]);
  const [
    announcementMilestoneOptions,
    setAnnouncementMilestoneOptions,
  ] = useState([]);
  const [
    affectedWorkLoading,
    setAffectedWorkLoading,
  ] = useState(false);
  const [
    affectedWorkError,
    setAffectedWorkError,
  ] = useState('');
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState([createPollOptionState(), createPollOptionState()]);
  const [posting, setPosting] = useState(false);
  const mountedRef = useRef(true);

  const anyUploading = uploadedFiles.some((a) => a.uploading);
  const resetAnnouncementForm = () => {
    setTitle('');
    setMessage('');
    setType('info');
    setPinned(false);
    setUploadedFiles([]);
    setLinkedProjectFiles([]);
    setLinkedMoveIds([]);
    setLinkedMilestoneIds([]);
    setPollEnabled(false);
    setPollQuestion('');
    setPollOptions([createPollOptionState(), createPollOptionState()]);
  };

  const openCreateModal = () => {
    if (readOnly) return;
    setEditingAnnouncement(null);
    resetAnnouncementForm();
    setShowCreate(true);
  };

  const openEditModal = (announcement) => {
    if (readOnly) return;
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
    setLinkedProjectFiles(
      normalizeAnnouncementFileReferenceList(
        announcement?.fileReferences
      )
    );
    setLinkedMoveIds(
      normalizeAnnouncementAffectedList(
        announcement?.affectedMoveIds,
        'move',
      ).map((move) => move.id)
    );
    setLinkedMilestoneIds(
      normalizeAnnouncementAffectedList(
        announcement?.affectedMilestoneIds,
        'milestone',
      ).map(
        (milestone) =>
          milestone.id
      )
    );

    const existingPoll = announcement?.poll;
    const existingOptions = Array.isArray(existingPoll?.options)
      ? existingPoll.options.map((option) => createPollOptionState(option?.text || '')).slice(0, 5)
      : [];

    setPollEnabled(Boolean(existingPoll?.question && existingOptions.length >= 2));
    setPollQuestion(existingPoll?.question || '');
    setPollOptions(existingOptions.length >= 2 ? existingOptions : [createPollOptionState(), createPollOptionState()]);
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

  useEffect(() => {
    if (!showCreate || !projectId) {
      return undefined;
    }

    let cancelled = false;

    const loadAffectedWork = async () => {
      setAffectedWorkLoading(true);
      setAffectedWorkError('');

      try {
        const [
          moves,
          milestones,
        ] = await Promise.all([
          listTasks(
            projectId,
            {
              limit: 200,
            }
          ),
          getMilestones(
            projectId,
            {
              limit: 200,
            }
          ),
        ]);

        if (cancelled) return;

        setAnnouncementMoveOptions(
          normalizeAnnouncementAffectedList(
            moves,
            'move',
          )
        );

        setAnnouncementMilestoneOptions(
          normalizeAnnouncementAffectedList(
            milestones,
            'milestone',
          )
        );
      } catch (loadError) {
        if (cancelled) return;

        setAnnouncementMoveOptions([]);
        setAnnouncementMilestoneOptions([]);

        setAffectedWorkError(
          loadError?.response?.data?.message ||
            loadError?.message ||
            'Failed to load project Moves and milestones'
        );
      } finally {
        if (!cancelled) {
          setAffectedWorkLoading(false);
        }
      }
    };

    loadAffectedWork();

    return () => {
      cancelled = true;
    };
  }, [
    showCreate,
    projectId,
  ]);

  const handleCreate = async () => {
    if (readOnly) return;
    const cleanMessage = sanitizeAnnouncementHtml(message);
    const cleanPoll = normalizePollForSubmit(pollEnabled, pollQuestion, pollOptions);

    if (!title.trim() || !getAnnouncementPlainText(cleanMessage).trim() || posting) return;

    if (pollEnabled && !cleanPoll) {
      toast({ title: 'Add a poll question and at least two options', variant: 'error' });
      return;
    }

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
          message: cleanMessage,
          type,
          pinned,
          fileReferences:
            linkedProjectFiles.map(
              (file) => file.fileId
            ),
          affectedMoveIds:
            linkedMoveIds,
          affectedMilestoneIds:
            linkedMilestoneIds,
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
                      cleanMessage,
                    type: updated?.type || type,
                    fileReferences:
                      Array.isArray(
                        updated?.fileReferences
                      )
                        ? updated.fileReferences
                        : linkedProjectFiles,
                    affectedMoveIds:
                      resolveAnnouncementAffectedReferences(
                        updated?.affectedMoveIds,
                        announcementMoveOptions,
                        linkedMoveIds,
                        'move',
                      ),
                    affectedMilestoneIds:
                      resolveAnnouncementAffectedReferences(
                        updated?.affectedMilestoneIds,
                        announcementMilestoneOptions,
                        linkedMilestoneIds,
                        'milestone',
                      ),
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

        const response = await createAnnouncement(projectId, {
          title: title.trim(),
          message: cleanMessage,
          type,
          pinned,
          attachments: attachmentUrls,
          fileReferences:
            linkedProjectFiles.map(
              (file) => file.fileId
            ),
          poll: cleanPoll,
          affectedMoveIds:
            linkedMoveIds,
          affectedMilestoneIds:
            linkedMilestoneIds,
        });

        const created = unwrapAnnouncementPayload(response);
        const renderablePoll = makeRenderablePoll(created?.poll || cleanPoll);

        const optimisticAnnouncement = {
          ...created,
          authorId: created?.authorId || user,
          title: created?.title || title.trim(),
          message: created?.message || created?.content || cleanMessage,
          attachments: created?.attachments || attachmentUrls,
          fileReferences:
            Array.isArray(
              created?.fileReferences
            )
              ? created.fileReferences
              : linkedProjectFiles,
          affectedMoveIds:
            resolveAnnouncementAffectedReferences(
              created?.affectedMoveIds,
              announcementMoveOptions,
              linkedMoveIds,
              'move',
            ),
          affectedMilestoneIds:
            resolveAnnouncementAffectedReferences(
              created?.affectedMilestoneIds,
              announcementMilestoneOptions,
              linkedMilestoneIds,
              'milestone',
            ),
          poll: renderablePoll,
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
    if (readOnly) return;
    try {
      const updated = await toggleAnnouncementPin(projectId, id);
      setAnnouncements(prev => prev.map(a => getId(a) === id ? { ...a, ...updated } : a));
    } catch { toast({ title: 'Failed to pin', variant: 'error' }); }
  };

  const handleDelete = async (id) => {
    if (readOnly) return;
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

  const hasAnnouncementBody = getAnnouncementPlainText(message).trim().length > 0;

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
              className={`${readOnly ? 'hidden ' : ''}announcements-hero-cta announcements-primary-button relative isolate inline-flex items-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-violet-500/40`}
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
          <div className="flex flex-col items-center bg-white px-5 py-10 text-center rounded-2xl border border-slate-200 shadow-sm sm:block sm:px-0 sm:py-24">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50 shadow-sm sm:mb-6 sm:h-20 sm:w-20">
              <Megaphone className="h-8 w-8 text-slate-400 sm:h-10 sm:w-10" />
            </div>
            <p className="mb-2 text-lg font-black text-slate-900 sm:text-xl">
              No announcements yet
            </p>
            <p className="mx-auto mb-6 max-w-[20rem] text-sm font-medium leading-6 text-slate-500 sm:mb-8 sm:max-w-sm">
              No broadcasts yet. Post the first high-signal update so the team
              knows what changed, what matters, and what happens next.
            </p>
            <button
              onClick={openCreateModal}
              className={`${readOnly ? 'hidden ' : ''}mx-auto flex w-fit max-w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/50 sm:px-6`}
            >
              <Plus className="w-4 h-4" /> Post First Announcement
            </button>
          </div>
        ) : (
          sorted.map(item => (
            <AnnouncementCard
              key={getId(item)}
              item={item}
              projectId={projectId}
              currentUser={user}
              onPin={readOnly ? undefined : handlePin}
              onDelete={readOnly ? undefined : handleDelete}
              onUpdate={handleUpdate}
              onEdit={readOnly ? undefined : openEditModal}
              readOnly={readOnly}
            />
          ))
        )}
      </div>

      {!readOnly && showCreate && (
        <div className="pc-create-viewport fixed inset-0 z-[9999] flex items-stretch justify-center p-0 pointer-events-none sm:items-center sm:p-6">
          <button
            type="button"
            className="pc-create-backdrop fixed inset-0 bg-black/5 backdrop-blur-[2px] pointer-events-auto"
            onClick={closeAnnouncementModal}
            aria-label="Close post announcement modal backdrop"
          />

          <div className="announcement-create-modal pc-create-modal pointer-events-auto relative flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-none border-0 bg-white pt-[calc(env(safe-area-inset-top)+4rem)] pb-[calc(env(safe-area-inset-bottom)+5rem)] shadow-[0_24px_80px_rgba(139,92,246,0.16)] sm:h-auto sm:max-h-[88vh] sm:rounded-[28px] sm:border sm:border-slate-200/80 sm:pt-0 sm:pb-0">
            <div className="shrink-0 border-b border-slate-200/80 bg-white">
              <div className="flex items-center justify-between gap-3 px-4 py-4 sm:gap-5 sm:px-8 sm:py-5">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/25 sm:h-11 sm:w-11">
                    <Megaphone className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-700">
                      Team Broadcast
                    </p>
                    <h2 className="mt-1 text-xl font-black leading-none tracking-tight text-slate-950 sm:text-2xl">
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

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-white px-4 py-4 [-webkit-overflow-scrolling:touch] sm:space-y-6 sm:px-8 sm:py-8">
              <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-3 sm:p-4">
                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
                  Type Category
                </label>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  {['info', 'warning', 'success', 'urgent'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`rounded-2xl border px-3 py-2.5 text-sm font-black capitalize transition-all sm:px-4 sm:py-3 ${
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

                <RichAnnouncementBodyEditor value={message} onChange={setMessage} />
              </div>

                            <PollComposer
                enabled={pollEnabled}
                setEnabled={setPollEnabled}
                question={pollQuestion}
                setQuestion={setPollQuestion}
                options={pollOptions}
                setOptions={setPollOptions}
              />

              <AnnouncementAffectedWorkInput
                moves={
                  announcementMoveOptions
                }
                milestones={
                  announcementMilestoneOptions
                }
                selectedMoveIds={
                  linkedMoveIds
                }
                selectedMilestoneIds={
                  linkedMilestoneIds
                }
                onMoveIdsChange={
                  setLinkedMoveIds
                }
                onMilestoneIdsChange={
                  setLinkedMilestoneIds
                }
                loading={
                  affectedWorkLoading
                }
                error={
                  affectedWorkError
                }
                disabled={posting}
              />

              <AnnouncementProjectFileInput
                projectId={projectId}
                selectedFiles={linkedProjectFiles}
                onChange={setLinkedProjectFiles}
                disabled={posting}
              />

              <AttachmentInput
                uploadedFiles={uploadedFiles}
                onFilesChange={setUploadedFiles}
              />

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-3 transition-colors hover:border-amber-200 hover:bg-amber-50/60 sm:gap-4 sm:p-4">
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

            <div className="shrink-0 flex items-center gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:justify-end sm:gap-4 sm:px-6 sm:py-5">
              <button
                onClick={closeAnnouncementModal}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-100 sm:flex-none sm:px-6"
              >
                Cancel
              </button>

              <button
                onClick={handleCreate}
                disabled={!title.trim() || !hasAnnouncementBody || posting || anyUploading}
                className="announcements-primary-button relative isolate flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-100 sm:flex-none sm:px-8"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      title.trim() && hasAnnouncementBody && !posting && !anyUploading
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)'
                        : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%)',
                    boxShadow:
                      title.trim() && hasAnnouncementBody && !posting && !anyUploading
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
