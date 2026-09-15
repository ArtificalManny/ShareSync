import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  X,
} from "lucide-react";

import { createTask } from "../../api/taskApi";
import {
  getProject,
  getProjects,
} from "../../api/projects";

function normalizeId(value) {
  if (!value) return "";

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value).trim();
  }

  if (typeof value === "object") {
    return normalizeId(
      value._id ||
        value.id ||
        value.userId ||
        value.user ||
        value.memberId ||
        value.member
    );
  }

  return "";
}

function personName(value, fallback = "") {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const first = String(value.firstName || "").trim();
  const last = String(value.lastName || "").trim();

  return (
    String(
      value.displayName ||
        value.name ||
        value.fullName ||
        ""
    ).trim() ||
    [first, last].filter(Boolean).join(" ") ||
    String(value.username || "").trim() ||
    String(value.email || "").trim() ||
    fallback
  );
}

function projectName(project) {
  return String(
    project?.name ||
      project?.title ||
      "Untitled project"
  ).trim();
}

function projectList(payload) {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.projects)) {
    return payload.projects;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function unwrapProject(payload) {
  return (
    payload?.project ||
    payload?.data?.project ||
    payload?.data ||
    payload ||
    null
  );
}

function memberEntity(member) {
  if (!member || typeof member !== "object") {
    return member;
  }

  if (
    member.user &&
    typeof member.user === "object"
  ) {
    return member.user;
  }

  if (
    member.userId &&
    typeof member.userId === "object"
  ) {
    return member.userId;
  }

  if (
    member.member &&
    typeof member.member === "object"
  ) {
    return member.member;
  }

  if (
    member.profile &&
    typeof member.profile === "object"
  ) {
    return member.profile;
  }

  return member;
}

function buildAssignees(project, currentUser) {
  const byId = new Map();

  const add = (candidate, fallbackName = "") => {
    if (!candidate) return;

    const entity = memberEntity(candidate);

    const id =
      normalizeId(entity) ||
      normalizeId(candidate?.userId) ||
      normalizeId(candidate?.memberId) ||
      normalizeId(candidate);

    if (!id) return;

    const currentUserId = normalizeId(currentUser);

    const name =
      id === currentUserId
        ? personName(currentUser, "You")
        : personName(entity) ||
          personName(candidate) ||
          fallbackName;

    if (!name) return;

    byId.set(id, {
      id,
      name:
        id === currentUserId && name !== "You"
          ? `${name} (you)`
          : name,
    });
  };

  add(currentUser, "You");

  add(
    project?.owner ||
      project?.ownerId ||
      project?.createdBy,
    "Project owner"
  );

  const members = Array.isArray(project?.members)
    ? project.members
    : [];

  members.forEach((member) => {
    add(member, "Team member");
  });

  return Array.from(byId.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function buildSuggestedTitle(text) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "Follow up from message";

  const firstSentence =
    clean.split(/(?<=[.!?])\s+/)[0] || clean;

  if (firstSentence.length <= 100) {
    return firstSentence;
  }

  return `${firstSentence.slice(0, 97).trim()}...`;
}

function getMessageText(message) {
  return String(
    message?.content ||
      message?.text ||
      message?.body ||
      ""
  ).trim();
}

function getMessageSender(message) {
  return (
    message?.senderId ||
    message?.sender ||
    message?.user ||
    null
  );
}

export default function CreateMoveFromMessageModal({
  message,
  currentUser,
  messageIsOwn = false,
  conversationLabel = "",
  initialProjectId = "",
  onClose,
  onCreated,
}) {
  const navigate = useNavigate();

  const sourceText = getMessageText(message);

  const [title, setTitle] = useState(
    buildSuggestedTitle(sourceText)
  );

  const [projectId, setProjectId] = useState(
    normalizeId(initialProjectId)
  );

  const [assigneeId, setAssigneeId] =
    useState("");

  const [dueDate, setDueDate] = useState("");

  const [priority, setPriority] =
    useState("medium");

  const [projects, setProjects] = useState([]);

  const [selectedProject, setSelectedProject] =
    useState(null);

  const [loadingProjects, setLoadingProjects] =
    useState(true);

  const [loadingMembers, setLoadingMembers] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const [createdMove, setCreatedMove] =
    useState(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) {
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () =>
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
  }, [onClose, submitting]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoadingProjects(true);
      setError("");

      try {
        const result = await getProjects();

        if (!active) return;

        const available = projectList(result).filter(
          (project) => {
            const status = String(
              project?.status || ""
            ).toLowerCase();

            return (
              !project?.isArchived &&
              status !== "archived" &&
              status !== "completed"
            );
          }
        );

        setProjects(available);

        if (
          projectId &&
          available.some(
            (project) =>
              normalizeId(project) === projectId
          )
        ) {
          return;
        }

        if (!projectId && available.length === 1) {
          setProjectId(
            normalizeId(available[0])
          );
        }
      } catch (loadError) {
        if (!active) return;

        setError(
          loadError?.response?.data?.message ||
            loadError?.message ||
            "Could not load your projects."
        );
      } finally {
        if (active) {
          setLoadingProjects(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!projectId) {
      setSelectedProject(null);
      setAssigneeId("");
      return () => {
        active = false;
      };
    }

    const fallback =
      projects.find(
        (project) =>
          normalizeId(project) === projectId
      ) || null;

    setSelectedProject(fallback);
    setAssigneeId("");

    const loadProject = async () => {
      setLoadingMembers(true);

      try {
        const result = await getProject(projectId);

        if (!active) return;

        setSelectedProject(
          unwrapProject(result) || fallback
        );
      } catch {
        if (!active) return;

        setSelectedProject(fallback);
      } finally {
        if (active) {
          setLoadingMembers(false);
        }
      }
    };

    loadProject();

    return () => {
      active = false;
    };
  }, [projectId, projects]);

  const assignees = useMemo(
    () =>
      buildAssignees(
        selectedProject,
        currentUser
      ),
    [selectedProject, currentUser]
  );

  const sourceAuthor = useMemo(() => {
    if (messageIsOwn) {
      return personName(currentUser, "You");
    }

    return personName(
      getMessageSender(message),
      conversationLabel || "Teammate"
    );
  }, [
    message,
    messageIsOwn,
    currentUser,
    conversationLabel,
  ]);

  const selectedProjectName =
    projectName(
      projects.find(
        (project) =>
          normalizeId(project) === projectId
      ) || selectedProject
    );

  // openshare-message-source-label-dedupe-v1
  const sourceHeader = useMemo(() => {
    const author = String(sourceAuthor || "").trim();
    const conversation = String(conversationLabel || "").trim();

    if (!author) return conversation || "Message";
    if (!conversation) return author;

    if (author.toLowerCase() === conversation.toLowerCase()) {
      return author;
    }

    return `${author} · ${conversation}`;
  }, [sourceAuthor, conversationLabel]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanTitle = title.trim();

    if (
      !cleanTitle ||
      !projectId ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);
    setError("");

    const description = [
      "Created from OpenShare Messages.",
      "",
      conversationLabel
        ? `Conversation: ${conversationLabel}`
        : null,
      sourceAuthor
        ? `Source author: ${sourceAuthor}`
        : null,
      "",
      "Original message:",
      sourceText,
    ]
      .filter((line) => line !== null)
      .join("\n")
      .trim();

    try {
      const payload = {
        title: cleanTitle,
        description,
        status: "backlog",
        priority,
      };

      if (assigneeId) {
        payload.assigneeId = assigneeId;
      }

      if (dueDate) {
        payload.dueDate = new Date(
          `${dueDate}T23:59:59`
        ).toISOString();
      }

      const created = await createTask(
        projectId,
        payload
      );

      setCreatedMove(created || {});

      onCreated?.(created, {
        projectId,
        projectName: selectedProjectName,
      });
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Could not create the Move."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const viewMoves = () => {
    navigate(
      `/projects/${encodeURIComponent(
        projectId
      )}?view=tasks`
    );

    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-move-from-message-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitting
        ) {
          onClose?.();
        }
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#151518]">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400" />

        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-white/[0.06]">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
              <MessageSquareText className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="create-move-from-message-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Create Move from message
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                Turn this conversation into accountable work.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onClose?.()}
            disabled={submitting}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-white/[0.06] dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {createdMove ? (
          <div className="px-6 py-7">
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />

                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Move created
                  </h3>

                  <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
                    {title.trim()}
                  </p>

                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                    Added to {selectedProjectName}.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onClose?.()}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/[0.05]"
              >
                Close
              </button>

              <button
                type="button"
                onClick={viewMoves}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                View Moves
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="px-6 py-6"
          >
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                  Move title
                </span>

                <input
                  type="text"
                  value={title}
                  maxLength={500}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                    Project
                  </span>

                  <select
                    value={projectId}
                    onChange={(event) =>
                      setProjectId(
                        event.target.value
                      )
                    }
                    disabled={loadingProjects}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#1c1c20] dark:text-white"
                  >
                    <option value="">
                      {loadingProjects
                        ? "Loading projects..."
                        : "Select project"}
                    </option>

                    {projects.map((project) => {
                      const id =
                        normalizeId(project);

                      if (!id) return null;

                      return (
                        <option
                          key={id}
                          value={id}
                        >
                          {projectName(project)}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                    Owner
                  </span>

                  <select
                    value={assigneeId}
                    onChange={(event) =>
                      setAssigneeId(
                        event.target.value
                      )
                    }
                    disabled={
                      !projectId ||
                      loadingMembers
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#1c1c20] dark:text-white"
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {assignees.map((person) => (
                      <option
                        key={person.id}
                        value={person.id}
                      >
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                    Due date
                  </span>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) =>
                      setDueDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#1c1c20] dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                    Priority
                  </span>

                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#1c1c20] dark:text-white"
                  >
                    <option value="low">
                      Low
                    </option>
                    <option value="medium">
                      Medium
                    </option>
                    <option value="high">
                      High
                    </option>
                    <option value="critical">
                      Critical
                    </option>
                  </select>
                </label>
              </div>

              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                  Source message
                </div>

                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/[0.07] dark:bg-white/[0.025]">
                  <div className="mb-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                    {sourceHeader}
                  </div>

                  <p className="max-h-28 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-zinc-200">
                    {sourceText ||
                      "No message text available."}
                  </p>
                </div>

                <p className="mt-2 text-xs text-slate-400 dark:text-zinc-500">
                  The original message is preserved in the Move description.
                </p>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-200">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => onClose?.()}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/[0.05]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !projectId ||
                  !title.trim()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Move"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
