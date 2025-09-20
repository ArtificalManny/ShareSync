import React from "react";
import { Trash2, Download, File as FileIcon, Image as ImageIcon, Video, Music, Archive } from "lucide-react";

function TypeIcon({ kind = 'other' }) {
  if (kind === 'image') return <ImageIcon className="w-4 h-4 opacity-80" />;
  if (kind === 'video') return <Video className="w-4 h-4 opacity-80" />;
  if (kind === 'audio') return <Music className="w-4 h-4 opacity-80" />;
  if (kind === 'archive') return <Archive className="w-4 h-4 opacity-80" />;
  return <FileIcon className="w-4 h-4 opacity-80" />;
}

export default function FileCard({
  file,
  onDelete,           // matches FileGrid
  onDownload,
  canEdit = false,
  canManage = false,   // only owners can hard-delete
}) {
  const isImage =
    (file?.mime || "").startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(file?.url || "");

  const pending = (file?.moderationStatus || "").toLowerCase() === "pending";

  const sizeLabel =
    typeof file?.size === "number" && file.size > 0
      ? (file.size >= 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`)
      : (file?.mime || "");

  return (
    <div className="card group relative overflow-hidden hover-glow rounded-xl border border-border bg-surface">
      {isImage ? (
        <img
          src={file.url}
          alt={file.name || "file"}
          className="w-full h-28 object-cover transition-transform duration-150 group-hover:scale-[1.01]"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="h-28 grid place-items-center text-sm text-muted">
          <div className="flex items-center gap-2">
            <TypeIcon kind={file?.kind} />
            <span className="truncate max-w-[12rem]">{file.name || "File"}</span>
          </div>
        </div>
      )}

      {/* Pending chip (secondary—main status badge is in FileGrid) */}
      {pending && (
        <div className="absolute top-2 left-2 chip chip--warn text-[11px] px-2 py-0.5">
          Pending
        </div>
      )}

      <div className="p-2 flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <div className="truncate text-sm font-medium text-text">
            {file.name || "Untitled file"}
          </div>
          <div className="text-[11px] text-muted">{sizeLabel}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn--ghost hover-glow p-1 rounded-md"
            onClick={() => onDownload?.(file)}
            title="Download"
            aria-label={`Download ${file?.name || "file"}`}
          >
            <Download className="w-4 h-4" />
          </button>

          {(canManage || onDelete) && (
            <button
              className="btn btn--ghost hover-glow p-1 rounded-md text-danger"
              onClick={() => onDelete?.(file?.id || file)}
              title="Delete"
              aria-label={`Delete ${file?.name || "file"}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
