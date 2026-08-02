// src/components/views/ThreadsView.jsx
// Split-panel project thread view with Messenger-style member picker
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  MessageCircle, Pin, Search, Plus, Clock, Users,
  Hash, Loader2, X, ChevronLeft, ArrowUp, Check,
  Paperclip, FileText, ExternalLink, Link2,
  MoreHorizontal, ListTodo, Megaphone,
} from 'lucide-react';
import {
  getProjectThreads, createThread,
  getThreadMessages, postThreadMessage,
} from '../../api/threads';
import {
  fetchProjectFilesForReference,
  createTask,
  addTaskFileReference,
} from '../../api/taskApi';
import {
  createAnnouncement,
} from '../../api/announcements';
import { toast } from '../ui/toast';

const CHANNELS = [
  { id: 'all', label: 'All', icon: MessageCircle },
  { id: 'planning', label: 'Planning', icon: Hash },
  { id: 'design', label: 'Design', icon: Hash },
  { id: 'ops', label: 'Ops', icon: Hash },
  { id: 'general', label: 'General', icon: Hash },
];

function timeAgo(ts) {
  if (!ts) return '';
  const d = Date.now() - new Date(ts).getTime();
  if (isNaN(d) || d < 0) return '';
  const m = Math.floor(d / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);
  if (m < 1) return 'Now';
  if (m < 60) return m + 'm';
  if (h < 24) return h + 'h';
  if (dy < 7) return dy + 'd';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getEntityId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;

  return (
    value._id ||
    value.id ||
    value.userId?._id ||
    value.userId?.id ||
    value.user?._id ||
    value.user?.id ||
    null
  );
}

function getEntityName(user, fallback = 'Team Member') {
  if (!user || typeof user === 'string') return fallback;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  return (
    user.fullName ||
    user.name ||
    fullName ||
    user.displayName ||
    user.username ||
    user.email ||
    fallback
  );
}

function getEntityEmail(user) {
  if (!user || typeof user === 'string') return '';

  return (
    user.email ||
    user.primaryEmail ||
    user.contactEmail ||
    user.user?.email ||
    ''
  );
}

function getEntityAvatar(user) {
  if (!user || typeof user === 'string') return null;

  return (
    user.profilePicture ||
    user.avatarUrl ||
    user.avatar ||
    user.photoUrl ||
    user.imageUrl ||
    user.picture ||
    user.profile?.profilePicture ||
    user.profile?.avatarUrl ||
    user.user?.profilePicture ||
    user.user?.avatarUrl ||
    null
  );
}

function formatRoleLabel(role, isOwner = false) {
  if (isOwner || String(role || '').toLowerCase() === 'owner') return 'Owner';

  const clean = String(role || 'member')
    .replace(/[_-]/g, ' ')
    .trim();

  return clean.replace(/\b\w/g, letter => letter.toUpperCase());
}

function getInitials(name) {
  return String(name || 'Team Member')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?';
}

function extractMembers(project) {
  if (!project) return [];

  const members = [];
  const seen = new Set();

  const addMember = ({ user, id, role = 'member', isOwner = false }) => {
    const rawId = getEntityId(user) || id;
    if (!rawId) return;

    const normalizedId = String(rawId);
    if (seen.has(normalizedId)) return;
    seen.add(normalizedId);

    const name = getEntityName(user, isOwner ? 'Owner' : normalizedId.slice(-6));

    members.push({
      id: normalizedId,
      name,
      role: String(role || 'member').toLowerCase(),
      roleLabel: formatRoleLabel(role, isOwner),
      email: getEntityEmail(user),
      avatarUrl: getEntityAvatar(user),
      initials: getInitials(name),
    });
  };

  const ownerUser =
    (project.owner && typeof project.owner === 'object' ? project.owner : null) ||
    (project.ownerId && typeof project.ownerId === 'object' ? project.ownerId : null) ||
    (project.createdBy && typeof project.createdBy === 'object' ? project.createdBy : null) ||
    null;

  const ownerId =
    getEntityId(project.owner) ||
    getEntityId(project.ownerId) ||
    getEntityId(project.createdBy) ||
    project.ownerId ||
    project.owner;

  if (ownerId) {
    addMember({
      user: ownerUser || { _id: ownerId, username: 'Owner' },
      id: ownerId,
      role: 'owner',
      isOwner: true,
    });
  }

  if (Array.isArray(project.members)) {
    for (const memberRecord of project.members) {
      const user =
        memberRecord.userId ||
        memberRecord.user ||
        memberRecord.member ||
        memberRecord;

      const uid = getEntityId(user);
      if (!uid) continue;

      const isOwner = ownerId && String(uid) === String(ownerId);

      addMember({
        user,
        id: uid,
        role:
          isOwner
            ? 'owner'
            : memberRecord.displayRole ||
              memberRecord.role ||
              memberRecord.projectRole ||
              user.displayRole ||
              user.role ||
              'member',
        isOwner,
      });
    }
  }

  return members;
}

