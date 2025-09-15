import React from "react";
import { Megaphone, FileText } from "lucide-react";

/**
 * UpdateItem
 * Renders a plain project update with optional attachments.
 *
 * Props:
 *  - event: {
 *      text?, title?, attachments?: Array<{ id?, url?, previewUrl?, name?, mime?, type? }>
 *      createdAt?
 *    }
 *  - when: formatted timestamp string (optional; computed upstream)
 *  - isFresh?: boolean (highlight row when true)
 *  - className?: string (extra classes for root)
 */
export default function UpdateItem({ event, when, isFresh = false, className = "" }) {
  const u = event || {};
  const text = u.text || u.title || "Update";
  const attachments = Array.isArray(u.attachments) ? u.attachments : [];
  const whenText = when || (u.createdAt ? new Date(u.createdAt).toLocaleString() : "");

  return (
    <article
      className={`feed-row relative overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700 p-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md ${isFresh ? "row-new" : ""} ${className}`}
    >
      {isFresh && <span className="row-pulse-ring" aria-hidden />}
      <div className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900/60">
        <Megaphone className="w-4 h-4" />
        Update
      </div>
      <div className="text-sm text-slate-800 dark:text-slate-100 mt-1.5 whitespace-pre-wrap">
        {text}
      </div>
      {attachments.length > 0 && (
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {attachments.map((f) => (
            <AttachmentThumb key={f.id || f.url || f.name} file={f} />
          ))}
        </div>
      )}
      <div className="text-xs text-slate-500 mt-1">{whenText}</div>
    </article>
  );
}

function AttachmentThumb({ file }) {
  const isImg = (file?.mime || file?.type || "").toLowerCase().startsWith("image/");
  const src = file?.url || file?.previewUrl;
  if (isImg && src) {
    return (
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="block rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
        aria-label={file?.name || "Image attachment"}
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={src} className="h-20 w-full object-cover" />
      </a>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1">
      <FileText className="w-4 h-4 text-slate-500" />
      <span className="text-xs truncate" title={file?.name || "Attachment"}>
        {file?.name || "Attachment"}
      </span>
    </div>
  );
}