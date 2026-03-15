// src/components/insights/ActivityFeed.jsx
// Uses client DIRECTLY → GET /projects/:projectId/activity
// Does NOT import from api/activity.js (which has the double /api bug)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity, CheckCircle2, Circle, Loader2,
  Plus, RefreshCw, ArrowRight, FileText, MessageSquare,
  UserPlus, Zap, Send,
} from 'lucide-react';
import client from '../../api/client';

const CFG = {
  'TASK_CREATED':    { icon: Plus,         label: 'created a task',        color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-500/15', dot: 'bg-violet-500' },
  'TASK_UPDATED':    { icon: ArrowRight,   label: 'updated a task',        color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-100 dark:bg-blue-500/15',     dot: 'bg-blue-500' },
  'TASK_MOVED':      { icon: ArrowRight,   label: 'moved a task',          color: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-100 dark:bg-cyan-500/15',     dot: 'bg-cyan-500' },
  'TASK_COMPLETED':  { icon: CheckCircle2, label: 'completed a task',      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/15', dot: 'bg-emerald-500' },
  'TASK_DELETED':    { icon: Circle,       label: 'deleted a task',        color: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-100 dark:bg-rose-500/15',     dot: 'bg-rose-500' },
  'task_created':    { icon: Plus,         label: 'created a task',        color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-500/15', dot: 'bg-violet-500' },
  'task_completed':  { icon: CheckCircle2, label: 'completed a task',      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/15', dot: 'bg-emerald-500' },
  'task_deleted':    { icon: Circle,       label: 'deleted a task',        color: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-100 dark:bg-rose-500/15',     dot: 'bg-rose-500' },
  'file_uploaded':   { icon: FileText,     label: 'uploaded a file',       color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-100 dark:bg-amber-500/15',   dot: 'bg-amber-500' },
  'message_sent':    { icon: MessageSquare, label: 'sent a message',       color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-100 dark:bg-blue-500/15',     dot: 'bg-blue-500' },
  'member_added':    { icon: UserPlus,     label: 'added a member',        color: 'text-teal-600 dark:text-teal-400',     bg: 'bg-teal-100 dark:bg-teal-500/15',     dot: 'bg-teal-500' },
  'announcement_created': { icon: Send,    label: 'posted an announcement', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-500/15', dot: 'bg-violet-500' },
  'project_shipped': { icon: Zap,          label: 'shipped an update',     color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-100 dark:bg-amber-500/15',   dot: 'bg-amber-500' },
  'comment_added':   { icon: MessageSquare, label: 'added a comment',      color: 'text-slate-500 dark:text-white/50',    bg: 'bg-slate-100 dark:bg-white/10',       dot: 'bg-slate-400' },
  'task.mutation':   { icon: ArrowRight,   label: 'modified a task',       color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-100 dark:bg-blue-500/15',     dot: 'bg-blue-500' },
};

const DEF = { icon: Circle, label: 'activity', color: 'text-slate-500 dark:text-white/50', bg: 'bg-slate-100 dark:bg-white/10', dot: 'bg-slate-400' };

function cfg(item) {
  const k = item?.type || item?.action || item?.kind || '';
  if (CFG[k]) return CFG[k];
  const l = k.toLowerCase().replace(/\./g, '_');
  if (CFG[l]) return CFG[l];
  if (l.includes('created')) return CFG['task_created'];
  if (l.includes('completed')) return CFG['task_completed'];
  if (l.includes('updated')) return CFG['TASK_UPDATED'];
  return DEF;
}

function title(item) {
  return item?.title || item?.details?.message || item?.metadata?.taskTitle || item?.payload?.title || item?.payload?.snapshot?.title || item?.message || (item?.type || item?.action || 'Activity').replace(/[._]/g, ' ');
}

function actor(item) {
  return item?.actorName || item?.userName || item?.user?.displayName || (item?.user?.firstName ? `${item.user.firstName} ${item.user.lastName || ''}`.trim() : null) || item?.payload?.actorName || null;
}

function ago(ts) {
  if (!ts) return '';
  const d = Date.now() - new Date(ts).getTime();
  if (isNaN(d) || d < 0) return '';
  const m = Math.floor(d / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (dy < 7) return `${dy}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Row({ item }) {
  const c = cfg(item);
  const Icon = c.icon;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-white/[0.04] last:border-b-0 group">
      <div className="flex flex-col items-center mt-1">
        <div className={`w-2 h-2 rounded-full ${c.dot}`} />
        <div className="w-px flex-1 bg-slate-200 dark:bg-white/[0.06] mt-1 min-h-[20px] group-last:hidden" />
      </div>
      <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-3.5 h-3.5 ${c.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 dark:text-white/80">
          <span className="font-medium text-slate-900 dark:text-white">{actor(item) || 'Team member'}</span>
          {' '}<span className="text-slate-500 dark:text-white/50">{c.label}</span>
        </p>
        <p className="text-sm font-medium text-slate-800 dark:text-white/90 truncate mt-0.5">{title(item)}</p>
      </div>
      <span className="text-[11px] text-slate-400 dark:text-white/30 whitespace-nowrap flex-shrink-0 mt-0.5">{ago(item?.createdAt || item?.timestamp)}</span>
    </div>
  );
}

// ── Fetch directly via client → GET /projects/:id/activity ──────────────────
// This is your ActivitiesController at @Controller('projects/:projectId/activity')
async function fetchActivity(projectId, limit = 50) {
  const res = await client.get(`/projects/${projectId}/activity`, { params: { limit } });
  const d = res.data;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.data?.items)) return d.data.items;
  if (Array.isArray(d)) return d;
  return [];
}

export default function ActivityFeed({ projectId, limit = 50, className = '' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mRef = useRef(true);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true); setError(null);
    try {
      const data = await fetchActivity(projectId, limit);
      if (mRef.current) setItems(data);
    } catch (e) {
      if (mRef.current) setError(e?.response?.data?.message || e?.message || 'Failed to load activities');
    } finally {
      if (mRef.current) setLoading(false);
    }
  }, [projectId, limit]);

  useEffect(() => { mRef.current = true; load(); return () => { mRef.current = false; }; }, [load]);
  useEffect(() => { if (!projectId) return; const i = setInterval(load, 30000); return () => clearInterval(i); }, [projectId, load]);

  return (
    <div className={`bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] rounded-xl ${className}`} style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Activity Feed</h3>
          {items.length > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/40">{items.length}</span>}
        </div>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-colors" title="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="px-5 py-2 max-h-[600px] overflow-y-auto">
        {loading && items.length === 0 ? <div className="flex items-center gap-2 py-8 justify-center text-slate-400 dark:text-white/30"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading activity...</span></div> : null}
        {error && !loading ? <div className="py-6 text-center"><p className="text-sm text-slate-500 dark:text-white/40">{error}</p><button onClick={load} className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:underline">Try again</button></div> : null}
        {!loading && !error && items.length === 0 ? <div className="py-8 text-center"><div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center mx-auto mb-3"><Activity className="w-5 h-5 text-violet-500 dark:text-violet-400" /></div><p className="text-sm font-medium text-slate-600 dark:text-white/60">No activity yet</p><p className="text-xs text-slate-400 dark:text-white/30 mt-1">Create tasks to see activity here</p></div> : null}
        {items.map((item, idx) => <Row key={item?._id || item?.id || `a-${idx}`} item={item} />)}
      </div>
    </div>
  );
}
