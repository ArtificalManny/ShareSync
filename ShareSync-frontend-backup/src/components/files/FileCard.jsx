// /src/components/files/FileCard.jsx
import React from "react";
import {
  File as FileIcon,
  Image as ImageIcon,
  Download,
  ExternalLink,
} from "lucide-react";

function formatBytes(b = 0) {
  if (!b && b !== 0) return "—";
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

function timeAgo(ts) {
  if (!ts) return "";
  const t = typeof ts === "string" ? new Date(ts).getTime() : +ts;
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}

function isImageMime(m = "") {
  return String(m).startsWith("image/");
}

/**
 * FileCard
 *
 * Props:
 * - file: {
 *     id/_id, name, size, mime, url, thumbUrl?,
 *     createdAt?, owner/uploader?: { name, avatarUrl }
 *   }
 * - onOpen?: (file) => void  // optional custom open handler
 * - className?: string
 *
 * Behavior:
 * - Images show a thumb (thumbUrl || url) with a basic overlay.
 * - Non-images show an icon tile.
 * - Footer shows uploader (if present), relative time, and size.
 */
export default function FileCard({ file = {}, onOpen, className = "" }) {
  const {
    name = "Untitled",
    size,
    mime,
    url,
    thumbUrl,
    createdAt,
    owner,
    uploader,
  } = file;

  const person = owner || uploader || null;
  const isImg = isImageMime(mime);
  const href = url || thumbUrl || "#";
  const previewSrc = isImg ? (thumbUrl || url) : null;

  const open = (e) => {
    e?.preventDefault?.();
    if (typeof onOpen === "function") return onOpen(file);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <article
      className={
        "group rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 shadow-sm overflow-hidden " +
        className
      }
    >
      {/* Preview */}
      {isImg ? (
        <button
          type="button"
          onClick={open}
          className="relative block w-full aspect-[4/3] overflow-hidden"
          aria-label={`Open ${name}`}
          title={name}
        >
          <img
            src={previewSrc}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          className="relative flex items-center justify-center h-28 w-full bg-slate-50 dark:bg-slate-900/50"
          aria-label={`Open ${name}`}
          title={name}
        >
          <FileIcon className="w-8 h-8 text-slate-400" />
        </button>
      )}

      {/* Meta */}
      <div className="p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {name}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 flex items-center gap-2">
              <span>{formatBytes(size)}</span>
              <span>•</span>
              <span>{timeAgo(createdAt)}</span>
            </div>
          </div>

          {/* Open / Download */}
          <div className="shrink-0 flex items-center gap-1">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                title="Open"
                aria-label="Open"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {url && (
              <a
                href={url}
                download
                className="inline-flex items-center rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                title="Download"
                aria-label="Download"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Uploader */}
        {person?.name || person?.avatarUrl ? (
          <div className="mt-2 flex items-center gap-2">
            {person?.avatarUrl ? (
              <img
                src={person.avatarUrl}
                alt={person?.name || "Uploader"}
                className="w-5 h-5 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
            )}
            <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
              {person?.name || "Uploader"}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
