import React from "react";
import { Link } from "react-router-dom";
import { File as FileIcon, Paperclip, Folder } from "lucide-react";

function prettyBytes(n) {
  if (!n && n !== 0) return "";
  const units = ["B","KB","MB","GB","TB"];
  let i = 0; let v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function FileResultCard({ file = {} }) {
  const name = file.name || file.filename || "Untitled";
  const size = file.size || file.contentLength;
  const type = file.type || file.mimeType || "";
  const pid = file.projectId || file.project?.id || file.project?._id;
  const projectTitle = file.projectTitle || file.project?.title;

  const href = pid ? `/projects/${pid}` : "/projects";

  return (
    <Link
      to={href}
      className="block rounded-xl border border-border bg-surface p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      role="listitem"
      aria-label={`File: ${name}`}
    >
      <div className="flex items-start gap-2">
        <FileIcon className="w-4 h-4 text-indigo-600 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{name}</div>
          <div className="mt-1 text-[11px] text-muted inline-flex items-center gap-3">
            {type && <span>{type}</span>}
            {typeof size === "number" && <span>{prettyBytes(size)}</span>}
            {projectTitle && (
              <span className="inline-flex items-center gap-1">
                <Folder className="w-3 h-3" />
                {projectTitle}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
