// /src/components/files/FileGrid.jsx
import React from "react";
import FileCard from "./FileCard";

/**
 * FileGrid
 *
 * Props:
 * - files?: Array<FileLike>
 *   FileLike: { id?/_id?, name, size?, mime?, url?, thumbUrl?, createdAt?, owner/uploader? }
 * - onOpen?: (file) => void
 * - isLoading?: boolean
 * - emptyMessage?: string
 * - className?: string
 *
 * Behavior:
 * - Responsive grid (2 cols on small, 3 on sm+, 4 on lg+).
 * - Shows skeletons when loading.
 * - Shows friendly empty state when no files.
 */
export default function FileGrid({
  files = [],
  onOpen,
  isLoading = false,
  emptyMessage = "No files yet.",
  className = "",
}) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`sk-${i}`}
            className="h-40 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200/70 dark:border-slate-700 p-6 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-300">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}>
      {files.map((f, idx) => (
        <FileCard
          key={f.id || f._id || f.url || `${f.name}-${idx}`}
          file={f}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
