import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  History,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";

import {
  addTaskComment,
  deleteTaskComment,
  fetchTaskDetail,
} from "../../api/taskApi";
import { getActivity } from "../../api/activity";

function normalizeId(value) {
  if (!value) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return String(
    value?._id ||
      value?.id ||
      value?.userId?._id ||
      value?.userId?.id ||
      value?.userId ||
      value?.sub ||
      ""
  );
}

function readStoredUser() {
  if (typeof window === "undefined") return null;

  const keys = ["ss.user", "user", "auth.user", "auth"];

  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const candidate =
        parsed?.user ||
        parsed?.data?.user ||
        parsed?.account ||
        parsed;

      if (candidate && typeof candidate === "object") {
        return candidate;
      }
    } catch {
      // Ignore malformed or unavailable storage entries.
    }
  }

  return null;
}

function getDisplayName(user, fallback = "Team member") {
  if (!user || typeof user !== "object") return fallback;

  return (
    user?.name ||
    user?.fullName ||
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    user?.email ||
    fallback
  );
}

function formatRelativeTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recently";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 45) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear()
        ? "numeric"
        : undefined,
  }).format(date);
}

function describeMutation(activity) {
  if (activity?.message) return activity.message;

  const type = String(activity?.type || "")
    .trim()
    .toLowerCase()
    .replace(/[.\s-]+/g, "_");

  if (type.includes("created")) return "created this move";
  if (type.includes("completed")) return "completed this move";
  if (type.includes("moved")) return "moved this move";
  if (type.includes("started")) return "started this move";
  if (type.includes("updated")) return "updated this move";
  if (type.includes("deleted")) return "deleted this move";

  return "changed this move";
}

