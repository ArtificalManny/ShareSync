// /src/components/audit/AuditList.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, CheckCircle2, MessageSquareText, Activity } from 'lucide-react';
import { getActivity } from '../../api/activity';

// icon map by type
const TYPE_ICON = {
  taskComplete: CheckCircle2,
  fileUpload: FileText,
  post: MessageSquareText,
};

function Row({ item }) {
  const Icon = TYPE_ICON[item?.type] || Activity;
  return (
    <li className="flex items-start gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <span className="mt-0.5 shrink-0 rounded-lg border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5">
        <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-sm text-slate-900 dark:text-slate-100 truncate">{item?.summary || '—'}</div>
        <div className="text-xs text-slate-500 truncate">
          {item?.project?.name ? <><span className="text-slate-400">Project:</span> {item.project.name} · </> : null}
          {item?.actor?.name ? <>{item.actor.name} · </> : null}
          <time dateTime={item?.createdAt}>{formatRelative(item?.createdAt)}</time>
        </div>
      </div>
    </li>
  );
}

export default function AuditList({ scope = 'user', projectId }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const sentinelRef = useRef(null);
  const canLoadMore = useMemo(() => Boolean(cursor), [cursor]);

  // initial load
  useEffect(() => {
    let cancel = false;
    setLoading(true); setError('');
    getActivity({ scope, projectId })
      .then((res) => {
        if (cancel) return;
        setItems(res?.items || []);
        setCursor(res?.nextCursor || null);
      })
      .catch((e) => !cancel && setError(e?.message || 'Failed to load activity.'))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [scope, projectId]);

  // infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!canLoadMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (!first?.isIntersecting || loadingMore) return;
      setLoadingMore(true);
      getActivity({ scope, projectId, cursor })
        .then((res) => {
          setItems((prev) => [...prev, ...(res?.items || [])]);
          setCursor(res?.nextCursor || null);
        })
        .finally(() => setLoadingMore(false));
    }, { rootMargin: '96px 0px' });

    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, canLoadMore, loadingMore, scope, projectId]);

  // socket: optimistic prepend when scope matches
  useEffect(() => {
    let cleanup = () => {};
    const onIdle = (fn) =>
      ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 0));

    const id = onIdle(async () => {
      try {
        const { io } = await import('socket.io-client');
        const socket = io();
        socket.on('activity:new', (evt) => {
          // evt should contain scope & projectId (or omit for user-wide)
          if (scope === 'user' && (!evt.projectId || evt.scope === 'user')) {
            setItems((prev) => [shapeActivity(evt), ...prev]);
          } else if (scope === 'project' && evt.projectId && evt.projectId === projectId) {
            setItems((prev) => [shapeActivity(evt), ...prev]);
          }
        });
        cleanup = () => socket.disconnect();
      } catch { /* ignore */ }
    });

    return () => {
      typeof cancelIdleCallback === 'function' ? cancelIdleCallback(id) : clearTimeout(id);
      cleanup();
    };
  }, [scope, projectId]);

  return (
    <section
      aria-label={scope === 'user' ? 'Recent activity' : 'Project activity'}
      className="rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900"
    >
      <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {scope === 'user' ? 'Recent Activity' : 'Project Activity'}
        </h3>
      </div>

      {loading ? (
        <div className="p-4 space-y-2" aria-busy="true">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4">
          <div className="rounded-lg border border-rose-200/70 bg-rose-50 text-rose-700 px-3 py-2">
            {error}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="p-4 text-sm text-slate-500">No recent activity yet.</div>
      ) : (
        <>
          <ul className="p-2 space-y-1">
            {items.map((it) => (
              <Row key={it.id || it._id || `${it.type}-${it.createdAt}`} item={it} />
            ))}
          </ul>

          {/* infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-10" aria-hidden />
          {loadingMore && (
            <div className="px-4 pb-3 text-xs text-slate-500">Loading more…</div>
          )}
        </>
      )}
    </section>
  );
}

/* ---------- utils ---------- */

function formatRelative(dateish) {
  if (!dateish) return '—';
  const ts = +new Date(dateish);
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  const m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (s < 45) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 8) return `${d}d ago`;
  try { return new Date(ts).toLocaleDateString(); } catch { return '—'; }
}

function shapeActivity(evt) {
  // Make sure optimistic items match the list row expectations
  return {
    id: evt.id || evt._id || `tmp_${Date.now()}`,
    type: evt.type || 'post',
    project: evt.project || (evt.projectId ? { id: evt.projectId, name: evt.projectName || 'Project' } : undefined),
    actor: evt.actor || { id: evt.userId, name: evt.userName || 'You', avatarUrl: evt.userAvatar || '' },
    summary: evt.summary || evt.text || 'New activity',
    createdAt: evt.createdAt || new Date().toISOString(),
    data: evt.data || {},
  };
}
