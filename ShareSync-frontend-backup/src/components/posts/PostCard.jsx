import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, CornerDownRight, Clock, Tag } from "lucide-react";
import ReactionBar from "./ReactionBar";
import { addComment, listComments } from "../../api/posts";
import { toast } from "../ui/Toaster.jsx";
import { trackPostCommented } from "../../utils/telemetry";
import { useMentions } from "./MentionsProvider";

/**
 * PostCard
 * Props:
 *  - projectId
 *  - post: {
 *      id/_id,
 *      author?: { name, username, avatarUrl },
 *      body,
 *      attachments?: [{ id, url, name }],
 *      createdAt,
 *      reactions?: { emoji: count },
 *      myReactions?: string[],
 *      tags?: string[]
 *    }
 *  - className?
 */
export default function PostCard({ projectId, post, className = "" }) {
  const pid = post?._id || post?.id;
  const [openThread, setOpenThread] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  const { menu, onKeyDown, onChange, attach, extractMentions } = useMentions();
  const threadRef = useRef(null);

  const authorLabel = useMemo(() => {
    const u = post?.author || {};
    return u.name || u.displayName || u.username || "Someone";
  }, [post?.author]);

  const timeLabel = useMemo(() => {
    try { return new Date(post?.createdAt || Date.now()).toLocaleString(); } catch { return ""; }
  }, [post?.createdAt]);

  const atts = Array.isArray(post?.attachments) ? post.attachments : [];
  const tags = Array.isArray(post?.tags) ? post.tags : [];

  useEffect(() => {
    if (!openThread) return;
    let abort = false;
    (async () => {
      setLoadingComments(true);
      try {
        const res = await listComments(projectId, pid, { limit: 20 });
        if (!abort) {
          const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
          setComments(items);
        }
      } catch {
        if (!abort) setComments([]);
      } finally {
        if (!abort) setLoadingComments(false);
      }
    })();
    return () => { abort = true; };
  }, [openThread, projectId, pid]);

  const onSendComment = async (e) => {
    e?.preventDefault?.();
    const txt = commentText.trim();
    if (!txt) return;
    setSending(true);
    try {
      const mentions = extractMentions(txt);
      const c = await addComment(projectId, pid, { text: txt, mentions });
      setComments((prev) => [...prev, c]);
      setCommentText("");
      trackPostCommented?.({ projectId, postId: pid, mentions: mentions.length });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to comment.";
      toast({ title: "Comment failed", description: msg, variant: "error" });
    } finally {
      setSending(false);
    }
  };

  // highlight @mentions and URLs in body (simple)
  const renderedBody = useMemo(() => {
    const text = String(post?.body || "");
    // split on mentions or urls
    const parts = text.split(/(\bhttps?:\/\/[^\s]+|@[a-zA-Z0-9_.-]{1,32})/g);
    return parts.map((p, i) => {
      if (/^@[a-zA-Z0-9_.-]{1,32}$/.test(p)) {
        return <strong key={i} className="text-indigo-600">{p}</strong>;
      }
      if (/^https?:\/\//.test(p)) {
        return (
          <a
            key={i}
            href={p}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-2 decoration-indigo-400 underline-offset-2 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm"
          >
            {p}
          </a>
        );
      }
      return <span key={i}>{p}</span>;
    });
  }, [post?.body]);

  return (
    <article
      className={`card hover-raise rounded-2xl border border-border bg-surface p-3 focus-within:outline-none ${className}`}
      aria-labelledby={`post-${pid}-title`}
      tabIndex={-1}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {post?.author?.avatarUrl ? (
          <img src={post.author.avatarUrl} alt="" className="h-9 w-9 rounded-full" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700" aria-hidden />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 id={`post-${pid}-title`} className="text-sm font-semibold">{authorLabel}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
              <Clock className="w-3 h-3" />
              {timeLabel}
            </span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-grad-xp text-white"
                  title={`Tag: ${t}`}
                >
                  <Tag className="w-3 h-3" aria-hidden />
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-1 text-sm break-words leading-relaxed">
            {renderedBody}
          </div>

          {atts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {atts.map((f) => (
                <a
                  key={f.id || f._id || f.url}
                  href={f.url || "#"}
                  className="inline-flex items-center gap-2 text-xs rounded-lg border border-border px-2 py-1 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  target="_blank" rel="noreferrer"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" aria-hidden />
                  {f.name || f.filename || f.url?.split("/").pop() || "file"}
                </a>
              ))}
            </div>
          )}

          {/* Reactions */}
          <div className="mt-3">
            <ReactionBar
              projectId={projectId}
              postId={pid}
              reactions={post?.reactions || {}}
              myReactions={post?.myReactions || []}
            />
          </div>

          {/* Thread toggle */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setOpenThread((v) => !v)}
              aria-expanded={openThread ? "true" : "false"}
              className="inline-flex items-center gap-2 text-xs rounded-lg px-2 py-1 border border-border hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {openThread ? "Hide thread" : "View thread"}
            </button>
          </div>

          {/* Thread */}
          {openThread && (
            <div ref={threadRef} className="mt-3 pl-3 border-l border-border">
              {loadingComments ? (
                <div className="text-xs text-muted">Loading comments…</div>
              ) : comments.length === 0 ? (
                <div className="text-xs text-muted">No comments yet.</div>
              ) : (
                <ul className="space-y-2">
                  {comments.map((c) => (
                    <li key={c._id || c.id} className="text-sm">
                      <div className="inline-flex items-center gap-2 text-xs text-muted">
                        <CornerDownRight className="w-3 h-3" />
                        <span className="font-medium">
                          {c.author?.name || c.author?.username || "User"}
                        </span>
                        <span>
                          {new Date(c.createdAt || Date.now()).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-0.5">
                        {String(c.text || "").split(/(@[a-zA-Z0-9_.-]{1,32})/g).map((p, i) =>
                          p.match(/^@[a-zA-Z0-9_.-]{1,32}$/) ? (
                            <strong key={i} className="text-indigo-600">{p}</strong>
                          ) : (
                            <span key={i}>{p}</span>
                          )
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Composer */}
              <form onSubmit={onSendComment} className="mt-2">
                <div className="relative">
                  <textarea
                    ref={attach}
                    value={commentText}
                    onChange={(e) => { setCommentText(e.target.value); onChange(e); }}
                    onKeyDown={onKeyDown}
                    rows={2}
                    placeholder="Reply… use @ to mention"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="relative">{menu}</div>
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={sending || !commentText.trim()}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-grad-orange-cta text-white hover:opacity-90 disabled:opacity-60"
                    title="Comment"
                  >
                    {sending ? "Sending…" : "Comment"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