export default function MoveTaskCollaborationPanel({
  task,
  members = [],
  disabled = false,
} = {}) {
  const taskId = normalizeId(task);
  const projectId = normalizeId(
    task?.projectId ||
      task?.project?._id ||
      task?.project?.id ||
      task?.project
  );

  const [detailTask, setDetailTask] = useState(task);
  const [activityItems, setActivityItems] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [commentError, setCommentError] = useState("");

  const currentUser = useMemo(() => readStoredUser(), []);
  const currentUserId = normalizeId(currentUser);

  const memberMap = useMemo(() => {
    const map = new Map();

    for (const member of Array.isArray(members) ? members : []) {
      const id = normalizeId(member);

      if (!id) continue;

      map.set(id, {
        ...member,
        name: getDisplayName(member),
      });
    }

    if (currentUserId) {
      map.set(currentUserId, {
        ...(map.get(currentUserId) || {}),
        ...currentUser,
        name: getDisplayName(currentUser, "You"),
      });
    }

    return map;
  }, [members, currentUser, currentUserId]);

  const resolveCommentAuthor = useCallback(
    (comment) => {
      const authorId = normalizeId(comment?.userId);

      if (authorId && currentUserId && authorId === currentUserId) {
        return "You";
      }

      return (
        memberMap.get(authorId)?.name ||
        getDisplayName(
          comment?.user ||
            comment?.author ||
            comment?.createdBy,
          "Team member"
        )
      );
    },
    [currentUserId, memberMap]
  );

  const loadCollaboration = useCallback(
    async ({ quiet = false } = {}) => {
      if (!taskId) return;

      if (!quiet) setLoading(true);
      setLoadError("");

      try {
        const [loadedTask, loadedActivity] = await Promise.all([
          fetchTaskDetail(taskId),
          projectId
            ? getActivity({
                scope: "project",
                projectId,
                entityId: taskId,
                limit: 30,
              })
            : Promise.resolve({ items: [] }),
        ]);

        setDetailTask(loadedTask || task);
        setActivityItems(
          Array.isArray(loadedActivity?.items)
            ? loadedActivity.items
            : []
        );
      } catch (error) {
        setLoadError(
          error?.response?.data?.message ||
            error?.message ||
            "Discussion and activity could not be loaded."
        );
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [projectId, task, taskId]
  );

  useEffect(() => {
    setDetailTask(task);
    setCommentText("");
    setCommentError("");
    loadCollaboration();
  }, [loadCollaboration, task]);

  const comments = useMemo(() => {
    const source = Array.isArray(detailTask?.comments)
      ? detailTask.comments
      : [];

    return [...source]
      .sort(
        (a, b) =>
          new Date(a?.createdAt || 0).getTime() -
          new Date(b?.createdAt || 0).getTime()
      )
      .slice(-30);
  }, [detailTask?.comments]);

  const timelineItems = useMemo(() => {
    const mutations = activityItems
      .filter(
        (activity) =>
          !String(activity?.type || "")
            .toLowerCase()
            .includes("comment")
      )
      .map((activity) => ({
        id: `activity-${activity?.id || Math.random()}`,
        kind: "activity",
        actor: activity?.user?.name || "Someone",
        message: describeMutation(activity),
        ts: activity?.ts,
      }));

    const commentEvents = comments.map((comment) => ({
      id: `comment-${normalizeId(comment) || comment?.createdAt}`,
      kind: "comment",
      actor: resolveCommentAuthor(comment),
      message: `commented: ${String(comment?.content || "")
        .trim()
        .slice(0, 160)}`,
      ts: comment?.createdAt,
    }));

    return [...mutations, ...commentEvents]
      .sort(
        (a, b) =>
          new Date(b?.ts || 0).getTime() -
          new Date(a?.ts || 0).getTime()
      )
      .slice(0, 30);
  }, [activityItems, comments, resolveCommentAuthor]);

  const handleAddComment = useCallback(
    async (event) => {
      event?.preventDefault?.();

      const content = commentText.trim();

      if (
        !content ||
        !taskId ||
        disabled ||
        commenting ||
        deletingCommentId
      ) {
        return;
      }

      setCommenting(true);
      setCommentError("");

      try {
        const updatedTask = await addTaskComment(taskId, {
          content,
        });

        setDetailTask(updatedTask || detailTask);
        setCommentText("");

        await loadCollaboration({ quiet: true });
      } catch (error) {
        setCommentError(
          error?.response?.data?.message ||
            error?.message ||
            "The comment could not be posted."
        );
      } finally {
        setCommenting(false);
      }
    },
    [
      commentText,
      commenting,
      deletingCommentId,
      detailTask,
      disabled,
      loadCollaboration,
      taskId,
    ]
  );

  const handleDeleteComment = useCallback(
    async (commentId) => {
      if (
        !commentId ||
        !taskId ||
        disabled ||
        commenting ||
        deletingCommentId
      ) {
        return;
      }

      setDeletingCommentId(commentId);
      setCommentError("");

      try {
        const updatedTask = await deleteTaskComment(
          taskId,
          commentId
        );

        setDetailTask(updatedTask || detailTask);

        await loadCollaboration({ quiet: true });
      } catch (error) {
        setCommentError(
          error?.response?.data?.message ||
            error?.message ||
            "The comment could not be deleted."
        );
      } finally {
        setDeletingCommentId("");
      }
    },
    [
      commenting,
      deletingCommentId,
      detailTask,
      disabled,
      loadCollaboration,
      taskId,
    ]
  );

  const collaborationBusy =
    disabled || commenting || Boolean(deletingCommentId);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-black/15">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-zinc-300">
            <MessageSquare className="h-4 w-4 text-violet-500" />
            Discussion
          </div>

          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
            Keep decisions and execution context attached to the move.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadCollaboration()}
          disabled={loading || collaborationBusy}
          className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Refresh discussion and activity"
          title="Refresh"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </header>

      <div className="space-y-5 p-4">
        <form onSubmit={handleAddComment}>
          <textarea
            value={commentText}
            onChange={(event) =>
              setCommentText(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                (event.metaKey || event.ctrlKey)
              ) {
                event.preventDefault();
                event.stopPropagation();
                handleAddComment(event);
              }
            }}
            rows={3}
            maxLength={5000}
            disabled={collaborationBusy}
            placeholder="Add a decision, question, handoff note, or progress update…"
            className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200 dark:placeholder:text-zinc-600"
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 dark:text-zinc-600">
              Ctrl/⌘ + Enter to post
            </span>

            <button
              type="submit"
              disabled={
                collaborationBusy || !commentText.trim()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {commenting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post comment
            </button>
          </div>
        </form>

        {commentError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
            {commentError}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 text-sm font-semibold text-slate-500 dark:border-white/10 dark:text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading discussion…
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
            {loadError}
          </div>
        ) : comments.length ? (
          <div className="space-y-3">
            {comments.map((comment) => {
              const commentId = normalizeId(comment);
              const authorId = normalizeId(comment?.userId);
              const isOwnComment =
                Boolean(currentUserId) &&
                authorId === currentUserId;

              return (
                <article
                  key={commentId || comment?.createdAt}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.035]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 dark:text-zinc-200">
                        {resolveCommentAuthor(comment)}
                      </div>

                      <div className="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-600">
                        {formatRelativeTime(comment?.createdAt)}
                        {comment?.isEdited ? " · edited" : ""}
                      </div>
                    </div>

                    {isOwnComment && commentId ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteComment(commentId)
                        }
                        disabled={collaborationBusy}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                        aria-label="Delete comment"
                        title="Delete comment"
                      >
                        {deletingCommentId === commentId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-zinc-300">
                    {comment?.content}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center dark:border-white/10">
            <MessageSquare className="mx-auto h-5 w-5 text-slate-300 dark:text-zinc-700" />
            <p className="mt-2 text-sm font-bold text-slate-600 dark:text-zinc-400">
              No discussion yet
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-600">
              Add the first decision or progress note.
            </p>
          </div>
        )}

        <div className="border-t border-slate-200 pt-5 dark:border-white/10">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-zinc-300">
            <History className="h-4 w-4 text-cyan-500" />
            Activity history
          </div>

          {timelineItems.length ? (
            <ol className="space-y-3">
              {timelineItems.map((item) => (
                <li
                  key={item.id}
                  className="relative pl-6 text-sm"
                >
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-violet-500 shadow-sm dark:border-[#111116]" />

                  <div className="font-semibold text-slate-700 dark:text-zinc-300">
                    <span className="font-black text-slate-900 dark:text-white">
                      {item.actor}
                    </span>{" "}
                    {item.message}
                  </div>

                  <div className="mt-1 text-[11px] text-slate-400 dark:text-zinc-600">
                    {formatRelativeTime(item.ts)}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500 dark:border-white/10 dark:text-zinc-500">
              Activity will appear as this move changes.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
