import React from "react";
import { Download, Trash2 } from "lucide-react";
import FileItem from "../project/items/FileItem.jsx"; // preview tile (image or <TypeIcon/>)
import "../../styles/files.css"; // provides .thumb, .thumb__img, etc.

/**
 * Props:
 * - file: { id, name, size, mime, url, ... }
 * - canEdit?: boolean   (reserved for future)
 * - canManage?: boolean (owner-only delete)
 * - onDelete?: () => void
 * - onDownload?: (file) => void
 */
export default function FileCard({
  file,
  canEdit = false,
  canManage = false,
  onDelete,
  onDownload,
}) {
  const name = file?.name || "Untitled file";
  const size = formatBytes(Number(file?.size || 0));
  const mime = String(file?.mime || "application/octet-stream");

  return (
    <div className="rounded-xl border border-border bg-surface p-2">
      <FileItem file={file} onDownload={onDownload} />
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-text" title={name}>
            {name}
          </div>
          <div className="text-[11px] text-muted truncate" title={`${size} · ${mime}`}>
            {size} · {shortMime(mime)}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1">
          <a
            href={file?.url || "#"}
            download
            rel="noopener"
            onClick={(e) => {
              if (onDownload) {
                e.preventDefault();
                onDownload(file);
              }
            }}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs hover:bg-surface"
            title={`Download ${name}`}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>

          {canManage && typeof onDelete === "function" && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs hover:bg-surface"
              title="Delete file"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function shortMime(m = "") {
  const [t, s] = m.split("/");
  if (!s) return m;
  return `${t}/${s.slice(0, 8)}${s.length > 8 ? "…" : ""}`;
}

function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const v = bytes / Math.pow(k, i);
  return `${v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(1) : v.toFixed(2)} ${units[i]}`;
}
