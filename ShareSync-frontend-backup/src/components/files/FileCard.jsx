// src/components/files/FileCard.jsx
import React from 'react';
import { Trash2, FileText, Image as ImageIcon, File } from 'lucide-react';

/** Small helper: format bytes → human-readable */
function fmtBytes(n = 0) {
  const b = Number(n || 0);
  if (b < 1024) return `${b} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let i = -1, val = b;
  do { val /= 1024; i++; } while (val >= 1024 && i < units.length - 1);
  return `${val.toFixed(val >= 10 ? 0 : 1)} ${units[i]}`;
}

/** Choose an icon when no thumbnail is present */
function MimeIcon({ mime = '' }) {
  const m = String(mime);
  if (m.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-indigo-600" />;
  if (m.includes('pdf') || m.includes('text') || m.includes('json')) {
    return <FileText className="w-5 h-5 text-indigo-600" />;
  }
  return <File className="w-5 h-5 text-indigo-600" />;
}

/**
 * Props:
 * - file: { id, url, thumbUrl?, name, size, mime, moderationStatus, createdAt }
 * - onRemove?: (fileId) => Promise|void  // called when delete clicked
 * - canEdit?: boolean                     // controls delete visibility
 */
export default function FileCard({ file, onRemove, canEdit = false }) {
  const { id, url, thumbUrl, name, size, mime, moderationStatus } = file || {};

  const badge =
    moderationStatus === 'pending'
      ? 'border-amber-300 text-amber-700 bg-amber-50'
      : moderationStatus === 'blocked'
      ? 'border-rose-300 text-rose-700 bg-rose-50'
      : 'border-emerald-300 text-emerald-700 bg-emerald-50';

  return (
    <div className="group rounded-xl border border-border bg-surface overflow-hidden hover:shadow-sm transition-shadow">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block aspect-[16/10] bg-surface/60 grid place-content-center overflow-hidden"
        title={name}
      >
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center gap-2 text-muted">
            <MimeIcon mime={mime} />
          </div>
        )}
      </a>

      <div className="p-3 flex items-start gap-3">
        <div className="mt-0.5">
          <MimeIcon mime={mime} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-text" title={name}>
            {name || 'Untitled'}
          </div>
          <div className="text-xs text-muted mt-0.5">{fmtBytes(size)} • {mime || 'file'}</div>
          <div className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[11px] border ${badge}`}>
            {moderationStatus || 'allowed'}
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => onRemove?.(id)}
            className="opacity-80 hover:opacity-100 text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors"
            title="Remove file"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}