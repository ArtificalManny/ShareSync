import React, { useEffect, useRef, useState } from 'react';
import FileCard from './FileCard';
import { listFiles, deleteFile } from '../../api/files';
import { track } from '../../utils/telemetry';

/**
 * Props:
 * - projectId (required)
 * - initialFiles?: array (optional—if you already have some)
 * - canEdit?: boolean    (role ≥ member, can upload)
 * - canManage?: boolean  (role = owner, can hard-delete)
 */
export default function FileGrid({
  projectId,
  initialFiles = [],
  canEdit = false,
  canManage = false,
}) {
  const [files, setFiles] = useState(() => initialFiles.map(normalizeFile));
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(!initialFiles.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Track newly-added files coming in from parent (e.g., successful uploads)
  const hasMountedRef = useRef(false);
  const prevIdsRef = useRef(new Set(initialFiles.map((f) => String(f.id ?? f._id ?? ''))));

  // Keep in sync if parent pushes new files via realtime (ProjectHome updates `initialFiles`)
  useEffect(() => {
    // diff for telemetry
    const nextIds = new Set(initialFiles.map((f) => String(f.id ?? f._id ?? '')));
    let addedCount = 0;
    for (const id of nextIds) {
      if (!prevIdsRef.current.has(id)) addedCount += 1;
    }
    prevIdsRef.current = nextIds;

    // Only fire after initial mount to avoid counting the first load
    if (hasMountedRef.current && addedCount > 0) {
      try {
        track('file_added', { projectId, count: addedCount });
      } catch {}
    }
    hasMountedRef.current = true;

    setFiles((prev) => {
      const byId = new Map();
      [...initialFiles.map(normalizeFile), ...prev].forEach((f) =>
        byId.set(String(f.id), f)
      );
      return Array.from(byId.values());
    });
  }, [initialFiles, projectId]);

  useEffect(() => {
    let ignore = false;
    if (!projectId) return;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await listFiles(projectId);
        const { items, nextCursor } = normalizeList(res);
        if (ignore) return;
        setFiles(items);
        setCursor(nextCursor);
        setHasMore(Boolean(nextCursor));
      } catch (e) {
        if (!ignore) setError(e?.message || 'Failed to load files');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [projectId]);

  const loadMore = async () => {
    if (!hasMore || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await listFiles(projectId, { cursor, limit: 20 });
      const { items, nextCursor } = normalizeList(res);
      setFiles((prev) => dedupe([...prev, ...items]));
      setCursor(nextCursor);
      setHasMore(Boolean(nextCursor));
    } catch (e) {
      // non-fatal; keep existing list
      console.warn('files: loadMore failed', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRemove = async (id) => {
    if (!canManage) return;
    const prev = files;
    setFiles((f) => f.filter((x) => String(x.id) !== String(id)));
    try {
      await deleteFile(projectId, id);
    } catch (e) {
      // rollback on failure
      setFiles(prev);
      alert(e?.response?.data?.message || e?.message || 'Failed to delete file.');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface h-28 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3">
        {error}
      </div>
    );
  }

  if (!files.length) {
    return <div className="text-sm text-muted">No files yet.</div>;
  }

  return (
    <>
      {/* Local CSS for the pending ring + badges */}
      <style>{`
        @keyframes ss-pulse-ring {
          0% { transform: scale(0.9); opacity: 0.7; }
          70% { transform: scale(1.2); opacity: 0.15; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        .ss-pulse-ring {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          box-shadow: 0 0 0 2px rgba(99,102,241,0.35);
          animation: ss-pulse-ring 1.6s ease-out infinite;
          pointer-events: none;
        }
        .ss-badge {
          position: absolute;
          top: 6px; left: 6px;
          font-size: 10px;
          line-height: 1;
          padding: 4px 6px;
          border-radius: 999px;
          backdrop-filter: saturate(1.2) blur(4px);
        }
        .ss-badge--pending {
          color: #4338CA;
          background: rgba(199,210,254,0.6);
          border: 1px solid rgba(99,102,241,0.3);
        }
        .ss-badge--approved {
          color: #065F46;
          background: rgba(167,243,208,0.5);
          border: 1px solid rgba(16,185,129,0.3);
        }
        .ss-badge--blocked {
          color: #9B1C1C;
          background: rgba(254,205,211,0.55);
          border: 1px solid rgba(244,63,94,0.35);
        }
      `}</style>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {files.map((f) => {
          const status = (f.moderationStatus || f.status || '').toLowerCase();
          const isPending = status === 'pending';
          const badgeClass =
            status === 'blocked'
              ? 'ss-badge ss-badge--blocked'
              : status === 'approved' || status === 'allowed'
              ? 'ss-badge ss-badge--approved'
              : 'ss-badge ss-badge--pending';

          return (
            <div key={f.id} className="relative">
              {/* Status badge */}
              <span className={badgeClass}>
                {status || 'pending'}
              </span>

              {/* Pending ring */}
              {isPending && <span className="ss-pulse-ring" />}

              {/* Card */}
              <FileCard
                file={f}
                canEdit={canEdit}
                canManage={canManage}
                onDelete={canManage ? () => handleRemove(f.id) : undefined}
              />
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface disabled:opacity-60"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </>
  );
}

/* ————— helpers ————— */

function normalizeFile(f) {
  const id = String(f.id ?? f._id ?? '');
  return {
    id,
    url: f.url || f.storageKey || '',
    thumbUrl: f.thumbUrl || f.thumbKey || '',
    name: f.name || '',
    size: Number(f.size || 0),
    mime: f.mime || 'application/octet-stream',
    kind: f.kind || guessKind(f.mime || ''),
    status: f.status || 'pending',
    moderationStatus: f.moderationStatus || f.status || 'pending',
    createdAt: f.createdAt || new Date().toISOString(),
    projectId: f.projectId,
    uploaderId: f.uploaderId, // ← backend field name
  };
}

function normalizeList(res) {
  // Support both shapes: array or { items, nextCursor }
  if (Array.isArray(res)) {
    return { items: res.map(normalizeFile), nextCursor: null };
  }
  const items = Array.isArray(res?.items) ? res.items.map(normalizeFile) : [];
  const nextCursor = res?.nextCursor || null;
  return { items, nextCursor };
}

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const it of list) {
    const k = String(it.id || it._id || '');
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

function guessKind(mime = '') {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'doc';
  if (mime.includes('zip') || mime.includes('gzip')) return 'archive';
  return 'other';
}
