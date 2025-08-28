// src/components/audit/AuditList.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getActivity, exportActivity } from '../../api/activity';
import { Download, Filter, History, Inbox } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader.jsx';

const TYPES = [
  { key: 'all', label: 'All' },
  { key: 'update', label: 'Updates' },
  { key: 'task', label: 'Tasks' },
  { key: 'file', label: 'Files' },
];

const RANGES = [
  { key: '24h', label: '24h' },
  { key: '7d',  label: '7d' },
  { key: '30d', label: '30d' },
  { key: 'all', label: 'All' },
];

function rowIcon(type) {
  if (type?.startsWith('task')) return '✅';
  if (type?.startsWith('file')) return '📄';
  return '📝';
}

export default function AuditList({ scope = 'user', userId, projectId, pageSize = 20 }) {
  const [typeKey, setTypeKey] = useState('all');
  const [range, setRange] = useState('30d');
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  const typeParam = useMemo(() => {
    if (typeKey === 'all') return undefined;
    if (typeKey === 'task') return 'task.create,task.complete,task.update';
    if (typeKey === 'file') return 'file.upload';
    return 'update';
  }, [typeKey]);

  async function loadPage(nextCursor) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await getActivity({
        scope,
        userId,
        projectId,
        type: typeParam,
        range,
        cursor: nextCursor || undefined,
        limit: pageSize,
      });
      const merged = nextCursor ? [...items, ...res.items] : res.items;
      setItems(merged);
      setCursor(res.nextCursor);
      setHasMore(Boolean(res.nextCursor));
    } catch (e) {
      console.error('[AuditList] load error', e);
    } finally {
      setLoading(false);
    }
  }

  // initial + refetch on filters change
  useEffect(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    loadPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, userId, projectId, typeParam, range]);

  // infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          loadPage(cursor);
        }
      }
    });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, hasMore, sentinelRef.current]);

  const onExport = () =>
    exportActivity({ scope, userId, projectId, type: typeParam, range });

  return (
    <div className="space-y-3">
      <SectionHeader icon="History" className="!mb-0">
        Recent Activity
      </SectionHeader>

      {/* Controls */}
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Filter className="w-4 h-4" /> Filters
          </span>

          {/* Type filter chips */}
          <div role="toolbar" aria-label="Activity type filters" className="flex flex-wrap gap-1">
            {TYPES.map((t) => {
              const selected = typeKey === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTypeKey(t.key)}
                  className={[
                    'px-2 py-1 rounded-full text-xs border motion-quick',
                    selected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
                  ].join(' ')}
                  data-selected={selected ? 'true' : 'false'}
                  aria-pressed={selected}
                  aria-label={`Filter by ${t.label}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Range filter chips */}
          <div role="toolbar" aria-label="Activity date range filters" className="flex flex-wrap gap-1 mt-1">
            {RANGES.map((r) => {
              const selected = range === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRange(r.key)}
                  className={[
                    'px-2 py-1 rounded-full text-xs border motion-quick',
                    selected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
                  ].join(' ')}
                  data-selected={selected ? 'true' : 'false'}
                  aria-pressed={selected}
                  aria-label={`Show ${r.label} of activity`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 text-xs font-medium rounded-lg border px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="Export activity as CSV"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* List / Skeleton / Empty */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900">
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {items.map((it) => (
            <li key={String(it._id || it.id)}>
              <div className="py-2 px-3 flex items-start gap-2">
                <div
                  className="shrink-0 h-6 w-6 grid place-items-center rounded-full bg-slate-100 dark:bg-slate-800"
                  aria-hidden="true"
                >
                  {rowIcon(it.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-800 dark:text-slate-100">
                    {it.message || it.text || it.type || 'Update'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(it.ts || it.createdAt || Date.now()).toLocaleString()}
                  </div>
                </div>
              </div>
            </li>
          ))}

          {/* Loading skeleton rows */}
          {loading &&
            items.length === 0 &&
            Array.from({ length: 4 }).map((_, i) => (
              <li key={`sk-${i}`} className="py-2 px-3">
                <div className="flex items-start gap-2 animate-pulse">
                  <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              </li>
            ))}

          {/* Empty state */}
          {!loading && items.length === 0 && (
            <li className="py-8 px-3">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <div className="h-8 w-8 rounded-full grid place-items-center bg-slate-100 dark:bg-slate-800">
                  <Inbox className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-medium">No activity yet</div>
                  <div className="text-xs">Try changing filters or check back later.</div>
                </div>
              </div>
            </li>
          )}
        </ul>

        {/* IntersectionObserver anchor + inline loading notice */}
        <div ref={sentinelRef} />
        {loading && items.length > 0 && (
          <div className="px-3 py-2 text-xs text-slate-500">Loading…</div>
        )}
      </div>
    </div>
  );
}