function getThreadParticipants(thread, projectMembers = [], currentUserId = null) {
  const sources = [
    thread?.participants,
    thread?.participantIds,
    thread?.members,
    thread?.memberIds,
    thread?.recipients,
    thread?.recipientIds,
    thread?.selectedParticipants,
  ].filter(Array.isArray);
  const memberById = new Map(projectMembers.map(member => [String(member.id), member]));
  const seen = new Set();

  return sources.flat().map(record => {
    const entity = record?.userId || record?.user || record?.member || record?.recipient || record;
    const rawId = getEntityId(entity) || getEntityId(record) ||
      (typeof record === 'string' ? record : null);
    const id = rawId ? String(rawId) : '';
    const projectMember = id ? memberById.get(id) : null;
    const name = projectMember?.name || getEntityName(entity, '') || getEntityName(record, '');

    if (!name || (currentUserId && id === String(currentUserId))) return null;

    return {
      id: id || name,
      name,
      avatarUrl: projectMember?.avatarUrl || getEntityAvatar(entity) || getEntityAvatar(record),
      initials: projectMember?.initials || getInitials(name),
    };
  }).filter(Boolean).filter(participant => {
    const key = String(participant.id || participant.name).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ParticipantAvatar({ participant }) {
  return (
    <span
      className="relative inline-flex h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-white bg-slate-100 shadow-sm ring-1 ring-slate-200 dark:border-[#17171b] dark:bg-white/[0.08] dark:ring-white/[0.10]"
      title={participant.name}
    >
      {participant.avatarUrl ? (
        <img
          src={participant.avatarUrl}
          alt={participant.name}
          className="h-full w-full object-cover"
          onError={event => {
            event.currentTarget.style.display = 'none';
            const fallback = event.currentTarget.nextElementSibling;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      <span
        style={{ display: participant.avatarUrl ? 'none' : 'flex' }}
        className="absolute inset-0 items-center justify-center text-[10px] font-black text-slate-600 dark:text-white/70"
      >
        {participant.initials}
      </span>
    </span>
  );
}

function ThreadItem({ thread, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(thread)}
      className={
        'w-full text-left p-3 rounded-xl transition-all duration-150 ' +
        (isActive
          ? 'bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20'
          : 'bg-white dark:bg-white/[0.03] border border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.05]')
      }
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {thread.isPinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0 fill-current" />}
          <span className={'text-sm font-medium truncate ' + (isActive ? 'text-violet-700 dark:text-violet-300' : 'text-slate-800 dark:text-white')}>
            {thread.title}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-white/30 flex-shrink-0">
          {timeAgo(thread.lastReplyAt || thread.createdAt)}
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-white/40 truncate mb-1.5">
        {thread.lastMessage || 'No thread activity yet'}
      </p>
      <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-white/30">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{thread.participantCount || 0}</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{thread.replyCount || 0}</span>
      </div>
    </button>
  );
}


function normalizeThreadFileReference(file) {
  const fileId = String(
    file?.fileId ||
    file?._id ||
    file?.id ||
    ''
  ).trim();

  const fileName = String(
    file?.fileName ||
    file?.originalName ||
    file?.name ||
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
    ''
  ).trim();

  const rawSize = Number(
    file?.fileSize ??
    file?.sizeInBytes ??
    file?.size ??
    0
  );

  const fileSize =
    Number.isFinite(rawSize) &&
    rawSize >= 0
      ? rawSize
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
  };
}

function normalizeThreadFileReferences(files) {
  const seen = new Set();

  return (Array.isArray(files) ? files : [])
    .map(normalizeThreadFileReference)
    .filter((file) => {
      if (!file || seen.has(file.fileId)) {
        return false;
      }

      seen.add(file.fileId);
      return true;
    });
}

function formatThreadFileSize(bytes) {
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

function buildMessageConversionTitle(content) {
  const firstLine =
    String(content || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ||
    'Team Room message';

  if (firstLine.length <= 120) {
    return firstLine;
  }

  return (
    firstLine.slice(0, 117).trimEnd() +
    '...'
  );
}

function ThreadMessageFileCard({
  file,
  isOwn = false,
}) {
  const normalized =
    normalizeThreadFileReference(file);

  if (!normalized) return null;

  return (
    <a
      href={normalized.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={
        'group flex min-w-[230px] max-w-sm items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ' +
        (
          isOwn
            ? 'border-white/25 bg-white/10 hover:bg-white/20'
            : 'border-cyan-100 bg-cyan-50/80 hover:border-cyan-200 hover:bg-cyan-50 dark:border-cyan-400/15 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/15'
        )
      }
    >
      <span
        className={
          'grid h-9 w-9 shrink-0 place-items-center rounded-lg ' +
          (
            isOwn
              ? 'bg-white/15 text-white'
              : 'bg-white text-cyan-700 ring-1 ring-cyan-100 dark:bg-white/[0.08] dark:text-cyan-200 dark:ring-white/[0.08]'
          )
        }
      >
        <FileText className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={
            'block truncate text-xs font-black ' +
            (
              isOwn
                ? 'text-white'
                : 'text-slate-900 dark:text-white'
            )
          }
        >
          {normalized.fileName}
        </span>

        <span
          className={
            'mt-0.5 block text-[10px] font-semibold ' +
            (
              isOwn
                ? 'text-white/70'
                : 'text-slate-500 dark:text-white/45'
            )
          }
        >
          {formatThreadFileSize(
            normalized.fileSize
          )}
        </span>
      </span>

      <ExternalLink
        className={
          'h-3.5 w-3.5 shrink-0 ' +
          (
            isOwn
              ? 'text-white/70'
              : 'text-cyan-700 dark:text-cyan-200'
          )
        }
      />
    </a>
  );
}

function ThreadProjectFilePicker({
  projectId,
  disabled = false,
  onSelect,
  onClose,
}) {
  const [searchTerm, setSearchTerm] =
    useState('');

  const [projectFiles, setProjectFiles] =
    useState([]);

  const [loadingFiles, setLoadingFiles] =
    useState(false);

  const [fileError, setFileError] =
    useState('');

  const loadFiles =
    useCallback(async () => {
      if (!projectId) return;

      setLoadingFiles(true);
      setFileError('');

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
          normalizeThreadFileReferences(files)
        );
      } catch (error) {
        setFileError(
          error?.response?.data?.message ||
          error?.message ||
          'Failed to load project Files'
        );
      } finally {
        setLoadingFiles(false);
      }
    }, [projectId, searchTerm]);

  useEffect(() => {
    const timer = window.setTimeout(
      loadFiles,
      180
    );

    return () =>
      window.clearTimeout(timer);
  }, [loadFiles]);

  return (
    <div className="mb-3 rounded-2xl border border-cyan-100 bg-white p-3 shadow-lg shadow-cyan-500/10 dark:border-cyan-400/15 dark:bg-[#17171b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">
            <Link2 className="h-3.5 w-3.5" />
            Link project file
          </p>

          <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-white/40">
            Reference an existing File without uploading it again.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
          title="Close File picker"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/[0.08] dark:bg-white/[0.04]">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />

        <input
          type="search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          placeholder="Search project Files..."
          className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-white/30"
        />
      </div>

      {loadingFiles ? (
        <div className="flex items-center justify-center gap-2 py-5 text-xs font-bold text-slate-500 dark:text-white/45">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
          Loading project Files...
        </div>
      ) : fileError ? (
        <p className="py-5 text-center text-xs font-bold text-rose-600">
          {fileError}
        </p>
      ) : projectFiles.length > 0 ? (
        <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
          {projectFiles.map((file) => (
            <button
              key={file.fileId}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(file)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-cyan-500/10"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200">
                <FileText className="h-4 w-4" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-black text-slate-900 dark:text-white">
                  {file.fileName}
                </span>

                <span className="block text-[10px] font-semibold text-slate-500 dark:text-white/40">
                  {formatThreadFileSize(
                    file.fileSize
                  )}
                </span>
              </span>

              <Link2 className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-200" />
            </button>
          ))}
        </div>
      ) : (
        <p className="py-5 text-center text-xs font-semibold text-slate-500 dark:text-white/40">
          No project Files found.
        </p>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  isOwn,
  onConvert,
  conversionDisabled = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const userObj = msg.userId || {};
  const name = isOwn ? 'You' : (userObj.firstName ? (userObj.firstName + ' ' + (userObj.lastName || '')).trim() : (msg.authorName || 'Team Member'));
  const initial = name[0]?.toUpperCase() || '?';

  // ⭐ AVATAR RESOLUTION CHAIN ⭐
  const avatarUrl = userObj.profilePicture || userObj.avatarUrl || userObj.avatar || userObj.photoUrl || null;
  const fileReferences =
    normalizeThreadFileReferences(
      msg?.fileReferences
    );

  const isOptimistic =
    String(msg?._id || '')
      .startsWith('temp-');

  const canConvert =
    !conversionDisabled &&
    !isOptimistic &&
    Boolean(
      String(msg?.content || '').trim()
    );

  const requestConversion = (type) => {
    setMenuOpen(false);
    onConvert?.(type);
  };

  return (
    <div className={'flex w-full mb-1 ' + (isOwn ? 'justify-end' : 'justify-start')}>
      <div className={'flex gap-2.5 max-w-[85%] ' + (isOwn ? 'flex-row-reverse' : 'flex-row')}>
        {/* Avatar Container */}
        <div
          className={
            'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0 overflow-hidden relative mt-auto mb-1 ' +
            (isOwn
              ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400'
              : 'bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-white/50')
          }
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <span
            style={{ display: avatarUrl ? 'none' : 'flex' }}
            className="items-center justify-center w-full h-full absolute inset-0"
          >
            {initial}
          </span>
        </div>

        {/* Message Bubble & Metadata Container */}
        <div className={'flex flex-col ' + (isOwn ? 'items-end' : 'items-start')}>
          <div className={'flex items-center gap-2 mb-1 ' + (isOwn ? 'flex-row-reverse' : 'flex-row')}>
            <span className="text-[11px] font-medium text-slate-700 dark:text-white/70">{name}</span>
            <span className="text-[10px] text-slate-400 dark:text-white/30">{timeAgo(msg.createdAt)}</span>

            {canConvert ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setMenuOpen(
                      (current) => !current
                    )
                  }
                  className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-white/30 dark:hover:bg-white/[0.08] dark:hover:text-white"
                  title="Message actions"
                  aria-label="Message actions"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>

                {menuOpen ? (
                  <div
                    role="menu"
                    className={
                      'absolute bottom-7 z-40 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/[0.10] dark:bg-[#222228] ' +
                      (
                        isOwn
                          ? 'right-0'
                          : 'left-0'
                      )
                    }
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() =>
                        requestConversion('move')
                      }
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-violet-50 hover:text-violet-700 dark:text-white/75 dark:hover:bg-violet-500/10 dark:hover:text-violet-200"
                    >
                      <ListTodo className="h-4 w-4 shrink-0" />
                      Convert to Move
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() =>
                        requestConversion(
                          'announcement'
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 dark:text-white/75 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-200"
                    >
                      <Megaphone className="h-4 w-4 shrink-0" />
                      Convert to Announcement
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <div
            className={
              'max-w-full space-y-2.5 px-4 py-2.5 shadow-sm text-sm leading-relaxed ' +
              (isOwn
                ? 'bg-violet-600 text-white rounded-t-2xl rounded-bl-2xl rounded-br-md'
                : 'bg-slate-100 dark:bg-[#2a2a2e] text-slate-800 dark:text-white/90 rounded-t-2xl rounded-br-2xl rounded-bl-md')
            }
          >
            <div className="whitespace-pre-wrap break-words">
              {msg.content || ''}
            </div>

            {fileReferences.map((file) => (
              <ThreadMessageFileCard
                key={file.fileId}
                file={file}
                isOwn={isOwn}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversationPanel({ projectId, thread, currentUserId, participants = [], onBack, readOnly = false }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [linkedFile, setLinkedFile] = useState(null);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversionTarget, setConversionTarget] = useState(null);
  const scrollRef = useRef(null);
  const threadId = thread?._id || thread?.id;

  useEffect(() => {
    if (!threadId) return;
    let mounted = true;
    setLoading(true);
    setLinkedFile(null);
    setFilePickerOpen(false);
    setConversionTarget(null);
    getThreadMessages(threadId)
      .then(data => { if (mounted) setMessages(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [threadId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = useCallback(async () => {
    const content = newMsg.trim();

    if (!content || !threadId || sending) {
      return;
    }

    const normalizedFile =
      normalizeThreadFileReference(
        linkedFile
      );

    const fileReferences =
      normalizedFile
        ? [normalizedFile]
        : [];

    const optimistic = {
      _id: 'temp-' + Date.now(),
      content,
      fileReferences,
      authorName: 'You',
      createdAt: new Date().toISOString(),
      _isOwn: true,
    };

    setMessages((previous) => [
      ...previous,
      optimistic,
    ]);

    setNewMsg('');
    setLinkedFile(null);
    setFilePickerOpen(false);
    setSending(true);

    try {
      const created =
        await postThreadMessage(
          threadId,
          {
            content,
            fileReferences:
              normalizedFile
                ? [normalizedFile.fileId]
                : [],
          }
        );

      if (created) {
        setMessages((previous) =>
          previous.map((message) =>
            message._id === optimistic._id
              ? {
                  ...created,
                  _isOwn: true,
                }
              : message
          )
        );
      }
    } catch (error) {
      setMessages((previous) =>
        previous.filter(
          (message) =>
            message._id !== optimistic._id
        )
      );

      setNewMsg(content);
      setLinkedFile(normalizedFile);

      toast({
        title:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to send',
        variant: 'error',
      });
    } finally {
      setSending(false);
    }
  }, [
    newMsg,
    linkedFile,
    threadId,
    sending,
  ]);

  if (!thread) return null;

  const participantCount = participants.length ||
    Number(thread.participantCount || thread.participants?.length || 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] lg:hidden">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="shrink-0 text-sm font-semibold text-slate-800 dark:text-white">
              {thread.title}
            </h3>
            {participants.length > 0 ? (
              <>
                <span className="text-slate-300 dark:text-white/20">•</span>
                <span className="truncate text-sm font-semibold text-violet-700 dark:text-violet-300">
                  {participants.map(participant => participant.name).join(', ')}
                </span>
              </>
            ) : null}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-white/30">
            {participantCount} member{participantCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4 [scrollbar-gutter:stable]">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-violet-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-white/60 mb-1">Start the project thread</p>
            <p className="text-xs text-slate-400 dark:text-white/30">Send a message to get this thread moving</p>
          </div>
        ) : messages.map((msg, idx) => {
          // ⭐ BULLETPROOF OWNERSHIP CHECK ⭐
          const isOptimistic = Boolean(msg._id && String(msg._id).startsWith('temp-'));
          const rawUserId =
            msg.userId?._id ||
            msg.userId?.id ||
            (typeof msg.userId === 'string' ? msg.userId : null) ||
            msg.authorId?._id ||
            msg.authorId?.id ||
            (typeof msg.authorId === 'string' ? msg.authorId : null);
          const currIdStr = currentUserId ? String(currentUserId) : null;
          const msgUserIdStr = rawUserId ? String(rawUserId) : null;
          const isOwn = isOptimistic || (currIdStr && msgUserIdStr && currIdStr === msgUserIdStr);

          return (
            <MessageBubble
              key={msg._id || idx}
              msg={msg}
              isOwn={isOwn}
              conversionDisabled={readOnly}
              onConvert={(type) =>
                setConversionTarget({
                  type,
                  message: msg,
                })
              }
            />
          );
        })}
      </div>

      <div className="shrink-0 border-t border-slate-100 px-5 py-3 dark:border-white/[0.06]">
        {filePickerOpen ? (
          <ThreadProjectFilePicker
            projectId={projectId}
            disabled={sending}
            onClose={() =>
              setFilePickerOpen(false)
            }
            onSelect={(file) => {
              setLinkedFile(
                normalizeThreadFileReference(file)
              );
              setFilePickerOpen(false);
            }}
          />
        ) : null}

        {linkedFile ? (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50/70 px-3 py-2 dark:border-cyan-400/15 dark:bg-cyan-500/10">
            <FileText className="h-4 w-4 shrink-0 text-cyan-700 dark:text-cyan-200" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-slate-900 dark:text-white">
                {linkedFile.fileName}
              </p>

              <p className="text-[10px] font-semibold text-slate-500 dark:text-white/40">
                {formatThreadFileSize(
                  linkedFile.fileSize
                )}
              </p>
            </div>

            <button
              type="button"
              disabled={sending}
              onClick={() =>
                setLinkedFile(null)
              }
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-rose-600 disabled:opacity-50 dark:hover:bg-white/[0.08]"
              title="Remove File reference"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={sending || !projectId}
            onClick={() =>
              setFilePickerOpen(
                (current) => !current
              )
            }
            className={
              'grid h-10 w-10 shrink-0 place-items-center rounded-xl border disabled:cursor-not-allowed disabled:opacity-40 ' +
              (
                filePickerOpen || linkedFile
                  ? 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/45'
              )
            }
            title="Link project file"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <input
            type="text"
            value={newMsg}
            onChange={(event) =>
              setNewMsg(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey
              ) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              linkedFile
                ? 'Add a message to send this File...'
                : 'Add to this thread...'
            }
            maxLength={5000}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-white/30"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !newMsg.trim()}
            className="rounded-xl bg-violet-600 p-2.5 text-white shadow-sm hover:bg-violet-700 disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      {conversionTarget ? (
        <MessageConversionModal
          projectId={projectId}
          threadTitle={thread?.title}
          message={conversionTarget.message}
          conversionType={conversionTarget.type}
          onClose={() =>
            setConversionTarget(null)
          }
        />
      ) : null}

    </div>
  );
}

function MessageConversionModal({
  projectId,
  threadTitle,
  message,
  conversionType,
  onClose,
}) {
  const isMove =
    conversionType === 'move';

  const originalContent =
    String(message?.content || '').trim();

  const fileReferences =
    normalizeThreadFileReferences(
      message?.fileReferences
    );

  const [title, setTitle] =
    useState(() =>
      buildMessageConversionTitle(
        originalContent
      )
    );

  const [body, setBody] =
    useState(originalContent);

  const [submitting, setSubmitting] =
    useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (
      !projectId ||
      !cleanTitle ||
      !cleanBody ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);

    try {
      if (isMove) {
        const createdMove =
          await createTask(
            projectId,
            {
              title: cleanTitle,
              description: cleanBody,
              status: 'backlog',
            }
          );

        const taskId =
          getEntityId(createdMove);

        if (!taskId) {
          throw new Error(
            'Move was created but its ID was missing'
          );
        }

        for (const file of fileReferences) {
          await addTaskFileReference(
            taskId,
            file.fileId
          );
        }
      } else {
        await createAnnouncement(
          projectId,
          {
            title: cleanTitle,
            message: cleanBody,
            type: 'general',
            pinned: false,
            fileReferences: fileReferences.map(
              (file) => file.fileId
            ),
          }
        );
      }

      toast({
        title:
          isMove
            ? 'Move created from Team Room message'
            : 'Announcement created from Team Room message',
        variant: 'success',
      });

      onClose?.();
    } catch (error) {
      toast({
        title:
          error?.response?.data?.message ||
          error?.message ||
          (
            isMove
              ? 'Failed to create Move'
              : 'Failed to create Announcement'
          ),
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const Icon =
    isMove
      ? ListTodo
      : Megaphone;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!submitting) {
            onClose?.();
          }
        }}
        aria-label="Close conversion modal"
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.10] dark:bg-[#1f1f23]"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={
                'grid h-10 w-10 shrink-0 place-items-center rounded-xl ' +
                (
                  isMove
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200'
                    : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200'
                )
              }
            >
              <Icon className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {isMove
                  ? 'Convert to Move'
                  : 'Convert to Announcement'}
              </h2>

              <p className="truncate text-xs font-semibold text-slate-500 dark:text-white/40">
                From Team Room
                {threadTitle
                  ? ` · ${threadTitle}`
                  : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => onClose?.()}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-white/[0.06] dark:hover:text-white"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-white/40">
              Title
            </label>

            <input
              type="text"
              value={title}
              disabled={submitting}
              maxLength={500}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-white/40">
              {isMove
                ? 'Description'
                : 'Announcement message'}
            </label>

            <textarea
              value={body}
              disabled={submitting}
              maxLength={10000}
              rows={7}
              onChange={(event) =>
                setBody(event.target.value)
              }
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white"
            />
          </div>

          {fileReferences.length > 0 ? (
            <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 dark:border-cyan-400/15 dark:bg-cyan-500/10">
              <p className="flex items-center gap-2 text-xs font-black text-cyan-800 dark:text-cyan-200">
                <Link2 className="h-4 w-4" />

                {fileReferences.length}{' '}
                linked project File
                {fileReferences.length === 1
                  ? ''
                  : 's'}{' '}
                will be preserved
              </p>

              <div className="mt-2 space-y-1">
                {fileReferences.map(
                  (file) => (
                    <p
                      key={file.fileId}
                      className="truncate text-[11px] font-semibold text-cyan-700/80 dark:text-cyan-100/60"
                    >
                      {file.fileName}
                    </p>
                  )
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-5 py-4 dark:border-white/[0.06]">
          <button
            type="button"
            disabled={submitting}
            onClick={() => onClose?.()}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:bg-white/[0.06] dark:text-white/60 dark:hover:bg-white/[0.10]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              submitting ||
              !title.trim() ||
              !body.trim()
            }
            className={
              'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ' +
              (
                isMove
                  ? 'bg-violet-700 shadow-violet-500/20 hover:bg-violet-800'
                  : 'bg-cyan-700 shadow-cyan-500/20 hover:bg-cyan-800'
              )
            }
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}

            {submitting
              ? 'Creating...'
              : (
                  isMove
                    ? 'Create Move'
                    : 'Create Announcement'
                )}
          </button>
        </div>
      </form>
    </div>
  );
}

function CreateThreadModal({ projectId, members, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    return members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()));
  }, [members, memberSearch]);

  const toggleMember = (member) => {
    setSelectedMembers(prev => prev.find(m => m.id === member.id) ? prev.filter(m => m.id !== member.id) : [...prev, member]);
  };

  const handleCreate = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    try {
      const participantIds = selectedMembers.map(member => member.id);
      const created = await createThread({
        projectId,
        title: title.trim(),
        category,
        participantIds,
      });
      onCreated?.({
        ...created,
        selectedParticipants: selectedMembers,
      });
      onClose();
      toast({ title: 'Thread created', variant: 'success' });
    } catch (err) {
      toast({ title: err?.message || 'Failed', variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="team room-create-modal-card relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">New Thread</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06]">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">To</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5 p-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.05]">
              {selectedMembers.map(m => (
                <span key={m.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-medium">
                  <span className="relative h-4 w-4 overflow-hidden rounded-full bg-white/70 ring-1 ring-violet-200 dark:bg-white/[0.08] dark:ring-violet-400/20">
                    {m.avatarUrl ? (
                      <img
                        src={m.avatarUrl}
                        alt={m.name}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[8px] font-black">
                        {m.initials}
                      </span>
                    )}
                  </span>
                  {m.name}
                  <button onClick={() => toggleMember(m)}><X className="w-3 h-3" /></button>
                </span>
              ))}
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder={selectedMembers.length === 0 ? 'Search members...' : ''}
                className="flex-1 min-w-[100px] text-sm bg-transparent text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 outline-none"
              />
            </div>
            {members.length > 0 && (
              <div className="mt-2 max-h-[160px] overflow-y-auto rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1f1f23]">
                {filteredMembers.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-400">No members found</p>
                ) : filteredMembers.map(m => {
                  const sel = selectedMembers.some(s => s.id === m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleMember(m)}
                      className={
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ' +
                        (sel ? 'bg-violet-50 dark:bg-violet-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]')
                      }
                    >
                      <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm ring-2 ring-white dark:border-white/[0.10] dark:bg-white/[0.08] dark:ring-white/[0.04]">
                        {m.avatarUrl ? (
                          <img
                            src={m.avatarUrl}
                            alt={m.name}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                              const fallback = event.currentTarget.nextElementSibling;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}

                        <span
                          style={{ display: m.avatarUrl ? 'none' : 'flex' }}
                          className="absolute inset-0 items-center justify-center text-[11px] font-black text-slate-600 dark:text-white/70"
                        >
                          {m.initials}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{m.name}</p>

                        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5">
                          <span
                            className={
                              'rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                              (m.roleLabel === 'Owner'
                                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20'
                                : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-white/[0.06] dark:text-white/50 dark:ring-white/[0.08]')
                            }
                          >
                            {m.roleLabel || m.role}
                          </span>

                          {m.email ? (
                            <span className="truncate text-[10px] text-slate-400 dark:text-white/35">
                              {m.email}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {sel && <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">Thread Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Sprint Planning..."
              maxLength={100}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">Channel</label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {['general', 'planning', 'design', 'ops'].map(ch => (
                <button
                  key={ch}
                  onClick={() => setCategory(ch)}
                  className={
                    'px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all ' +
                    (category === ch
                      ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20'
                      : 'bg-white dark:bg-white/[0.03] text-slate-500 dark:text-white/40 border-slate-200 dark:border-white/[0.08]')
                  }
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!title.trim() || creating}
              className="team room-modal-create-button team room-force-purple flex-1 rounded-xl border border-violet-300 !bg-violet-700 px-5 py-3 text-sm font-black !text-white !opacity-100 shadow-[0_18px_40px_rgba(124,58,237,0.42)] ring-1 ring-white/40 transition-all hover:-translate-y-0.5 hover:!bg-violet-800 hover:shadow-[0_22px_50px_rgba(124,58,237,0.52)] disabled:!bg-violet-600 disabled:!text-white disabled:!opacity-95 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function formatThreadListDate(value) {
  if (!value) return "Recent";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recent";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getThreadTitle(thread) {
  return (
    thread?.title ||
    thread?.name ||
    thread?.subject ||
    thread?.topic ||
    "Untitled team room"
  );
}

function getThreadPreview(thread) {
  return (
    thread?.lastMessage ||
    thread?.preview ||
    thread?.description ||
    thread?.body ||
    "No thread activity yet"
  );
}

function getThreadCategory(thread) {
  return String(thread?.category || thread?.channel || "general");
}

function ThreadListItem({ thread, participants = [], active = false, onClick }) {
  const title = getThreadTitle(thread);
  const preview = getThreadPreview(thread);
  const category = getThreadCategory(thread);
  const participantCount = participants.length || Number(thread?.participantCount || thread?.participants?.length || 0);
  const replyCount = Number(thread?.replyCount || thread?.replies?.length || thread?.messages?.length || 0);
  const isPinned = Boolean(thread?.pinned || thread?.isPinned);
  const dateLabel = formatThreadListDate(thread?.updatedAt || thread?.lastActivityAt || thread?.createdAt);

  return (
    <button
      type="button"
      onClick={() => onClick?.(thread)}
      className={`
        group w-full text-left transition-all
        ${active ? "ring-2 ring-violet-400/25" : ""}
      `}
    >
      <div
        className={`
          relative overflow-hidden rounded-[1.35rem] p-3 transition-all
          ${
            active
              ? "bg-violet-50/90 dark:bg-violet-500/10"
              : "bg-white/70 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.07]"
          }
        `}
      >
        <div
          className={`
            absolute inset-y-3 left-0 w-1 rounded-r-full
            ${active ? "bg-gradient-to-b from-violet-500 to-cyan-400" : "bg-transparent group-hover:bg-violet-300"}
          `}
        />

        <div className="flex items-start justify-between gap-3 pl-2">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {isPinned ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                  Pinned
                </span>
              ) : null}

              <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                {category}
              </span>
            </div>

            <div className="truncate text-sm font-black text-slate-950 dark:text-white">
              {title}
            </div>

            <div className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500 dark:text-zinc-400">
              {preview}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-zinc-500">
              <span>{participantCount} member{participantCount === 1 ? "" : "s"}</span>
              <span>•</span>
              <span>{replyCount} repl{replyCount === 1 ? "y" : "ies"}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-zinc-500">
              {dateLabel}
            </span>

            {participants.length > 0 ? (
              <div className="flex max-w-[150px] items-center gap-2">
                <div className="flex -space-x-2">
                  {participants.slice(0, 3).map(participant => (
                    <ParticipantAvatar key={participant.id} participant={participant} />
                  ))}
                </div>
                <span
                  className={`truncate text-[11px] font-black ${
                    active
                      ? 'text-violet-700 dark:text-violet-200'
                      : 'text-slate-600 dark:text-zinc-300'
                  }`}
                  title={participants.map(participant => participant.name).join(', ')}
                >
                  {participants.map(participant => participant.name).join(', ')}
                </span>
              </div>
            ) : (
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black shadow-sm ${
                active
                  ? 'border-violet-200 bg-white text-violet-700 dark:border-violet-400/20 dark:bg-white/[0.08] dark:text-violet-200'
                  : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-400'
              }`}>
                {String(title).slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}


export default function ThreadsView({
  projectId,
  project,
  onOpenFullChat,
  readOnly = false,
  initialThreadId = "",
}) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeThread, setActiveThread] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const projectMembers = useMemo(() => extractMembers(project), [project]);

  // ⭐ ULTRA AGGRESSIVE USER ID EXTRACTION ⭐
  const currentUserId = useMemo(() => {
    try {
      const keys = ['user', 'auth_user', 'authUser', 'session'];
      for (const key of keys) {
        const val = localStorage.getItem(key);
        if (val) {
          const u = JSON.parse(val);
          if (u?.id) return String(u.id);
          if (u?._id) return String(u._id);
        }
      }

      const zustandKeys = ['auth-storage', 'user-storage'];
      for (const key of zustandKeys) {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          const u = parsed?.state?.user || parsed?.state;
          if (u?.id) return String(u.id);
          if (u?._id) return String(u._id);
        }
      }

      const tokenKeys = ['token', 'accessToken', 'access_token'];
      for (const key of tokenKeys) {
        const token = localStorage.getItem(key);
        if (token && token.split('.').length === 3) {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          if (decoded?.sub) return String(decoded.sub);
          if (decoded?.id) return String(decoded.id);
          if (decoded?._id) return String(decoded._id);
          if (decoded?.userId) return String(decoded.userId);
        }
      }
    } catch (err) {
      console.warn("Could not extract user ID", err);
    }
    return null;
  }, []);

  useEffect(() => {
    if (!projectId) return;

    let mounted = true;

    setLoading(true);

    getProjectThreads(projectId)
      .then((data) => {
        if (!mounted) return;

        setThreads(
          (
            Array.isArray(data)
              ? data
              : []
          ).map((thread) => ({
            ...thread,
            id:
              thread._id ||
              thread.id,
            title:
              thread.title ||
              'Untitled',
            lastMessage:
              thread.replyCount > 0
                ? 'Recent activity'
                : 'No thread activity yet',
            participantCount:
              thread.participants?.length ||
              0,
            replyCount:
              thread.replyCount ||
              0,
            category:
              thread.category ||
              'general',
          })),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [projectId]);

  // unified-project-search-navigation-v1
  useEffect(() => {
    const normalizedThreadId =
      String(initialThreadId || "");

    if (
      !normalizedThreadId ||
      threads.length === 0
    ) {
      return;
    }

    const matchingThread =
      threads.find(
        (thread) =>
          String(
            thread?._id ||
            thread?.id ||
            "",
          ) === normalizedThreadId,
      );

    if (!matchingThread) {
      return;
    }

    setActiveThread(
      (currentThread) => {
        const currentId =
          String(
            currentThread?._id ||
            currentThread?.id ||
            "",
          );

        return currentId === normalizedThreadId
          ? currentThread
          : matchingThread;
      },
    );
  }, [initialThreadId, threads]);

  const filtered = useMemo(() => threads.filter(t => {
    if (activeChannel !== 'all' && t.category !== activeChannel) return false;
    if (searchQuery) return t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  }), [threads, activeChannel, searchQuery]);

  const pinnedThreads = filtered.filter(t => t.isPinned);
  const regularThreads = filtered.filter(t => !t.isPinned);

  return (
    <section className="team room-visual-scope relative mx-auto max-w-[1600px] px-4 py-5 pb-10 sm:px-6 lg:px-10">
      <style className="team room-visual-strike-style">{`
        .team.room-visual-scope {
          --team room-purple: #7c3aed;
          --team room-violet: #8b5cf6;
          --team room-cyan: #22d3ee;
          --team room-emerald: #34d399;
        }

        .team.room-holo-shell {
          isolation: isolate;
          border-color: rgba(139, 92, 246, 0.28) !important;
          background:
            radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 32%),
            radial-gradient(circle at 84% 10%, rgba(34, 211, 238, 0.18), transparent 34%),
            linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.86)) !important;
          box-shadow:
            0 30px 90px rgba(15, 23, 42, 0.12),
            inset 0 1px 0 rgba(255,255,255,0.95) !important;
        }

        .dark .team.room-holo-shell {
          border-color: rgba(139, 92, 246, 0.24) !important;
          background:
            radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.16), transparent 34%),
            radial-gradient(circle at 88% 10%, rgba(34, 211, 238, 0.14), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94)) !important;
          box-shadow:
            0 32px 100px rgba(0,0,0,0.42),
            inset 0 1px 0 rgba(255,255,255,0.08) !important;
        }

        .team.room-command-orb {
          background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,243,255,0.92)) !important;
          box-shadow:
            0 16px 34px rgba(124, 58, 237, 0.18),
            0 0 0 8px rgba(139, 92, 246, 0.08) !important;
        }

        .dark .team.room-command-orb {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.22), rgba(34, 211, 238, 0.08)) !important;
          box-shadow:
            0 18px 40px rgba(0, 0, 0, 0.34),
            0 0 0 8px rgba(139, 92, 246, 0.12) !important;
        }

        .team.room-primary-button,
        .team.room-modal-create-button {
          opacity: 1 !important;
          color: #fff !important;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #06b6d4 100%) !important;
          border: 1px solid rgba(255,255,255,0.42) !important;
          box-shadow:
            0 16px 34px rgba(124, 58, 237, 0.34),
            inset 0 1px 0 rgba(255,255,255,0.34) !important;
        }

        .team.room-primary-button:hover:not(:disabled),
        .team.room-modal-create-button:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          filter: brightness(1.05) saturate(1.08) !important;
          box-shadow:
            0 20px 42px rgba(124, 58, 237, 0.44),
            0 0 0 5px rgba(139, 92, 246, 0.12),
            inset 0 1px 0 rgba(255,255,255,0.38) !important;
        }

        .team.room-primary-button *,
        .team.room-modal-create-button * {
          color: #fff !important;
          opacity: 1 !important;
        }

        .team.room-modal-create-button:disabled {
          opacity: 0.72 !important;
          cursor: not-allowed !important;
          background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%) !important;
        }

        .team.room-stat-card {
          position: relative;
          overflow: hidden;
          min-height: 112px;
          background:
            radial-gradient(circle at 18% 0%, rgba(255,255,255,0.92), transparent 34%),
            linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,250,252,0.62)) !important;
          box-shadow:
            0 16px 40px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.94) !important;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .team.room-stat-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 22px 54px rgba(15, 23, 42, 0.12),
            0 0 0 5px rgba(139, 92, 246, 0.06),
            inset 0 1px 0 rgba(255,255,255,0.98) !important;
        }

        .dark .team.room-stat-card {
          background:
            radial-gradient(circle at 18% 0%, rgba(255,255,255,0.10), transparent 36%),
            linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025)) !important;
          box-shadow:
            0 18px 50px rgba(0,0,0,0.28),
            inset 0 1px 0 rgba(255,255,255,0.08) !important;
        }

        .team.room-thread-stage {
          border-color: rgba(148, 163, 184, 0.38) !important;
          box-shadow:
            0 24px 70px rgba(15, 23, 42, 0.12),
            inset 0 1px 0 rgba(255,255,255,0.86) !important;
        }

        .team.room-thread-rail {
          background:
            linear-gradient(180deg, rgba(15,23,42,0.94), rgba(30,41,59,0.90)) !important;
          box-shadow: inset -1px 0 0 rgba(255,255,255,0.12) !important;
        }

        .team.room-thread-rail input {
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18) !important;
        }

        .team.room-thread-list-card {
          border-color: rgba(148, 163, 184, 0.28) !important;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.09) !important;
        }

        .team.room-thread-list-card:hover {
          box-shadow:
            0 18px 44px rgba(124, 58, 237, 0.16),
            0 0 0 4px rgba(139, 92, 246, 0.07) !important;
        }

        .team.room-conversation-canvas {
          background:
            radial-gradient(circle at 50% 28%, rgba(139, 92, 246, 0.12), transparent 26%),
            radial-gradient(circle at 88% 18%, rgba(34, 211, 238, 0.14), transparent 30%),
            linear-gradient(135deg, rgba(255,255,255,0.98), rgba(241,245,249,0.70)) !important;
        }

        .dark .team.room-conversation-canvas {
          background:
            radial-gradient(circle at 50% 28%, rgba(139, 92, 246, 0.12), transparent 28%),
            radial-gradient(circle at 88% 18%, rgba(34, 211, 238, 0.10), transparent 32%),
            linear-gradient(135deg, rgba(15,23,42,0.98), rgba(2,6,23,0.96)) !important;
        }

        .team.room-empty-orb {
          background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,243,255,0.94)) !important;
          box-shadow:
            0 18px 42px rgba(124, 58, 237, 0.18),
            0 0 0 10px rgba(139, 92, 246, 0.08) !important;
        }

        .dark .team.room-empty-orb {
          background: linear-gradient(135deg, rgba(139,92,246,0.20), rgba(34,211,238,0.08)) !important;
        }

        .team.room-create-modal-card {
          border-color: rgba(139, 92, 246, 0.28) !important;
          background:
            radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.14), transparent 32%),
            radial-gradient(circle at 88% 0%, rgba(34, 211, 238, 0.12), transparent 34%),
            rgba(255,255,255,0.98) !important;
          box-shadow: 0 30px 90px rgba(15, 23, 42, 0.24) !important;
        }

        .dark .team.room-create-modal-card {
          background:
            radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
            radial-gradient(circle at 88% 0%, rgba(34, 211, 238, 0.10), transparent 36%),
            rgba(17,17,19,0.98) !important;
          box-shadow: 0 34px 100px rgba(0,0,0,0.48) !important;
        }
      `}</style>

        <style className="team room-button-visibility-v3-style">
          {`
            .team.room-primary-button,
            .team.room-modal-create-button {
              position: relative !important;
              isolation: isolate !important;
              overflow: hidden !important;
              border: 1px solid rgba(216, 180, 254, 0.96) !important;
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
              box-shadow:
                0 18px 40px rgba(124, 58, 237, 0.42),
                0 0 0 1px rgba(255, 255, 255, 0.38) inset !important;
              opacity: 1 !important;
              filter: none !important;
              mix-blend-mode: normal !important;
            }

            .team.room-primary-button::before,
            .team.room-modal-create-button::before {
              content: "" !important;
              position: absolute !important;
              inset: 1px !important;
              z-index: -1 !important;
              border-radius: inherit !important;
              background:
                radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.42), transparent 34%),
                linear-gradient(135deg, rgba(255, 255, 255, 0.20), transparent 62%) !important;
              pointer-events: none !important;
            }

            .team.room-primary-button,
            .team.room-primary-button *,
            .team.room-primary-button span,
            .team.room-primary-button svg,
            .team.room-modal-create-button,
            .team.room-modal-create-button *,
            .team.room-modal-create-button span,
            .team.room-modal-create-button svg {
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
              opacity: 1 !important;
              filter: none !important;
              mix-blend-mode: normal !important;
              text-shadow: 0 1px 8px rgba(15, 23, 42, 0.32) !important;
            }

            .team.room-primary-button:hover:not(:disabled),
            .team.room-modal-create-button:hover:not(:disabled) {
              background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
              box-shadow:
                0 22px 48px rgba(124, 58, 237, 0.52),
                0 0 0 1px rgba(255, 255, 255, 0.44) inset !important;
              transform: translateY(-1px) !important;
            }

            .team.room-primary-button:disabled,
            .team.room-modal-create-button:disabled {
              background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%) !important;
              border-color: rgba(221, 214, 254, 0.98) !important;
              opacity: 0.92 !important;
              cursor: not-allowed !important;
              box-shadow:
                0 14px 32px rgba(124, 58, 237, 0.30),
                0 0 0 1px rgba(255, 255, 255, 0.36) inset !important;
            }

            .team.room-primary-button:disabled *,
            .team.room-modal-create-button:disabled * {
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
              opacity: 1 !important;
              text-shadow: 0 1px 8px rgba(15, 23, 42, 0.28) !important;
            }
        /* FINAL visibility override: Team Room buttons only */
        .team.room-primary-button,
        .team.room-modal-create-button {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
          color: #ffffff !important;
          opacity: 1 !important;
          border: 1px solid rgba(196, 181, 253, 0.95) !important;
          box-shadow:
            0 18px 42px rgba(124, 58, 237, 0.42),
            inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
          text-shadow: 0 1px 2px rgba(15, 23, 42, 0.35) !important;
          filter: none !important;
          mix-blend-mode: normal !important;
          backdrop-filter: none !important;
        }

        .team.room-primary-button *,
        .team.room-primary-button span,
        .team.room-primary-button svg,
        .team.room-modal-create-button *,
        .team.room-modal-create-button span,
        .team.room-modal-create-button svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
          fill: none;
          opacity: 1 !important;
          filter: none !important;
          mix-blend-mode: normal !important;
        }

        .team.room-primary-button:hover:not(:disabled),
        .team.room-modal-create-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
          box-shadow:
            0 22px 54px rgba(124, 58, 237, 0.52),
            inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;
          transform: translateY(-1px);
        }

        .team.room-primary-button:disabled,
        .team.room-modal-create-button:disabled {
          background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 48%, #7c3aed 100%) !important;
          color: #ffffff !important;
          opacity: 0.92 !important;
          cursor: not-allowed !important;
          box-shadow:
            0 14px 34px rgba(124, 58, 237, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
        }

        .team.room-primary-button:disabled *,
        .team.room-primary-button:disabled span,
        .team.room-primary-button:disabled svg,
        .team.room-modal-create-button:disabled *,
        .team.room-modal-create-button:disabled span,
        .team.room-modal-create-button:disabled svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
          opacity: 1 !important;
        }
          

        /* team room-buttons-hard-final-css */
        button.team.room-primary-button,
        button.team.room-modal-create-button,
        .team.room-primary-button,
        .team.room-modal-create-button {
          position: relative !important;
          isolation: isolate !important;
          background-color: #7c3aed !important;
          background-image: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          opacity: 1 !important;
          visibility: visible !important;
          border: 1px solid rgba(221, 214, 254, 0.98) !important;
          box-shadow:
            0 18px 44px rgba(124, 58, 237, 0.46),
            0 0 0 1px rgba(255, 255, 255, 0.28) inset,
            inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;
          text-shadow: 0 1px 2px rgba(15, 23, 42, 0.42) !important;
          filter: none !important;
          mix-blend-mode: normal !important;
          backdrop-filter: none !important;
          transform: translateZ(0) !important;
        }

        button.team.room-primary-button::before,
        button.team.room-primary-button::after,
        button.team.room-modal-create-button::before,
        button.team.room-modal-create-button::after,
        .team.room-primary-button::before,
        .team.room-primary-button::after,
        .team.room-modal-create-button::before,
        .team.room-modal-create-button::after {
          content: none !important;
          display: none !important;
          opacity: 0 !important;
        }

        button.team.room-primary-button *,
        button.team.room-modal-create-button *,
        .team.room-primary-button *,
        .team.room-modal-create-button *,
        .team.room-primary-button span,
        .team.room-modal-create-button span,
        .team.room-primary-button svg,
        .team.room-modal-create-button svg {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          opacity: 1 !important;
          stroke: currentColor !important;
          filter: none !important;
          mix-blend-mode: normal !important;
        }

        button.team.room-primary-button:disabled,
        button.team.room-modal-create-button:disabled,
        .team.room-primary-button:disabled,
        .team.room-modal-create-button:disabled,
        .team.room-primary-button[disabled],
        .team.room-modal-create-button[disabled] {
          background-color: #7c3aed !important;
          background-image: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 45%, #7c3aed 100%) !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          opacity: 1 !important;
          border-color: rgba(221, 214, 254, 1) !important;
          box-shadow:
            0 14px 34px rgba(124, 58, 237, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;
          cursor: not-allowed !important;
        }

        button.team.room-primary-button:hover:not(:disabled),
        button.team.room-modal-create-button:hover:not(:disabled),
        .team.room-primary-button:hover:not(:disabled),
        .team.room-modal-create-button:hover:not(:disabled) {
          background-color: #6d28d9 !important;
          background-image: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%) !important;
          box-shadow:
            0 22px 52px rgba(124, 58, 237, 0.54),
            0 0 0 1px rgba(255, 255, 255, 0.34) inset,
            inset 0 1px 0 rgba(255, 255, 255, 0.42) !important;
        }

`}
        </style>


      
        <style className="team-room-clean-workspace-style">
          {`
            /*
              Team Room clean workspace:
              - Removes gray slab behind the header/subtitle
              - Removes the floating transparent box
              - Keeps the thread list readable
              - Keeps the conversation area clean and intentional
            */

            :where(.room-holo-shell, .team-room-holo-shell, [class*="room-holo-shell"]) {
              background:
                radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.11), transparent 30%),
                radial-gradient(circle at 92% 8%, rgba(34, 211, 238, 0.12), transparent 34%),
                radial-gradient(circle at 78% 100%, rgba(16, 185, 129, 0.07), transparent 36%),
                linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.88)) !important;
              border-color: rgba(203, 213, 225, 0.72) !important;
              box-shadow:
                0 24px 72px rgba(15, 23, 42, 0.10),
                inset 0 1px 0 rgba(255, 255, 255, 0.88) !important;
            }

            :where(.room-holo-shell, .team-room-holo-shell, [class*="room-holo-shell"])
            :where(.room-thread-stage, .team-room-thread-stage, [class*="thread-stage"]) {
              background:
                linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.72)) !important;
              border-color: rgba(203, 213, 225, 0.78) !important;
              box-shadow:
                0 18px 54px rgba(15, 23, 42, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.88) !important;
            }

            :where(.room-holo-shell, .team-room-holo-shell, [class*="room-holo-shell"])
            :where(.room-thread-rail, .team-room-thread-rail, [class*="thread-rail"]) {
              background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94)) !important;
              opacity: 1 !important;
              border-color: rgba(203, 213, 225, 0.82) !important;
              box-shadow:
                inset -1px 0 0 rgba(148, 163, 184, 0.18),
                10px 0 28px rgba(15, 23, 42, 0.04) !important;
            }

            :where(.room-holo-shell, .team-room-holo-shell, [class*="room-holo-shell"])
            :where(.room-conversation-canvas, .team-room-conversation-canvas, [class*="conversation-canvas"]) {
              background:
                radial-gradient(circle at 52% 24%, rgba(139, 92, 246, 0.08), transparent 32%),
                radial-gradient(circle at 86% 18%, rgba(34, 211, 238, 0.10), transparent 34%),
                linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.86)) !important;
              opacity: 1 !important;
            }

            /*
              This removes the random floating transparent box.
            */
            :where(.room-holo-shell, .team-room-holo-shell, [class*="room-holo-shell"])
            :where(.room-conversation-canvas, .team-room-conversation-canvas, [class*="conversation-canvas"])::before {
              content: none !important;
              display: none !important;
            }

            :where(.room-holo-shell, .team-room-holo-shell, [class*="room-holo-shell"])
            :where(.room-thread-list-card, .team-room-thread-list-card, [class*="thread-list-card"]) {
              background: rgba(255, 255, 255, 0.96) !important;
              opacity: 1 !important;
              border-color: rgba(203, 213, 225, 0.80) !important;
              box-shadow:
                0 12px 30px rgba(15, 23, 42, 0.07),
                inset 0 1px 0 rgba(255, 255, 255, 0.90) !important;
            }

            :where(.room-holo-shell, .team-room-holo-shell, [class*="room-holo-shell"])
            input {
              background: rgba(255, 255, 255, 0.98) !important;
              color: rgb(30, 41, 59) !important;
              border-color: rgba(203, 213, 225, 0.86) !important;
            }

            .dark :where(.room-holo-shell, .team-room-holo-shell, [class*="room-holo-shell"]) {
              background:
                radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.15), transparent 32%),
                radial-gradient(circle at 92% 8%, rgba(34, 211, 238, 0.12), transparent 34%),
                linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94)) !important;
              border-color: rgba(255, 255, 255, 0.08) !important;
            }

            .dark :where(.room-holo-shell, .team-room-holo-shell, [class*="room-holo-shell"])
            :where(.room-thread-stage, .team-room-thread-stage, [class*="thread-stage"]),
            .dark :where(.room-holo-shell, .team-room-holo-shell, [class*="room-holo-shell"])
            :where(.room-thread-rail, .team-room-thread-rail, [class*="thread-rail"]),
            .dark :where(.room-holo-shell, .team-room-holo-shell, [class*="room-holo-shell"])
            :where(.room-conversation-canvas, .team-room-conversation-canvas, [class*="conversation-canvas"]) {
              background:
                linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.92)) !important;
              border-color: rgba(255, 255, 255, 0.08) !important;
            }
          `}
        </style>


      
        <style className="team-room-readability-final-v1">
          {`
            /* team-room-readability-final-v1 */

            .team-room-readable-v1.room-holo-shell {
              isolation: isolate;
            }

            .team-room-readable-v1 .room-primary-button,
            .team-room-readable-v1 .room-modal-create-button {
              background-color: #7c3aed !important;
              background-image: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
              opacity: 1 !important;
              border-color: rgba(221, 214, 254, 0.96) !important;
              box-shadow:
                0 18px 44px rgba(124, 58, 237, 0.42),
                inset 0 1px 0 rgba(255, 255, 255, 0.36) !important;
            }

            .team-room-readable-v1 .room-primary-button *,
            .team-room-readable-v1 .room-modal-create-button * {
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
              opacity: 1 !important;
              stroke: currentColor !important;
            }

            .team-room-readable-v1 .room-stat-card {
              opacity: 1 !important;
              color: rgb(15, 23, 42) !important;
            }

            .team-room-readable-v1 .room-stat-card > div:last-child {
              color: rgb(15, 23, 42) !important;
              -webkit-text-fill-color: rgb(15, 23, 42) !important;
            }

            .dark .team-room-readable-v1 .room-stat-card {
              background:
                radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.10), transparent 38%),
                linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.72)) !important;
              border-color: rgba(255, 255, 255, 0.13) !important;
              box-shadow:
                0 18px 52px rgba(0, 0, 0, 0.28),
                inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
            }

            .dark .team-room-readable-v1 .room-stat-card > div:first-child {
              color: rgba(221, 214, 254, 0.92) !important;
              -webkit-text-fill-color: rgba(221, 214, 254, 0.92) !important;
            }

            .dark .team-room-readable-v1 .room-stat-card > div:last-child {
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
            }

            .dark .team-room-readable-v1 .room-thread-list-card {
              background:
                linear-gradient(135deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.72)) !important;
              border-color: rgba(255, 255, 255, 0.12) !important;
              box-shadow:
                0 16px 38px rgba(0, 0, 0, 0.24),
                inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
            }

            .dark .team-room-readable-v1 .room-thread-list-card > div {
              background: rgba(15, 23, 42, 0.92) !important;
            }

            .dark .team-room-readable-v1 .room-thread-list-card button {
              background: transparent !important;
            }

            .dark .team-room-readable-v1 .room-thread-list-card button:hover {
              background: rgba(255, 255, 255, 0.055) !important;
            }

            .dark .team-room-readable-v1 .room-thread-list-card span,
            .dark .team-room-readable-v1 .room-thread-list-card p {
              color: rgba(226, 232, 240, 0.82) !important;
              -webkit-text-fill-color: rgba(226, 232, 240, 0.82) !important;
            }

            .dark .team-room-readable-v1 .room-thread-list-card [class*="text-slate-800"],
            .dark .team-room-readable-v1 .room-thread-list-card [class*="text-slate-900"],
            .dark .team-room-readable-v1 .room-thread-list-card [class*="dark:text-white"] {
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
            }

            .dark .team-room-readable-v1 .room-thread-rail input {
              background: rgba(15, 23, 42, 0.82) !important;
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
              border-color: rgba(255, 255, 255, 0.13) !important;
              box-shadow: 0 14px 32px rgba(0, 0, 0, 0.22) !important;
            }

            .dark .team-room-readable-v1 .room-thread-rail input::placeholder {
              color: rgba(203, 213, 225, 0.64) !important;
              -webkit-text-fill-color: rgba(203, 213, 225, 0.64) !important;
            }

            .dark .team-room-readable-v1 .room-conversation-canvas {
              background:
                radial-gradient(circle at 50% 24%, rgba(139, 92, 246, 0.10), transparent 34%),
                linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.94)) !important;
            }

            .dark .team-room-readable-v1 .room-empty-orb {
              background: rgba(139, 92, 246, 0.14) !important;
              border-color: rgba(196, 181, 253, 0.22) !important;
            }
          `}
        </style>

<div className="team team-room-readable-v1 room-holo-shell relative overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111113]/90 dark:shadow-black/30">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10" />
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:44px_44px] opacity-60 dark:opacity-20" />

        <div className="relative p-4 sm:p-5 lg:p-6">
          {/* Header */}
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="team room-command-orb relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl border border-violet-200 bg-white text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-300">
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
                <MessageCircle className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                    Team Room
                  </h2>

                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                    Signal Room
                  </span>

                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200">
                    Team Threads
                  </span>
                </div>

                <p className="max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-zinc-400">
                  Centralize decisions, questions, and project context so the team can move from one shared room.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-200">
                {threads.length} thread{threads.length === 1 ? '' : 's'}
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                {projectMembers.length} member{projectMembers.length === 1 ? '' : 's'}
              </div>

              <button
                onClick={() => !readOnly && setShowCreate(true)}
                className="team room-primary-button team room-force-purple inline-flex items-center gap-2 rounded-2xl border border-violet-300 !bg-violet-700 px-5 py-2.5 text-sm font-black !text-white !opacity-100 shadow-[0_18px_40px_rgba(124,58,237,0.42)] ring-1 ring-white/40 transition-all hover:-translate-y-0.5 hover:!bg-violet-800 hover:shadow-[0_22px_50px_rgba(124,58,237,0.52)] disabled:!bg-violet-600 disabled:!text-white disabled:!opacity-95 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                <span>New Thread</span>
              </button>
            </div>
          </div>

          {/* Signal stats */}
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="team room-stat-card rounded-3xl border border-violet-200 bg-violet-50/80 p-3 shadow-sm dark:border-violet-400/20 dark:bg-violet-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
                Threads
              </div>
              <div className="mt-1.5 text-2xl font-black text-slate-950 dark:text-white">
                {threads.length}
              </div>
            </div>

            <div className="team room-stat-card rounded-3xl border border-amber-200 bg-amber-50/80 p-3 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-200">
                Pinned
              </div>
              <div className="mt-1.5 text-2xl font-black text-slate-950 dark:text-white">
                {pinnedThreads.length}
              </div>
            </div>

            <div className="team room-stat-card rounded-3xl border border-cyan-200 bg-cyan-50/80 p-3 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-200">
                Visible
              </div>
              <div className="mt-1.5 text-2xl font-black text-slate-950 dark:text-white">
                {filtered.length}
              </div>
            </div>

            <div className="team room-stat-card rounded-3xl border border-emerald-200 bg-emerald-50/80 p-3 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-200">
                Members
              </div>
              <div className="mt-1.5 text-2xl font-black text-slate-950 dark:text-white">
                {projectMembers.length}
              </div>
            </div>
          </div>

          {/* Main team room shell */}
          <div className="team room-thread-stage grid h-[68vh] min-h-[520px] max-h-[720px] overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-black/30 lg:grid-cols-[340px_1fr]">
            {/* Thread rail */}
            <aside
              className={
                'team room-thread-rail min-h-0 border-r border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#101014]/80 ' +
                (activeThread ? 'hidden lg:flex lg:flex-col' : 'flex flex-col')
              }
            >
              <div className="shrink-0 border-b border-slate-200/80 p-3 dark:border-white/[0.08]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search team threads..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-violet-400/30"
                  />
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {CHANNELS.map((channel) => {
                    const active = activeChannel === channel.id;
                    const count =
                      channel.id === 'all'
                        ? threads.length
                        : threads.filter((thread) => thread.category === channel.id).length;

                    return (
                      <button
                        key={channel.id}
                        onClick={() => setActiveChannel(channel.id)}
                        className={
                          'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-black transition-all ' +
                          (active
                            ? 'border-violet-200 bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-200/70 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:bg-white/[0.08]')
                        }
                      >
                        <span>{channel.label}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-white/[0.08] dark:text-zinc-400">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 [scrollbar-gutter:stable]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">
                      Loading team rooms...
                    </p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 p-8 text-center dark:border-white/[0.08] dark:bg-white/[0.04]">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-black text-slate-800 dark:text-white">
                      No team threads found
                    </p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-zinc-400">
                      Start a new thread or adjust your filter.
                    </p>
                    <button
                      onClick={() => !readOnly && setShowCreate(true)}
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:bg-violet-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Start thread
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pinnedThreads.length > 0 && (
                      <div className="flex items-center gap-2 px-2 pt-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
                        <Pin className="h-3.5 w-3.5" />
                        Pinned team rooms
                      </div>
                    )}

                    {pinnedThreads.map((thread) => (
                      <div
                        key={thread._id || thread.id}
                        className="team room-thread-list-card rounded-[1.4rem] bg-gradient-to-br from-amber-400/30 via-violet-400/20 to-cyan-400/20 p-[1px] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div className="rounded-[1.35rem] bg-white/95 dark:bg-[#111113]/95">
                          <ThreadListItem
                            thread={thread}
                            participants={getThreadParticipants(thread, projectMembers, currentUserId)}
                            active={(activeThread?._id || activeThread?.id) === (thread._id || thread.id)}
                            onClick={setActiveThread}
                          />
                        </div>
                      </div>
                    ))}

                    {pinnedThreads.length > 0 && regularThreads.length > 0 && (
                      <div className="px-2 pt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                        Recent threads
                      </div>
                    )}

                    {regularThreads.map((thread) => (
                      <div
                        key={thread._id || thread.id}
                        className="team room-thread-list-card rounded-[1.4rem] border border-slate-200/80 bg-white/80 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-violet-400/20"
                      >
                        <ThreadListItem
                          thread={thread}
                          participants={getThreadParticipants(thread, projectMembers, currentUserId)}
                          active={(activeThread?._id || activeThread?.id) === (thread._id || thread.id)}
                          onClick={setActiveThread}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* Conversation stage */}
            <main className={'team room-conversation-canvas min-h-0 min-w-0 flex-1 flex-col bg-gradient-to-br from-white via-slate-50/50 to-cyan-50/40 dark:from-[#0f0f13] dark:via-[#111116] dark:to-cyan-950/10 ' + (!activeThread ? 'hidden lg:flex' : 'flex')}>
              {activeThread ? (
                <div className="flex h-full min-h-0 flex-col">
                  <ConversationPanel
                    projectId={projectId}
                    thread={activeThread}
                    currentUserId={currentUserId}
                    participants={getThreadParticipants(activeThread, projectMembers, currentUserId)}
                    readOnly={readOnly}
                    onBack={() => setActiveThread(null)}
                  />
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-1 items-center justify-center p-6">
                  <div className="max-w-md text-center">
                    <div className="team room-empty-orb mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-violet-200 bg-violet-50 text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                      <MessageCircle className="h-9 w-9" />
                    </div>

                    <div className="mb-2 flex justify-center gap-2">
                      <span className="rounded-full border border-violet-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-200">
                        Select Thread
                      </span>
                      <span className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-400/20 dark:bg-white/[0.06] dark:text-cyan-200">
                        Project Context
                      </span>
                    </div>

                    <h3 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                      Select a thread
                    </h3>

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-zinc-400">
                      Choose a project thread from the left, or start a new thread to capture decisions, blockers, and questions in one place.
                    </p>

                    <button
                      onClick={() => !readOnly && setShowCreate(true)}
                      className="team room-primary-button team room-force-purple mt-6 inline-flex items-center gap-2 rounded-2xl border border-violet-300 !bg-violet-700 px-5 py-3 text-sm font-black !text-white !opacity-100 shadow-[0_18px_40px_rgba(124,58,237,0.42)] ring-1 ring-white/40 transition-all hover:-translate-y-0.5 hover:!bg-violet-800 hover:shadow-[0_22px_50px_rgba(124,58,237,0.52)] disabled:!bg-violet-600 disabled:!text-white disabled:!opacity-95 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                      Start New Thread
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {!readOnly && showCreate && (
        <CreateThreadModal
          projectId={projectId}
          members={projectMembers}
          onClose={() => setShowCreate(false)}
          onCreated={(thread) => {
            const createdThread = {
              ...thread,
              id: thread?._id || thread?.id,
              category: thread?.category || 'general',
              participantCount:
                thread?.participantCount ||
                thread?.participants?.length ||
                thread?.selectedParticipants?.length ||
                0,
              replyCount: thread?.replyCount || 0,
              lastMessage: thread?.lastMessage || 'No thread activity yet',
              createdAt: thread?.createdAt || new Date().toISOString(),
            };

            setThreads((previous) => [createdThread, ...previous]);
            setActiveThread(createdThread);
            setShowCreate(false);
          }}
        />
      )}
    </section>
  );
}
