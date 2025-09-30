import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Paperclip, User } from "lucide-react";

function excerpt(v, n = 140) {
  const s = (v || "").replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
function timeAgo(iso) {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  const m = s / 60; if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60; if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24; return `${Math.floor(d)}d ago`;
}

export default function PostResultCard({ post = {} }) {
  const pid = post.projectId || post.project?.id || post.project?._id;
  const href = pid ? `/projects/${pid}` : "/projects";
  const body = post.body || post.text || "";
  const attachments = Array.isArray(post.attachments) ? post.attachments : [];
  const author = post.author?.name || post.authorName || post.authorUsername;

  return (
    <Link
      to={href}
      className="block rounded-xl border border-border bg-surface p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      role="listitem"
      aria-label="Post"
    >
      <div className="flex items-start gap-2">
        <MessageSquare className="w-4 h-4 text-indigo-600 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="text-sm">{excerpt(body)}</div>
          <div className="mt-1 text-[11px] text-muted inline-flex items-center gap-3">
            {author && (
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {author}
              </span>
            )}
            {post.createdAt && <span>{timeAgo(post.createdAt)}</span>}
            {attachments.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                {attachments.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
