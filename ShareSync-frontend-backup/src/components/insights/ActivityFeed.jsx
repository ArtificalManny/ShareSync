// src/components/insights/ActivityFeed.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY FEED — Real-time list of all project member activity
// ✅ Uses client directly → GET /projects/:projectId/activity
// ✅ Hits existing ActivitiesController (projects/:projectId/activity)
// ✅ Supports both canonical (TASK_CREATED) and legacy (task_created) types
// ✅ Auto-refreshes every 30 seconds
// ✅ Falls back to task history if activity endpoint returns empty
// ✅ Normalizes actor names + avatars so Insights matches Overview Live Activity
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity, CheckCircle2, Circle, Clock, Flag, Loader2,
  Plus, RefreshCw, ArrowRight, FileText, MessageSquare,
  UserPlus, Zap, Send,
} from 'lucide-react';
import client from '../../api/client';

// ─── Activity type → display config ────────────────────────────────────────

const ACTIVITY_CONFIG = {
  'TASK_CREATED':    { icon: Plus,         label: 'created',              color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-500/15', dot: 'bg-violet-500' },
  'TASK_UPDATED':    { icon: ArrowRight,   label: 'updated',              color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-100 dark:bg-blue-500/15',     dot: 'bg-blue-500' },
  'TASK_MOVED':      { icon: ArrowRight,   label: 'moved',                color: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-100 dark:bg-cyan-500/15',     dot: 'bg-cyan-500' },
  'TASK_COMPLETED':  { icon: CheckCircle2, label: 'completed',            color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/15', dot: 'bg-emerald-500' },
  'TASK_DELETED':    { icon: Circle,       label: 'deleted',              color: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-100 dark:bg-rose-500/15',     dot: 'bg-rose-500' },
  'task_created':    { icon: Plus,         label: 'created',              color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-500/15', dot: 'bg-violet-500' },
  'task_completed':  { icon: CheckCircle2, label: 'completed',            color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/15', dot: 'bg-emerald-500' },
  'task_deleted':    { icon: Circle,       label: 'deleted',              color: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-100 dark:bg-rose-500/15',     dot: 'bg-rose-500' },
  'file_uploaded':   { icon: FileText,     label: 'uploaded',             color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-100 dark:bg-amber-500/15',   dot: 'bg-amber-500' },
  'file_deleted':    { icon: FileText,     label: 'deleted',              color: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-100 dark:bg-rose-500/15',     dot: 'bg-rose-500' },
  'message_sent':    { icon: MessageSquare, label: 'sent',                color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-100 dark:bg-blue-500/15',     dot: 'bg-blue-500' },
  'member_added':    { icon: UserPlus,     label: 'added',                color: 'text-teal-600 dark:text-teal-400',     bg: 'bg-teal-100 dark:bg-teal-500/15',     dot: 'bg-teal-500' },
  'member_removed':  { icon: UserPlus,     label: 'removed',              color: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-100 dark:bg-rose-500/15',     dot: 'bg-rose-500' },
  'announcement_created': { icon: Send,    label: 'posted',               color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-500/15', dot: 'bg-violet-500' },
  'project_shipped': { icon: Zap,          label: 'shipped',              color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-100 dark:bg-amber-500/15',   dot: 'bg-amber-500' },
  'comment_added':   { icon: MessageSquare, label: 'commented on',        color: 'text-slate-500 dark:text-white/50',    bg: 'bg-slate-100 dark:bg-white/10',       dot: 'bg-slate-400' },
  'task.mutation':   { icon: ArrowRight,   label: 'modified',             color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-100 dark:bg-blue-500/15',     dot: 'bg-blue-500' },
  'debug.test':      { icon: Zap,          label: 'ran',                  color: 'text-slate-500 dark:text-white/50',    bg: 'bg-slate-100 dark:bg-white/10',       dot: 'bg-slate-400' },
  // ✅ in_progress type for task fallback
  'task_in_progress': { icon: ArrowRight,  label: 'started working on',   color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-100 dark:bg-blue-500/15',     dot: 'bg-blue-500' },
};

const DEFAULT_CONFIG = {
  icon: Circle, label: 'did',
  color: 'text-slate-500 dark:text-white/50',
  bg: 'bg-slate-100 dark:bg-white/10',
  dot: 'bg-slate-400',
};

const GENERIC_ACTOR_NAMES = new Set([
  'team member',
  'project member',
  'someone',
  'unknown',
  'unknown user',
  'user',
  'member',
]);

const LOCAL_USER_KEYS = [
  'ss.user',
  'sharesync.user',
  'openshare.user',
  'auth.user',
  'authUser',
  'currentUser',
  'user',
];

let cachedCurrentUser = null;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function isGenericActorName(name) {
  const value = cleanString(name).toLowerCase();
  return !value || GENERIC_ACTOR_NAMES.has(value);
}

function joinName(firstName, lastName) {
  return [cleanString(firstName), cleanString(lastName)].filter(Boolean).join(' ').trim();
}

function getApiAssetBase() {
  const configuredBase =
    client?.defaults?.baseURL ||
    import.meta?.env?.VITE_API_URL ||
    import.meta?.env?.VITE_BACKEND_URL ||
    '';

  if (!configuredBase) return '';

  return configuredBase
    .replace(/\/api\/?$/i, '')
    .replace(/\/$/, '');
}

function normalizeAvatarSrc(src) {
  const value = cleanString(src);
  if (!value) return '';

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return value;
  }

  if (value.startsWith('//')) {
    return `${window?.location?.protocol || 'https:'}${value}`;
  }

  if (value.startsWith('/')) {
    const base = getApiAssetBase();
    return base ? `${base}${value}` : value;
  }

  return value;
}

function unwrapMaybeUserPayload(value) {
  if (!isObject(value)) return value;

  if (isObject(value.user)) return value.user;
  if (isObject(value.actor)) return value.actor;
  if (isObject(value.profile)) return value.profile;
  if (isObject(value.data?.user)) return value.data.user;
  if (isObject(value.data?.profile)) return value.data.profile;
  if (isObject(value.data)) return value.data;

  return value;
}

function getDisplayNameFromUserLike(userLike) {
  const user = unwrapMaybeUserPayload(userLike);
  if (!isObject(user)) return '';

  const direct =
    cleanString(user.displayName) ||
    cleanString(user.fullName) ||
    cleanString(user.name) ||
    cleanString(user.profileName);

  if (direct && !isGenericActorName(direct)) return direct;

  const joined = joinName(user.firstName, user.lastName);
  if (joined && !isGenericActorName(joined)) return joined;

  const username = cleanString(user.username) || cleanString(user.handle);
  if (username && !isGenericActorName(username)) return username;

  const email = cleanString(user.email);
  if (email && email.includes('@')) return email.split('@')[0];

  return '';
}

function getAvatarFromUserLike(userLike) {
  const user = unwrapMaybeUserPayload(userLike);
  if (!isObject(user)) return '';

  const avatar =
    cleanString(user.profilePicture) ||
    cleanString(user.profileImage) ||
    cleanString(user.avatarUrl) ||
    cleanString(user.avatarURL) ||
    cleanString(user.avatar) ||
    cleanString(user.photoURL) ||
    cleanString(user.photoUrl) ||
    cleanString(user.imageUrl) ||
    cleanString(user.picture);

  return normalizeAvatarSrc(avatar);
}

function getInitials(name) {
  const cleaned = cleanString(name);
  if (!cleaned) return 'PM';

  const parts = cleaned
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function readLocalUserSnapshot() {
  if (typeof window === 'undefined') return null;

  for (const key of LOCAL_USER_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const user = unwrapMaybeUserPayload(parsed);
      const name = getDisplayNameFromUserLike(user);
      const avatarUrl = getAvatarFromUserLike(user);

      if (name || avatarUrl) {
        return {
          ...user,
          name: name || user?.name || user?.username || '',
          displayName: name || user?.displayName || user?.name || '',
          avatarUrl,
          profilePicture: avatarUrl,
          profileImage: avatarUrl,
        };
      }
    } catch {
      // Keep trying other localStorage keys.
    }
  }

  return null;
}

async function fetchCurrentUserSnapshot() {
  if (cachedCurrentUser) return cachedCurrentUser;

  const localUser = readLocalUserSnapshot();
  if (localUser) {
    cachedCurrentUser = localUser;
    return cachedCurrentUser;
  }

  const candidateEndpoints = ['/users/me', '/auth/me', '/users/profile'];

  for (const endpoint of candidateEndpoints) {
    try {
      const response = await client.get(endpoint);
      const raw = response?.data?.data?.user || response?.data?.user || response?.data?.data || response?.data;
      const user = unwrapMaybeUserPayload(raw);
      const name = getDisplayNameFromUserLike(user);
      const avatarUrl = getAvatarFromUserLike(user);

      if (name || avatarUrl) {
        cachedCurrentUser = {
          ...user,
          name: name || user?.name || user?.username || '',
          displayName: name || user?.displayName || user?.name || '',
          avatarUrl,
          profilePicture: avatarUrl,
          profileImage: avatarUrl,
        };
        return cachedCurrentUser;
      }
    } catch {
      // Endpoint may not exist in this branch. Try the next safe candidate.
    }
  }

  return null;
}

function getActorCandidateObjects(item) {
  if (!isObject(item)) return [];

  return [
    // INSIGHTS ACTIVITY POPULATED USERID BRIDGE
    // GET /projects/:projectId/activity returns populated actor data under userId.
    item.userId,
    item.actor,
    item.user,
    item.member,
    item.createdBy,
    item.updatedBy,
    item.completedBy,
    item.deletedBy,
    item.movedBy,
    item.performedBy,
    item.author,
    item.assignee,
    item.assignedTo,
    item.owner,
    item.payload?.actor,
    item.payload?.user,
    item.payload?.userId,
    item.payload?.createdBy,
    item.payload?.updatedBy,
    item.payload?.completedBy,
    item.metadata?.actor,
    item.metadata?.user,
    item.metadata?.userId,
    item.metadata?.createdBy,
    item.metadata?.updatedBy,
    item.metadata?.completedBy,
    item.details?.actor,
    item.details?.user,
    item.details?.userId,
  ].filter(Boolean);
}

function getActorName(item, fallbackActor = null) {
  const directCandidates = [
    item?.actorName,
    item?.userName,
    item?.username,
    item?.createdByName,
    item?.updatedByName,
    item?.completedByName,
    item?.performedByName,
    item?.payload?.actorName,
    item?.payload?.userName,
    item?.metadata?.actorName,
    item?.metadata?.userName,
    item?.details?.actorName,
    item?.details?.userName,
  ];

  for (const candidate of directCandidates) {
    const name = cleanString(candidate);
    if (name && !isGenericActorName(name)) return name;
  }

  for (const candidate of getActorCandidateObjects(item)) {
    const name = getDisplayNameFromUserLike(candidate);
    if (name && !isGenericActorName(name)) return name;
  }

  const fallbackName = getDisplayNameFromUserLike(fallbackActor);
  if (fallbackName && !isGenericActorName(fallbackName)) return fallbackName;

  return null;
}

function getActorAvatar(item, fallbackActor = null) {
  const directCandidates = [
    item?.actorAvatar,
    item?.avatarUrl,
    item?.avatarURL,
    item?.profilePicture,
    item?.profileImage,
    item?.avatar,
    item?.userAvatar,
    item?.createdByAvatar,
    item?.updatedByAvatar,
    item?.completedByAvatar,
    item?.payload?.actorAvatar,
    item?.payload?.avatarUrl,
    item?.payload?.profilePicture,
    item?.metadata?.actorAvatar,
    item?.metadata?.avatarUrl,
    item?.details?.actorAvatar,
    item?.details?.avatarUrl,
  ];

  for (const candidate of directCandidates) {
    const avatar = normalizeAvatarSrc(candidate);
    if (avatar) return avatar;
  }

  for (const candidate of getActorCandidateObjects(item)) {
    const avatar = getAvatarFromUserLike(candidate);
    if (avatar) return avatar;
  }

  return getAvatarFromUserLike(fallbackActor);
}

function getConfigForItem(item) {
  const typeKey = item?.type || item?.action || item?.kind || '';
  if (ACTIVITY_CONFIG[typeKey]) return ACTIVITY_CONFIG[typeKey];

  const lower = typeKey.toLowerCase().replace(/\./g, '_');

  if (ACTIVITY_CONFIG[lower]) return ACTIVITY_CONFIG[lower];
  if (lower.includes('created') || lower.includes('create')) return ACTIVITY_CONFIG['task_created'];
  if (lower.includes('completed') || lower.includes('complete')) return ACTIVITY_CONFIG['task_completed'];
  if (lower.includes('updated') || lower.includes('update')) return ACTIVITY_CONFIG['TASK_UPDATED'];
  if (lower.includes('moved') || lower.includes('move')) return ACTIVITY_CONFIG['TASK_MOVED'];
  if (lower.includes('file')) return ACTIVITY_CONFIG['file_uploaded'];
  if (lower.includes('message') || lower.includes('comment')) return ACTIVITY_CONFIG['comment_added'];

  return DEFAULT_CONFIG;
}

function looksLikeGenericActivitySentence(value) {
  const text = cleanString(value).toLowerCase();

  return (
    text.startsWith('team member ') ||
    text.startsWith('project member ') ||
    text.startsWith('someone ') ||
    text.includes(' completed a task') ||
    text.includes(' created a task') ||
    text.includes(' moved a task') ||
    text.includes(' updated a task')
  );
}

function getTitle(item) {
  const candidates = [
    item?.target,
    item?.taskTitle,
    item?.fileName,
    item?.announcementTitle,
    item?.metadata?.taskTitle,
    item?.metadata?.title,
    item?.details?.taskTitle,
    item?.details?.title,
    item?.payload?.title,
    item?.payload?.taskTitle,
    item?.payload?.snapshot?.title,
    item?.task?.title,
    item?.title,
    item?.message,
    item?.text,
    item?.details?.message,
  ];

  for (const candidate of candidates) {
    const title = cleanString(candidate);
    if (title && !looksLikeGenericActivitySentence(title)) return title;
  }

  const type = item?.type || item?.action || '';
  return type.replace(/[._]/g, ' ') || 'Activity';
}

function timeAgo(timestamp) {
  if (!timestamp) return '';

  const diff = Date.now() - new Date(timestamp).getTime();

  if (isNaN(diff) || diff < 0) return '';

  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;

  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildNormalizedActivityItem(item, fallbackActor = null) {
  // INSIGHTS ACTIVITY ACTOR SAFETY BRIDGE
  // Do not globally fall back to the current logged-in user for every row.
  // Only task-fallback items are allowed to use fallbackActor because real
  // activity endpoint rows should display their own actor, or no actor.
  const shouldUseFallbackActor = Boolean(item?.__useFallbackActor);
  const actorFallback = shouldUseFallbackActor ? fallbackActor : null;
  const actorName = getActorName(item, actorFallback);
  const actorAvatar = getActorAvatar(item, actorFallback);
  const title = getTitle(item);

  return {
    ...item,
    title,
    actorName,
    userName: actorName || item?.userName || null,
    actorAvatar,
    avatarUrl: actorAvatar || item?.avatarUrl || null,
    profilePicture: actorAvatar || item?.profilePicture || null,
    profileImage: actorAvatar || item?.profileImage || null,
  };
}

function normalizeActivityList(items, fallbackActor = null) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => buildNormalizedActivityItem(item, fallbackActor));
}

function ActivityAvatar({ item, config, fallbackActor }) {
  const Icon = config.icon;
  const actorFallback = Boolean(item?.__useFallbackActor) ? fallbackActor : null;
  const name = getActorName(item, actorFallback) || 'Project member';
  const avatar = getActorAvatar(item, actorFallback);
  const initials = getInitials(name);

  if (avatar) {
    return (
      <div className="relative w-9 h-9 rounded-full flex-shrink-0">
        <img
          src={avatar}
          alt={name}
          className="w-9 h-9 rounded-full object-cover border border-white shadow-sm dark:border-white/[0.08]"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${config.bg} border border-white dark:border-[#1f1f23] flex items-center justify-center`}>
          <Icon className={`w-2.5 h-2.5 ${config.color}`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-9 h-9 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 border border-white/70 dark:border-white/[0.06]`}>
      <span className={`text-[11px] font-bold ${config.color}`}>{initials}</span>
      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${config.bg} border border-white dark:border-[#1f1f23] flex items-center justify-center`}>
        <Icon className={`w-2.5 h-2.5 ${config.color}`} />
      </div>
    </div>
  );
}

function ActivityRow({ item, fallbackActor }) {
  const config = getConfigForItem(item);
  const actorFallback = Boolean(item?.__useFallbackActor) ? fallbackActor : null;
  const who = getActorName(item, actorFallback) || 'Project member';
  const title = getTitle(item);
  const ago = timeAgo(item?.createdAt || item?.timestamp || item?.updatedAt);

  return (
    <div className="insights-activity-row flex items-start gap-3 py-3 border-b border-slate-100 dark:border-white/[0.04] last:border-b-0 group">
      <div className="flex flex-col items-center mt-1">
        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
        <div className="w-px flex-1 bg-slate-200 dark:bg-white/[0.06] mt-1 min-h-[28px] group-last:hidden" />
      </div>

      <ActivityAvatar item={item} config={config} fallbackActor={actorFallback} />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 dark:text-white/80">
          <span className="font-semibold text-slate-900 dark:text-white">{who}</span>
          {' '}
          <span className="text-slate-500 dark:text-white/50">{config.label}</span>
          {' '}
          <span className="font-semibold text-slate-900 dark:text-white truncate">{title}</span>
        </p>
      </div>

      <span className="text-[11px] text-slate-400 dark:text-white/30 whitespace-nowrap flex-shrink-0 mt-0.5">
        {ago}
      </span>
    </div>
  );
}

// ─── Fetch helper that calls the CORRECT endpoint ───────────────────────────
// Uses client directly → GET /projects/:projectId/activity
// This avoids the double /api prefix bug in api/activity.js

async function fetchProjectActivity(projectId, limit = 50) {
  if (!projectId) return [];

  const response = await client.get(`/projects/${projectId}/activity`, {
    params: { limit },
  });

  const data = response.data;

  // Handle multiple response shapes from ActivitiesService.listProject()
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// FALLBACK: Build activity items from actual task data
// If the activities endpoint returns empty (no EventLog entries), we query
// the tasks collection directly and construct activity items from task records.
// This ensures users always see something meaningful in the feed.
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchTaskBasedActivity(projectId, limit = 50, fallbackActor = null) {
  if (!projectId) return [];

  try {
    const response = await client.get('/tasks', {
      params: {
        projectId,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        limit,
      },
    });

    const result = response.data?.data || response.data;
    const tasks = result?.tasks || (Array.isArray(result) ? result : []);

    if (!tasks.length) return [];

    // Convert tasks into activity-like items
    const items = [];

    for (const task of tasks) {
      const actorName = getActorName(task, fallbackActor);
      const actorAvatar = getActorAvatar(task, fallbackActor);
      const actor = task?.actor || task?.user || task?.completedBy || task?.updatedBy || task?.createdBy || fallbackActor || null;

      // If task is done and has completedAt, show completion event
      if (task.status === 'done' && task.completedAt) {
        items.push({
          _id: `${task._id || task.id}-completed`,
          __useFallbackActor: true,
          type: 'TASK_COMPLETED',
          title: task.title,
          target: task.title,
          createdAt: task.completedAt,
          timestamp: task.completedAt,
          actor,
          actorName,
          userName: actorName,
          actorAvatar,
          avatarUrl: actorAvatar,
          profilePicture: actorAvatar,
          profileImage: actorAvatar,
        });
      }

      // If task is in progress, show it as started
      if (task.status === 'in_progress') {
        items.push({
          _id: `${task._id || task.id}-in-progress`,
          __useFallbackActor: true,
          type: 'task_in_progress',
          title: task.title,
          target: task.title,
          createdAt: task.updatedAt || task.createdAt,
          timestamp: task.updatedAt || task.createdAt,
          actor,
          actorName,
          userName: actorName,
          actorAvatar,
          avatarUrl: actorAvatar,
          profilePicture: actorAvatar,
          profileImage: actorAvatar,
        });
      }

      // Always show creation event
      items.push({
        _id: `${task._id || task.id}-created`,
        __useFallbackActor: true,
        type: 'TASK_CREATED',
        title: task.title,
        target: task.title,
        createdAt: task.createdAt,
        timestamp: task.createdAt,
        actor,
        actorName,
        userName: actorName,
        actorAvatar,
        avatarUrl: actorAvatar,
        profilePicture: actorAvatar,
        profileImage: actorAvatar,
      });
    }

    // Sort by timestamp descending (most recent first)
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return items.slice(0, limit);
  } catch (err) {
    console.warn('[ActivityFeed] Task fallback failed:', err?.message);
    return [];
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ActivityFeed({ projectId, limit = 50, className = '', refreshKey = 0 }) {
  const [activities, setActivities] = useState([]);
  const [fallbackActor, setFallbackActor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const loadActivities = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const currentUser = await fetchCurrentUserSnapshot();

      if (mountedRef.current && currentUser) {
        setFallbackActor(currentUser);
      }

      // ═════════════════════════════════════════════════════════════════════
      // TRY 1: Activity endpoint (ActivitiesController)
      // ═════════════════════════════════════════════════════════════════════
      let items = [];

      try {
        items = await fetchProjectActivity(projectId, limit);
      } catch (activityErr) {
        // Activity endpoint might 404 or fail — that's OK, we'll fallback
        console.warn('[ActivityFeed] Activity endpoint failed, trying task fallback:', activityErr?.message);
      }

      // ═════════════════════════════════════════════════════════════════════
      // TRY 2: If empty, build activity from actual task data
      // ═════════════════════════════════════════════════════════════════════
      if (!items || items.length === 0) {
        items = await fetchTaskBasedActivity(projectId, limit, currentUser);
      }

      const normalizedItems = normalizeActivityList(items, currentUser);

      if (mountedRef.current) {
        setActivities(normalizedItems);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load activities');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [projectId, limit, refreshKey]);

  useEffect(() => {
    mountedRef.current = true;
    loadActivities();

    return () => {
      mountedRef.current = false;
    };
  }, [loadActivities]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!projectId) return;

    const interval = setInterval(loadActivities, 30000);

    return () => clearInterval(interval);
  }, [projectId, loadActivities]);

  return (
    <div
      className={`insights-activity-panel bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] rounded-xl ${className}`}
      style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
    >
      <style>
        {`
          .insights-activity-panel {
            overflow: hidden;
            border-color: rgba(148,163,184,0.34) !important;
            background:
              radial-gradient(circle at 8% 0%, rgba(139,92,246,0.10), transparent 30%),
              radial-gradient(circle at 96% 0%, rgba(34,211,238,0.08), transparent 30%),
              linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.90)) !important;
            box-shadow:
              0 24px 72px rgba(15,23,42,0.10),
              inset 0 1px 0 rgba(255,255,255,0.74) !important;
            backdrop-filter: blur(16px);
          }

          .dark .insights-activity-panel {
            border-color: rgba(255,255,255,0.10) !important;
            background:
              radial-gradient(circle at 8% 0%, rgba(139,92,246,0.16), transparent 30%),
              radial-gradient(circle at 96% 0%, rgba(34,211,238,0.10), transparent 30%),
              linear-gradient(180deg, rgba(15,23,42,0.88), rgba(2,6,23,0.82)) !important;
            box-shadow:
              0 30px 90px rgba(0,0,0,0.42),
              inset 0 1px 0 rgba(255,255,255,0.07) !important;
          }

          .insights-activity-panel::before {
            content: "";
            display: block;
            height: 3px;
            background: linear-gradient(90deg, #8b5cf6, #22d3ee, #10b981);
            opacity: 0.90;
          }

          .insights-activity-row {
            padding-left: 0.25rem;
            padding-right: 0.25rem;
            border-radius: 1rem;
            transition:
              background 180ms ease,
              transform 180ms ease,
              box-shadow 180ms ease;
          }

          .insights-activity-row:hover {
            background: rgba(139,92,246,0.055);
            transform: translateX(2px);
            box-shadow: inset 3px 0 0 rgba(139,92,246,0.32);
          }

          .dark .insights-activity-row:hover {
            background: rgba(139,92,246,0.10);
            box-shadow: inset 3px 0 0 rgba(167,139,250,0.42);
          }
        `}
      </style>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Activity Feed</h3>
          {activities.length > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/40">
              {activities.length}
            </span>
          )}
        </div>

        <button
          onClick={loadActivities}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="px-5 py-2 max-h-[600px] overflow-y-auto">
        {loading && activities.length === 0 ? (
          <div className="flex items-center gap-2 py-8 justify-center text-slate-400 dark:text-white/30">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading activity...</span>
          </div>
        ) : null}

        {error && !loading ? (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500 dark:text-white/40">{error}</p>
            <button
              onClick={loadActivities}
              className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!loading && !error && activities.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-5 h-5 text-violet-500 dark:text-violet-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-white/60">No activity yet</p>
            <p className="text-xs text-slate-400 dark:text-white/30 mt-1">
              Create tasks, upload files, or ship updates to see activity here
            </p>
          </div>
        ) : null}

        {activities.map((item, idx) => (
          <ActivityRow
            key={item?._id || item?.id || `activity-${idx}`}
            item={item}
            fallbackActor={fallbackActor}
          />
        ))}
      </div>
    </div>
  );
}
