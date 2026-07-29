import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ExternalLink,
  FileText,
  History,
  Loader2,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";

import {
  addTaskAttachment,
  addTaskComment,
  deleteTaskAttachment,
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

function getMentionMatch(value, cursor) {
  const text = String(value || "");
  const numericCursor = Number(cursor);

  const safeCursor = Math.max(
    0,
    Math.min(
      Number.isFinite(numericCursor)
        ? numericCursor
        : text.length,
      text.length
    )
  );

  const beforeCursor = text.slice(
    0,
    safeCursor
  );

  const match = beforeCursor.match(
    /(^|[\s(\[{])@([^\s@\n\r]{0,80})$/
  );

  if (!match) return null;

  const query = String(match[2] || "");

  return {
    start: safeCursor - query.length - 1,
    end: safeCursor,
    query,
  };
}

function getMentionSearchText(member) {
  return [
    member?.name,
    member?.fullName,
    member?.displayName,
    member?.firstName,
    member?.lastName,
    member?.username,
    member?.email,
    member?.role,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
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

function formatFileSize(value) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "Size unavailable";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const amount = bytes / 1024 ** unitIndex;

  return `${amount >= 10 || unitIndex === 0
    ? amount.toFixed(0)
    : amount.toFixed(1)} ${units[unitIndex]}`;
}

function getMutationChanges(activity) {
  const candidates = [
    activity?.payload?.changes,
    activity?.details?.changes,
    activity?.metadata?.changes,
    activity?.changes,
  ];

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        !Array.isArray(candidate)
    ) || {}
  );
}

function describeMutation(activity) {
  if (activity?.message) return activity.message;

  const changes = getMutationChanges(activity);
  const attachmentAdded = changes?.attachmentAdded;
  const attachmentRemoved = changes?.attachmentRemoved;

  if (attachmentAdded) {
    const fileName = String(
      attachmentAdded?.fileName || ""
    )
      .trim()
      .slice(0, 120);

    return fileName
      ? `added attachment “${fileName}”`
      : "added an attachment";
  }

  if (attachmentRemoved) {
    const fileName = String(
      attachmentRemoved?.fileName || ""
    )
      .trim()
      .slice(0, 120);

    return fileName
      ? `removed attachment “${fileName}”`
      : "removed an attachment";
  }

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
  const [mentionMatch, setMentionMatch] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [selectedMentions, setSelectedMentions] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [uploadingAttachment, setUploadingAttachment] =
    useState(false);
  const [
    deletingAttachmentId,
    setDeletingAttachmentId,
  ] = useState("");
  const [attachmentError, setAttachmentError] =
    useState("");
  const commentInputRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const mentionMembers = useMemo(() => {
    const seenIds = new Set();
    const normalizedMembers = [];

    for (
      const member of Array.isArray(members)
        ? members
        : []
    ) {
      const id = normalizeId(member);

      if (
        !id ||
        id === currentUserId ||
        seenIds.has(id)
      ) {
        continue;
      }

      seenIds.add(id);

      const name = getDisplayName(
        member,
        "Project member"
      );

      normalizedMembers.push({
        ...member,
        id,
        name,
        searchText: getMentionSearchText({
          ...member,
          name,
        }),
      });
    }

    return normalizedMembers.sort((a, b) =>
      a.name.localeCompare(
        b.name,
        undefined,
        {
          sensitivity: "base",
        }
      )
    );
  }, [members, currentUserId]);

  const mentionCandidates = useMemo(() => {
    if (!mentionMatch) return [];

    const query = String(
      mentionMatch.query || ""
    )
      .trim()
      .toLowerCase();

    return mentionMembers
      .filter(
        (member) =>
          !query ||
          member.searchText.includes(query)
      )
      .slice(0, 8);
  }, [mentionMatch, mentionMembers]);

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
    setMentionMatch(null);
    setMentionIndex(0);
    setSelectedMentions([]);
    setCommentError("");
    setAttachmentError("");
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

  const attachments = useMemo(() => {
    const source = Array.isArray(detailTask?.attachments)
      ? detailTask.attachments
      : [];

    return [...source].sort(
      (a, b) =>
        new Date(
          b?.uploadedAt || b?.createdAt || 0
        ).getTime() -
        new Date(
          a?.uploadedAt || a?.createdAt || 0
        ).getTime()
    );
  }, [detailTask?.attachments]);

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

  const updateMentionMatch = useCallback(
    (value, cursor) => {
      setMentionMatch(
        getMentionMatch(value, cursor)
      );
      setMentionIndex(0);
    },
    []
  );

  const handleCommentChange = useCallback(
    (event) => {
      const nextValue = event.target.value;

      setCommentText(nextValue);

      setSelectedMentions((previous) =>
        previous.filter((mention) =>
          nextValue.includes(
            `@${mention.name}`
          )
        )
      );

      updateMentionMatch(
        nextValue,
        event.target.selectionStart
      );
    },
    [updateMentionMatch]
  );

  const selectMention = useCallback(
    (member) => {
      if (
        !member?.id ||
        !member?.name ||
        !mentionMatch
      ) {
        return;
      }

      const before = commentText.slice(
        0,
        mentionMatch.start
      );

      const after = commentText.slice(
        mentionMatch.end
      );

      const mentionText = `@${member.name}`;

      const spacer =
        !after
          ? " "
          : /^[\s,.;:!?)}\]]/.test(after)
            ? ""
            : " ";

      const nextValue =
        `${before}${mentionText}${spacer}${after}`;

      if (nextValue.length > 5000) {
        return;
      }

      const nextCursor =
        before.length +
        mentionText.length +
        spacer.length;

      setCommentText(nextValue);

      setSelectedMentions((previous) => {
        const withoutDuplicate =
          previous.filter(
            (mention) =>
              mention.id !== member.id
          );

        return [
          ...withoutDuplicate,
          {
            id: member.id,
            name: member.name,
          },
        ];
      });

      setMentionMatch(null);
      setMentionIndex(0);

      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          const textarea =
            commentInputRef.current;

          textarea?.focus();
          textarea?.setSelectionRange(
            nextCursor,
            nextCursor
          );
        });
      }
    },
    [commentText, mentionMatch]
  );

  const handleAddComment = useCallback(
    async (event) => {
      event?.preventDefault?.();

      const content = commentText.trim();

      const mentionIds = [
        ...new Set(
          selectedMentions
            .filter((mention) =>
              content.includes(
                `@${mention.name}`
              )
            )
            .map((mention) => mention.id)
            .filter(Boolean)
        ),
      ];

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
        const updatedTask =
          await addTaskComment(taskId, {
            content,
            mentions: mentionIds,
          });

        setDetailTask(
          updatedTask || detailTask
        );

        setCommentText("");
        setMentionMatch(null);
        setMentionIndex(0);
        setSelectedMentions([]);

        await loadCollaboration({
          quiet: true,
        });
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
      selectedMentions,
      taskId,
    ]
  );

  const handleCommentKeyDown = useCallback(
    (event) => {
      if (
        event.key === "Enter" &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        event.stopPropagation();
        handleAddComment(event);
        return;
      }

      if (!mentionMatch) return;

      if (
        event.key === "ArrowDown" &&
        mentionCandidates.length
      ) {
        event.preventDefault();
        event.stopPropagation();

        setMentionIndex((current) =>
          (current + 1) %
          mentionCandidates.length
        );

        return;
      }

      if (
        event.key === "ArrowUp" &&
        mentionCandidates.length
      ) {
        event.preventDefault();
        event.stopPropagation();

        setMentionIndex((current) =>
          (
            current -
            1 +
            mentionCandidates.length
          ) % mentionCandidates.length
        );

        return;
      }

      if (
        (
          event.key === "Enter" ||
          event.key === "Tab"
        ) &&
        mentionCandidates.length
      ) {
        event.preventDefault();
        event.stopPropagation();

        selectMention(
          mentionCandidates[
            Math.min(
              mentionIndex,
              mentionCandidates.length - 1
            )
          ]
        );

        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setMentionMatch(null);
        setMentionIndex(0);
      }
    },
    [
      handleAddComment,
      mentionCandidates,
      mentionIndex,
      mentionMatch,
      selectMention,
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

  const handleAddAttachment = useCallback(
    async (event) => {
      const input = event?.target;
      const file = input?.files?.[0] || null;

      if (input) {
        input.value = "";
      }

      if (
        !file ||
        !taskId ||
        disabled ||
        commenting ||
        deletingCommentId ||
        uploadingAttachment ||
        deletingAttachmentId
      ) {
        return;
      }

      setUploadingAttachment(true);
      setAttachmentError("");

      try {
        const updatedTask = await addTaskAttachment(
          taskId,
          file
        );

        setDetailTask(updatedTask || detailTask);
        await loadCollaboration({ quiet: true });
      } catch (error) {
        setAttachmentError(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "The attachment could not be uploaded."
        );
      } finally {
        setUploadingAttachment(false);
      }
    },
    [
      commenting,
      deletingAttachmentId,
      deletingCommentId,
      detailTask,
      disabled,
      loadCollaboration,
      taskId,
      uploadingAttachment,
    ]
  );

  const handleDeleteAttachment = useCallback(
    async (fileId) => {
      if (
        !fileId ||
        !taskId ||
        disabled ||
        commenting ||
        deletingCommentId ||
        uploadingAttachment ||
        deletingAttachmentId
      ) {
        return;
      }

      setDeletingAttachmentId(fileId);
      setAttachmentError("");

      try {
        const updatedTask =
          await deleteTaskAttachment(taskId, fileId);

        setDetailTask(updatedTask || detailTask);
        await loadCollaboration({ quiet: true });
      } catch (error) {
        setAttachmentError(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "The attachment could not be removed."
        );
      } finally {
        setDeletingAttachmentId("");
      }
    },
    [
      commenting,
      deletingAttachmentId,
      deletingCommentId,
      detailTask,
      disabled,
      loadCollaboration,
      taskId,
      uploadingAttachment,
    ]
  );

  const collaborationBusy =
    disabled ||
    commenting ||
    Boolean(deletingCommentId) ||
    uploadingAttachment ||
    Boolean(deletingAttachmentId);

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
        <section aria-labelledby="move-attachments-heading">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleAddAttachment}
            disabled={collaborationBusy}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json,.xml,.zip,.7z,.rar,.tar"
          />

          <div className="flex items-start justify-between gap-4">
            <div>
              <div
                id="move-attachments-heading"
                className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-zinc-300"
              >
                <Paperclip className="h-4 w-4 text-fuchsia-500" />
                Move attachments
              </div>

              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                Add briefs, screenshots, documents, or handoff files.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={collaborationBusy}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/15"
            >
              {uploadingAttachment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              {uploadingAttachment
                ? "Uploading…"
                : "Add file"}
            </button>
          </div>

          {attachmentError ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
              {attachmentError}
            </div>
          ) : null}

          {attachments.length ? (
            <div className="mt-3 space-y-2">
              {attachments.map((attachment, index) => {
                const fileId = String(
                  attachment?.fileId ||
                    attachment?.id ||
                    attachment?._id ||
                    ""
                );
                const fileName = String(
                  attachment?.fileName ||
                    attachment?.name ||
                    "Attachment"
                );
                const fileUrl =
                  attachment?.fileUrl ||
                  attachment?.url ||
                  "";
                const fileType = String(
                  attachment?.fileType ||
                    attachment?.type ||
                    ""
                );
                const fileSize =
                  attachment?.fileSize ??
                  attachment?.size;
                const uploaderId = normalizeId(
                  attachment?.uploadedBy
                );
                const canRemove =
                  Boolean(currentUserId) &&
                  uploaderId === currentUserId;

                return (
                  <article
                    key={
                      fileId ||
                      `${fileName}-${attachment?.uploadedAt || index}`
                    }
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.035]"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-300">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {fileUrl ? (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group inline-flex max-w-full items-center gap-1.5 text-sm font-black text-slate-800 hover:text-violet-700 dark:text-zinc-200 dark:hover:text-violet-300"
                          title={`Open ${fileName}`}
                        >
                          <span className="truncate">
                            {fileName}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50 transition group-hover:opacity-100" />
                        </a>
                      ) : (
                        <div className="truncate text-sm font-black text-slate-800 dark:text-zinc-200">
                          {fileName}
                        </div>
                      )}

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 dark:text-zinc-600">
                        <span>{formatFileSize(fileSize)}</span>
                        {fileType ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="max-w-[180px] truncate">
                              {fileType}
                            </span>
                          </>
                        ) : null}
                        <span aria-hidden="true">·</span>
                        <span>
                          {formatRelativeTime(
                            attachment?.uploadedAt ||
                              attachment?.createdAt
                          )}
                        </span>
                      </div>
                    </div>

                    {canRemove && fileId ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteAttachment(fileId)
                        }
                        disabled={collaborationBusy}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                        aria-label={`Remove ${fileName}`}
                        title="Remove attachment"
                      >
                        {deletingAttachmentId === fileId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center dark:border-white/10">
              <Paperclip className="mx-auto h-5 w-5 text-slate-300 dark:text-zinc-700" />
              <p className="mt-2 text-sm font-bold text-slate-600 dark:text-zinc-400">
                No attachments yet
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-600">
                Files added here stay connected to this move.
              </p>
            </div>
          )}
        </section>

        <div className="border-t border-slate-200 dark:border-white/10" />

          <form onSubmit={handleAddComment}>
            <div className="relative">
              <textarea
                ref={commentInputRef}
                value={commentText}
                onChange={handleCommentChange}
                onKeyDown={handleCommentKeyDown}
                onSelect={(event) =>
                  updateMentionMatch(
                    event.currentTarget.value,
                    event.currentTarget.selectionStart
                  )
                }
                onBlur={() => {
                  if (
                    typeof window === "undefined"
                  ) {
                    return;
                  }

                  window.setTimeout(() => {
                    setMentionMatch(null);
                    setMentionIndex(0);
                  }, 120);
                }}
                rows={3}
                maxLength={5000}
                disabled={collaborationBusy}
                placeholder="Add a decision, question, handoff note, or progress update… Type @ to mention a project member."
                aria-autocomplete="list"
                aria-expanded={Boolean(
                  mentionMatch
                )}
                aria-controls="move-comment-mention-list"
                aria-activedescendant={
                  mentionMatch &&
                  mentionCandidates[mentionIndex]
                    ? `move-comment-mention-${mentionCandidates[mentionIndex].id}`
                    : undefined
                }
                className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200 dark:placeholder:text-zinc-600"
              />

              {mentionMatch ? (
                <div
                  id="move-comment-mention-list"
                  role="listbox"
                  aria-label="Project members"
                  className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-white/10 dark:bg-[#202027] dark:shadow-black/40"
                >
                  <div className="border-b border-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:border-white/10 dark:text-zinc-500">
                    @ Mention a project member
                  </div>

                  {mentionCandidates.length ? (
                    <div className="max-h-60 overflow-y-auto p-1.5">
                      {mentionCandidates.map(
                        (member, index) => {
                          const active =
                            index === mentionIndex;

                          const secondary =
                            member?.role ||
                            member?.email ||
                            member?.username ||
                            "Project member";

                          return (
                            <button
                              key={member.id}
                              id={`move-comment-mention-${member.id}`}
                              type="button"
                              role="option"
                              aria-selected={
                                active
                              }
                              onMouseDown={(
                                event
                              ) =>
                                event.preventDefault()
                              }
                              onClick={() =>
                                selectMention(
                                  member
                                )
                              }
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                active
                                  ? "bg-violet-50 text-violet-900 dark:bg-violet-500/15 dark:text-violet-100"
                                  : "text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
                              }`}
                            >
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-black text-white">
                                {member.name
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </span>

                              <span className="min-w-0">
                                <span className="block truncate text-sm font-black">
                                  {member.name}
                                </span>

                                <span className="block truncate text-[11px] text-slate-400 dark:text-zinc-500">
                                  {secondary}
                                </span>
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-5 text-center text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      No matching project members.
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {selectedMentions.length ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-slate-400 dark:text-zinc-500">
                  Will notify:
                </span>

                {selectedMentions.map(
                  (mention) => (
                    <span
                      key={mention.id}
                      className="rounded-full border border-violet-200 bg-violet-50 px-2 py-1 font-black text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-200"
                    >
                      @{mention.name}
                    </span>
                  )
                )}
              </div>
            ) : null}

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 dark:text-zinc-600">
                Type @ to mention · Ctrl/⌘ + Enter to post
              </span>

              <button
                type="submit"
                disabled={
                  collaborationBusy ||
                  !commentText.trim()
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
