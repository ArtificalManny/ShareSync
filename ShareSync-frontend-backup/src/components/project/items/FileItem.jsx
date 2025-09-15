import React from "react";
import { FileText, Image as ImageIcon } from "lucide-react";

/**
 * FileItem
 * Renders file upload/attach events.
 *
 * Props:
 *  - event: { name?, filename?, text?, mime?, meta?, url?, createdAt? }
 *  - when: formatted timestamp string (optional; computed upstream)
 */
export default function FileItem({ event, when }) {
  const u = event || {};
  const name = u.name || u.filename || u.text || "File";
  const mime = (u.mime || u.meta?.mime || "").toLowerCase();
  const icon = mime.startsWith("image/") ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />;
  const whenText = when || (u.createdAt ? new Date(u.createdAt).toLocaleString() : "");

  return (
    <article className="flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-slate-700 px-3 py-2 bg-white/70 dark:bg-slate-800/70">
      <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-900/60">
        {icon}
        File
      </span>
      <span className="text-sm text-slate-800 dark:text-slate-100 truncate" title={name}>
        {name}
      </span>
      <span className="ml-auto text-[11px] text-slate-500">{whenText}</span>
    </article>
  );
}