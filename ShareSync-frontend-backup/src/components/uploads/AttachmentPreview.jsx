import React, { useEffect, useMemo, useState } from "react";
import {
  X as CloseIcon,
  Paperclip,
  Image as ImageIcon,
  Download,
  ExternalLink,
} from "lucide-react";

/**
 * AttachmentPreview
 * A small, accessible preview card for a pre-upload File or an uploaded attachment record.
 *
 * Accepts either:
 *  • File/Blob (from <input type="file" />)
 *  • Object: { id?, name, url?, mime?, size?, thumbUrl?, progress?, status? }
 *
 * Props:
 *  - item: File | { id?, name, url?, mime?, size?, thumbUrl?, progress?, status? }
 *  - onRemove?: (item) => void
 *  - onOpen?: (item) => void        // if not provided but item.url exists, will open in new tab
 *  - progress?: number               // 0..100 (overrides item.progress)
 *  - status?: 'idle'|'uploading'|'done'|'error' (overrides item.status)
 *  - compact?: boolean               // tighter layout (e.g., inside composer)
 *  - className?: string
 *
 * Usage:
 *  <AttachmentPreview item={fileOrObj} onRemove={(it)=>...} />
 */

function isFileLike(v) {
  return typeof File !== "undefined" && v instanceof File;
}

function formatBytes(n) {
  const b = Number(n || 0);
  if (!b) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(b) / Math.log(1024)));
  const v = b / Math.pow(1024, i);
  return `${v >= 10 ? Math.round(v) : Math.round(v * 10) / 10} ${units[i]}`;
}

function getName(item) {
  if (isFileLike(item)) return item.name || "file";
  return item?.name || item?.filename || (item?.url ? item.url.split("/").pop() : "file");
}

function getMime(item) {
  if (isFileLike(item)) return item.type || "";
  return item?.mime || item?.contentType || "";
}

function looksImage(mime, name) {
  if (mime && String(mime).startsWith("image/")) return true;
  const n = String(name || "").toLowerCase();
  return n.match(/\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i);
}

export default function AttachmentPreview({
  item,
  onRemove,
  onOpen,
  progress,
  status,
  compact = false,
  className = "",
}) {
  const name = useMemo(() => getName(item), [item]);
  const mime = useMemo(() => getMime(item), [item]);
  const size = useMemo(() => (isFileLike(item) ? item.size : item?.size), [item]);

  const effectiveStatus = status || item?.status || (isFileLike(item) ? "idle" : "done");
  const effectiveProgress = typeof progress === "number" ? progress : (item?.progress ?? (effectiveStatus === "uploading" ? 0 : 100));

  const [objectUrl, setObjectUrl] = useState("");
  const isImage = looksImage(mime, name);

  // Generate a local preview URL for File images
  useEffect(() => {
    if (isFileLike(item) && isImage) {
      try {
        const url = URL.createObjectURL(item);
        setObjectUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch { /* noop */ }
    } else {
      setObjectUrl("");
    }
  }, [item, isImage]);

  const remoteUrl = !isFileLike(item) ? (item?.thumbUrl || item?.url || "") : "";
  const previewUrl = objectUrl || remoteUrl;

  const open = () => {
    if (typeof onOpen === "function") return onOpen(item);
    if (remoteUrl) {
      try { window.open(remoteUrl, "_blank", "noopener,noreferrer"); } catch {}
    }
  };

  const remove = () => onRemove?.(item);

  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border border-border bg-surface",
        compact ? "p-2" : "p-3",
        className,
      ].join(" ")}
      role="group"
      aria-label={`Attachment ${name}`}
    >
      {/* Top-right remove */}
      {onRemove && (
        <button
          type="button"
          onClick={remove}
          className="absolute top-1 right-1 inline-flex items-center justify-center rounded-md p-1.5 bg-white/80 dark:bg-slate-900/80 border border-border hover:bg-white dark:hover:bg-slate-900"
          aria-label={`Remove ${name}`}
          title="Remove"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex items-center gap-3">
        {/* Thumbnail / icon */}
        <div
          className={[
            "shrink-0 rounded-lg grid place-content-center",
            compact ? "h-10 w-10" : "h-12 w-12",
            "bg-white dark:bg-slate-900 border border-border",
          ].join(" ")}
          aria-hidden
        >
          {isImage && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover rounded-md"
              draggable={false}
            />
          ) : (
            <div className="flex items-center justify-center text-slate-500">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{name}</div>
          <div className="text-[11px] text-muted">
            {mime ? `${mime} · ` : ""}{formatBytes(size)}
          </div>

          {/* Progress / status */}
          {effectiveStatus === "uploading" && (
            <div className="mt-1">
              <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-indigo-500"
                  style={{ width: `${Math.max(0, Math.min(100, effectiveProgress))}%` }}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(effectiveProgress)}
                  role="progressbar"
                />
              </div>
              <div className="mt-0.5 text-[11px] text-muted">
                Uploading… {Math.round(effectiveProgress)}%
              </div>
            </div>
          )}

          {effectiveStatus === "error" && (
            <div className="mt-1 text-[11px] text-rose-600">Upload failed</div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-1">
          {remoteUrl && (
            <>
              <a
                href={remoteUrl}
                download
                className="rounded-md border border-border p-1.5 hover:bg-surface"
                title="Download"
                aria-label="Download"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={open}
                className="rounded-md border border-border p-1.5 hover:bg-surface"
                title="Open"
                aria-label="Open"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Optional helper list for quick grids
 *
 * <AttachmentList items={arr} onRemove={...} />
 */
export function AttachmentList({ items = [], onRemove, className = "", compact = false }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className={["grid gap-2", compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"].join(" ")}>
      {items.map((it, i) => (
        <AttachmentPreview
          key={(isFileLike(it) ? it.name : it.id) || i}
          item={it}
          onRemove={onRemove}
          compact={compact}
          className={className}
        />
      ))}
    </div>
  );
}
