import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Link2,
  Loader2,
  Plus,
  X,
} from "lucide-react";

import api from "../../api/client";

import {
  createProjectHandoff,
  getProjectHandoffs,
  updateProjectHandoff,
} from "../../api/handoffs";

import { useAuth } from "../../context/AuthContext";

function normalizeId(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value).trim();
  }

  return normalizeId(
    value?.userId ||
      value?.user ||
      value?.memberId ||
      value?.member ||
      value?._id ||
      value?.id
  );
}

function memberLabel(value) {
  if (!value) {
    return "Project member";
  }

  if (typeof value === "string") {
    return "Project member";
  }

  const firstName =
    value?.firstName ||
    value?.user?.firstName ||
    value?.userId?.firstName ||
    "";

  const lastName =
    value?.lastName ||
    value?.user?.lastName ||
    value?.userId?.lastName ||
    "";

  const fullName = [
    firstName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const direct =
    value?.displayName ||
    value?.name ||
    value?.fullName ||
    fullName ||
    value?.username ||
    value?.email;

  if (direct) {
    return String(direct);
  }

  const nested =
    value?.user ||
    value?.userId ||
    value?.member ||
    value?.memberId;

  if (
    nested &&
    nested !== value
  ) {
    return memberLabel(nested);
  }

  return "Project member";
}

function unwrapProject(response) {
  return (
    response?.data?.data ??
    response?.data ??
    null
  );
}

function toHandoffArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.handoffs)) {
    return value.handoffs;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  return [];
}

function getErrorMessage(error) {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong.";

  if (Array.isArray(message)) {
    return message.join(" ");
  }

  return String(message);
}

function handoffTime(item) {
  const value =
    item?.createdAt ||
    item?.updatedAt ||
    item?.acceptedAt ||
    item?.declinedAt ||
    item?.cancelledAt;

  const time = value
    ? new Date(value).getTime()
    : 0;

  return Number.isFinite(time)
    ? time
    : 0;
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !==
        new Date().getFullYear()
          ? "numeric"
          : undefined,
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function getTaskAssigneeId(task) {
  return normalizeId(
    task?.assigneeId ||
      task?.assignee ||
      task?.assignedToId ||
      task?.assignedTo
  );
}

function statusMeta(status) {
  switch (status) {
    case "accepted":
      return {
        label: "Accepted",
        classes:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
      };

    case "declined":
      return {
        label: "Declined",
        classes:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        classes:
          "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400",
      };

    default:
      return {
        label: "Pending",
        classes:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
      };
  }
}

function terminalDateFor(item) {
  if (
    item?.status === "accepted"
  ) {
    return item?.acceptedAt;
  }

  if (
    item?.status === "declined"
  ) {
    return item?.declinedAt;
  }

  if (
    item?.status === "cancelled"
  ) {
    return item?.cancelledAt;
  }

  return null;
}

function HandoffCard({
  item,
  requesterName,
  recipientName,
  respondedByName,
  currentUserId,
  busyId = "",
  disabled = false,
  readOnly = false,
  onCancel,
  onDecision,
}) {
  const id =
    normalizeId(item);

  const status =
    item?.status || "pending";

  const meta =
    statusMeta(status);

  const pending =
    status === "pending";

  const requesterId =
    normalizeId(
      item?.requestedBy
    );

  const recipientId =
    normalizeId(
      item?.recipientId
    );

  const isRequester =
    Boolean(currentUserId) &&
    currentUserId ===
      requesterId;

  const isRecipient =
    Boolean(currentUserId) &&
    currentUserId ===
      recipientId;

  const busy =
    Boolean(id) &&
    busyId === id;

  const actionsLocked =
    disabled ||
    readOnly ||
    busy;

  const canCancel =
    pending &&
    isRequester;

  const canDecide =
    pending &&
    isRecipient;

  const terminalDate =
    terminalDateFor(item);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#17171b]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
          <ArrowRightLeft className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="truncate text-sm font-black text-slate-900 dark:text-white">
                {item?.title ||
                  "Untitled handoff"}
              </h4>

              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                <span>
                  {requesterName}
                </span>

                <span aria-hidden="true">
                  →
                </span>

                <span>
                  {recipientName}
                </span>

                {item?.sourceType ===
                "move" ? (
                  <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-300">
                    <Link2 className="h-3 w-3" />
                    From Move
                  </span>
                ) : null}
              </div>
            </div>

            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${meta.classes}`}
            >
              {busy ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : null}

              {meta.label}
            </span>
          </div>

          {!pending ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              {status ===
              "accepted" ? (
                <span>
                  Accepted by{" "}
                  {respondedByName ||
                    recipientName}
                </span>
              ) : null}

              {status ===
              "declined" ? (
                <span>
                  Declined by{" "}
                  {respondedByName ||
                    recipientName}
                </span>
              ) : null}

              {status ===
              "cancelled" ? (
                <span>
                  Request cancelled
                </span>
              ) : null}

              {terminalDate ? (
                <span>
                  {formatDate(
                    terminalDate
                  )}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-zinc-200">
        {item?.context ||
          "No handoff context recorded."}
      </p>

      {item?.acceptanceCriteria ? (
        <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2.5 dark:border-violet-500/15 dark:bg-violet-500/[0.07]">
          <div className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-500 dark:text-violet-300">
            Acceptance criteria
          </div>

          <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-zinc-200">
            {item.acceptanceCriteria}
          </div>
        </div>
      ) : null}

      {item?.responseNote ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-zinc-200">
          <div className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-zinc-500">
            Response note
          </div>

          <div className="whitespace-pre-wrap leading-6">
            {item.responseNote}
          </div>
        </div>
      ) : null}

      {pending ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            {canCancel ? (
              <button
                type="button"
                disabled={
                  actionsLocked
                }
                onClick={() =>
                  onCancel?.(item)
                }
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.05]"
              >
                Cancel handoff
              </button>
            ) : null}
          </div>

          {canDecide ? (
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                disabled={
                  actionsLocked
                }
                onClick={() =>
                  onDecision?.(
                    item,
                    "declined"
                  )
                }
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
              >
                Decline
              </button>

              <button
                type="button"
                disabled={
                  actionsLocked
                }
                onClick={() =>
                  onDecision?.(
                    item,
                    "accepted"
                  )
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-xl !bg-violet-600 px-3 py-2 text-xs font-black !text-white shadow-sm shadow-violet-500/20 transition hover:!bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  color: "#ffffff",
                  WebkitTextFillColor:
                    "#ffffff",
                  backgroundColor:
                    "#7c3aed",
                }}
                data-openshare-handoff-primary="accept-card"
              >
                <Check className="h-3.5 w-3.5" />
                Accept
              </button>
            </div>
          ) : (
            !isRecipient ? (
              <div className="ml-auto text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                Waiting for{" "}
                {recipientName}
              </div>
            ) : null
          )}
        </div>
      ) : null}
    </article>
  );
}

export default function HandoffsPanel({
  projectId,
  task = null,
  members = [],
  ownerName = "",
  compact = false,
  disabled = false,
  readOnly = false,
}) {
  const { user } = useAuth();

  const [
    handoffs,
    setHandoffs,
  ] = useState([]);

  const [
    project,
    setProject,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    panelError,
    setPanelError,
  ] = useState("");

  const [
    showCreate,
    setShowCreate,
  ] = useState(false);

  const [
    showAll,
    setShowAll,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    busyId,
    setBusyId,
  ] = useState("");

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    context,
    setContext,
  ] = useState("");

  const [
    acceptanceCriteria,
    setAcceptanceCriteria,
  ] = useState("");

  const [
    recipientId,
    setRecipientId,
  ] = useState("");

  const [
    createError,
    setCreateError,
  ] = useState("");

  const [
    decision,
    setDecision,
  ] = useState(null);

  const [
    responseNote,
    setResponseNote,
  ] = useState("");

  const [
    decisionError,
    setDecisionError,
  ] = useState("");

  const currentUserId =
    normalizeId(user);

  const moveId =
    normalizeId(task);

  const isMoveMode =
    Boolean(moveId);

  const taskMoveAssigneeId =
    getTaskAssigneeId(task);

  // openshare-handoff-live-owner-v1
  // The parent task prop may remain stale for one render after
  // an accepted Move Handoff. Keep the panel authoritative
  // immediately, then fall back to the refreshed task prop.
  const [
    moveAssigneeOverrideId,
    setMoveAssigneeOverrideId,
  ] = useState("");

  useEffect(() => {
    setMoveAssigneeOverrideId("");
  }, [
    moveId,
    taskMoveAssigneeId,
  ]);

  const currentMoveAssigneeId =
    moveAssigneeOverrideId ||
    taskMoveAssigneeId;

  const currentUserOwnsMove =
    !isMoveMode ||
    (
      Boolean(currentUserId) &&
      currentMoveAssigneeId ===
        currentUserId
    );

  const load = useCallback(
    async () => {
      if (!projectId) {
        setHandoffs([]);
        setProject(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setPanelError("");

      try {
        const handoffResult =
          await getProjectHandoffs(
            projectId
          );

        setHandoffs(
          toHandoffArray(
            handoffResult
          )
        );

        try {
          const projectResponse =
            await api.get(
              `/projects/${projectId}`
            );

          setProject(
            unwrapProject(
              projectResponse
            )
          );
        } catch {
          setProject(null);
        }
      } catch (error) {
        setPanelError(
          getErrorMessage(error)
        );
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const participantEntries =
    useMemo(() => {
      const raw = [];

      if (
        Array.isArray(members)
      ) {
        raw.push(...members);
      }

      for (
        const collection of [
          project?.members,
          project?.teamMembers,
          project?.participants,
          project?.collaborators,
        ]
      ) {
        if (
          Array.isArray(
            collection
          )
        ) {
          raw.push(
            ...collection
          );
        }
      }

      const projectOwner =
        project?.owner ||
        project?.ownerId ||
        project?.createdBy ||
        project?.createdById;

      if (projectOwner) {
        raw.push(projectOwner);
      }

      const byId = new Map();

      for (const entry of raw) {
        const id =
          normalizeId(entry);

        if (!id) continue;

        const existing =
          byId.get(id);

        if (!existing) {
          byId.set(
            id,
            entry
          );
          continue;
        }

        if (
          memberLabel(existing) ===
            "Project member" &&
          memberLabel(entry) !==
            "Project member"
        ) {
          byId.set(
            id,
            entry
          );
        }
      }

      const projectOwnerId =
        normalizeId(
          projectOwner
        );

      if (
        projectOwnerId &&
        ownerName
      ) {
        const existing =
          byId.get(
            projectOwnerId
          );

        if (
          !existing ||
          memberLabel(existing) ===
            "Project member"
        ) {
          byId.set(
            projectOwnerId,
            {
              _id: projectOwnerId,
              name: ownerName,
            }
          );
        }
      }

      return Array.from(
        byId.entries()
      ).map(
        ([id, entry]) => ({
          id,
          label:
            memberLabel(entry),
        })
      );
    },
    [
      members,
      ownerName,
      project,
    ]
  );

  const eligibleRecipients =
    useMemo(
      () =>
        participantEntries.filter(
          (entry) =>
            entry.id &&
            entry.id !==
              currentUserId
        ),
      [
        participantEntries,
        currentUserId,
      ]
    );

  const nameById =
    useMemo(() => {
      const map = new Map();

      for (
        const participant of
        participantEntries
      ) {
        map.set(
          participant.id,
          participant.label
        );
      }

      return map;
    }, [participantEntries]);

  const resolveName =
    useCallback(
      (
        value,
        fallback =
          "Project member"
      ) => {
        const id =
          normalizeId(value);

        if (
          value &&
          typeof value ===
            "object"
        ) {
          const direct =
            memberLabel(value);

          if (
            direct &&
            direct !==
              "Project member"
          ) {
            return direct;
          }
        }

        return (
          nameById.get(id) ||
          fallback
        );
      },
      [nameById]
    );

  const sortedHandoffs =
    useMemo(() => {
      return [...handoffs].sort(
        (a, b) => {
          const aPending =
            a?.status ===
            "pending"
              ? 0
              : 1;

          const bPending =
            b?.status ===
            "pending"
              ? 0
              : 1;

          if (
            aPending !==
            bPending
          ) {
            return (
              aPending -
              bPending
            );
          }

          return (
            handoffTime(b) -
            handoffTime(a)
          );
        }
      );
    }, [handoffs]);

  const scopedHandoffs =
    useMemo(() => {
      if (!isMoveMode) {
        return sortedHandoffs;
      }

      return sortedHandoffs.filter(
        (item) =>
          item?.sourceType ===
            "move" &&
          normalizeId(
            item?.sourceMoveId
          ) === moveId
      );
    }, [
      isMoveMode,
      moveId,
      sortedHandoffs,
    ]);

  const preview =
    useMemo(
      () =>
        scopedHandoffs.slice(
          0,
          compact ? 3 : 4
        ),
      [
        compact,
        scopedHandoffs,
      ]
    );

  const pendingCount =
    useMemo(
      () =>
        scopedHandoffs.filter(
          (item) =>
            item?.status ===
            "pending"
        ).length,
      [scopedHandoffs]
    );

  const visibleHandoffs =
    showAll
      ? scopedHandoffs
      : preview;

  const canCreate =
    !readOnly &&
    !disabled &&
    Boolean(projectId) &&
    Boolean(currentUserId) &&
    eligibleRecipients.length > 0 &&
    currentUserOwnsMove;

  const replaceHandoff =
    useCallback(
      (updated) => {
        const updatedId =
          normalizeId(updated);

        setHandoffs(
          (current) =>
            current.map(
              (item) =>
                normalizeId(item) ===
                updatedId
                  ? updated
                  : item
            )
        );
      },
      []
    );

  const emitUpdated =
    useCallback(
      (handoff) => {
        if (
          isMoveMode &&
          handoff?.status ===
            "accepted" &&
          normalizeId(
            handoff?.sourceMoveId
          ) === moveId
        ) {
          const nextAssigneeId =
            normalizeId(
              handoff?.recipientId
            );

          if (nextAssigneeId) {
            setMoveAssigneeOverrideId(
              nextAssigneeId
            );
          }
        }

        if (
          typeof window ===
          "undefined"
        ) {
          return;
        }

        window.dispatchEvent(
          new CustomEvent(
            "openshare:handoff-updated",
            {
              detail: {
                projectId,
                handoff,
                sourceMoveId:
                  normalizeId(
                    handoff?.sourceMoveId
                  ),
              },
            }
          )
        );
      },
      [
        isMoveMode,
        moveId,
        projectId,
      ]
    );

  const resetCreate =
    useCallback(() => {
      setTitle("");
      setContext("");
      setAcceptanceCriteria("");
      setRecipientId("");
      setCreateError("");
    }, []);

  const closeCreate =
    useCallback(() => {
      if (saving) return;

      setShowCreate(false);
      resetCreate();
    }, [
      resetCreate,
      saving,
    ]);

  const handleCreate =
    useCallback(
      async (event) => {
        event.preventDefault();

        if (!canCreate) {
          return;
        }

        const cleanTitle =
          title.trim();

        const cleanContext =
          context.trim();

        const cleanCriteria =
          acceptanceCriteria.trim();

        if (!cleanTitle) {
          setCreateError(
            "Add a title for this Handoff."
          );
          return;
        }

        if (!cleanContext) {
          setCreateError(
            "Add enough context for the recipient to understand the responsibility being transferred."
          );
          return;
        }

        if (!recipientId) {
          setCreateError(
            "Choose a recipient."
          );
          return;
        }

        setSaving(true);
        setCreateError("");

        try {
          const created =
            await createProjectHandoff(
              projectId,
              {
                title:
                  cleanTitle,
                context:
                  cleanContext,
                ...(cleanCriteria
                  ? {
                      acceptanceCriteria:
                        cleanCriteria,
                    }
                  : {}),
                recipientId,
                ...(isMoveMode
                  ? {
                      sourceMoveId:
                        moveId,
                    }
                  : {}),
              }
            );

          setHandoffs(
            (current) => [
              created,
              ...current,
            ]
          );

          emitUpdated(created);

          setShowCreate(false);
          resetCreate();
        } catch (error) {
          setCreateError(
            getErrorMessage(error)
          );
        } finally {
          setSaving(false);
        }
      },
      [
        acceptanceCriteria,
        canCreate,
        context,
        emitUpdated,
        isMoveMode,
        moveId,
        projectId,
        recipientId,
        resetCreate,
        title,
      ]
    );

  const handleCancel =
    useCallback(
      async (item) => {
        const handoffId =
          normalizeId(item);

        if (
          !handoffId ||
          disabled ||
          readOnly
        ) {
          return;
        }

        setBusyId(handoffId);
        setPanelError("");

        try {
          const updated =
            await updateProjectHandoff(
              projectId,
              handoffId,
              {
                status:
                  "cancelled",
              }
            );

          replaceHandoff(
            updated
          );

          emitUpdated(updated);
        } catch (error) {
          setPanelError(
            getErrorMessage(error)
          );
        } finally {
          setBusyId("");
        }
      },
      [
        disabled,
        emitUpdated,
        projectId,
        readOnly,
        replaceHandoff,
      ]
    );

  const openDecision =
    useCallback(
      (
        item,
        status
      ) => {
        if (
          disabled ||
          readOnly
        ) {
          return;
        }

        setDecision({
          item,
          status,
        });

        setResponseNote("");
        setDecisionError("");
      },
      [
        disabled,
        readOnly,
      ]
    );

  const closeDecision =
    useCallback(() => {
      if (busyId) return;

      setDecision(null);
      setResponseNote("");
      setDecisionError("");
    }, [busyId]);

  const handleDecision =
    useCallback(
      async (event) => {
        event.preventDefault();

        const handoffId =
          normalizeId(
            decision?.item
          );

        const status =
          decision?.status;

        if (
          !handoffId ||
          ![
            "accepted",
            "declined",
          ].includes(status)
        ) {
          return;
        }

        setBusyId(handoffId);
        setDecisionError("");

        try {
          const cleanNote =
            responseNote.trim();

          const updated =
            await updateProjectHandoff(
              projectId,
              handoffId,
              {
                status,
                ...(cleanNote
                  ? {
                      responseNote:
                        cleanNote,
                    }
                  : {}),
              }
            );

          replaceHandoff(
            updated
          );

          emitUpdated(updated);

          setDecision(null);
          setResponseNote("");
        } catch (error) {
          setDecisionError(
            getErrorMessage(error)
          );
        } finally {
          setBusyId("");
        }
      },
      [
        decision,
        emitUpdated,
        projectId,
        replaceHandoff,
        responseNote,
      ]
    );

  const decisionVerb =
    decision?.status ===
    "accepted"
      ? "Accept"
      : "Decline";

  const decisionRecipient =
    resolveName(
      decision?.item
        ?.recipientId,
      "recipient"
    );

  return (
    <>
      <section
        className={`mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#151519] ${
          compact
            ? "p-4"
            : "p-5"
        }`}
        data-openshare-handoffs-panel="true"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                <ArrowRightLeft className="h-4 w-4" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Handoffs
                  </h3>

                  {pendingCount > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      {pendingCount}{" "}
                      pending
                    </span>
                  ) : null}
                </div>

                <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  {isMoveMode
                    ? "Transfer responsibility for this Move to another project member."
                    : "Make responsibility transfers explicit, reviewable, and accepted."}
                </p>
              </div>
            </div>
          </div>

          {!readOnly ? (
            <button
              type="button"
              disabled={
                !canCreate
              }
              onClick={() => {
                resetCreate();
                setShowCreate(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:!text-black dark:hover:bg-zinc-200"
            >
              <Plus className="h-3.5 w-3.5" />

              {isMoveMode
                ? "Hand off Move"
                : "New handoff"}
            </button>
          ) : null}
        </div>

        {isMoveMode &&
        !currentUserOwnsMove ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/[0.08] dark:text-amber-300">
            Only the current Move
            assignee can initiate a
            Handoff for this Move.
          </div>
        ) : null}

        {!readOnly &&
        eligibleRecipients.length ===
          0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-500 dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-zinc-400">
            Add another project
            member before creating a
            Handoff.
          </div>
        ) : null}

        {panelError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
            {panelError}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm font-semibold text-slate-500 dark:border-white/10 dark:text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Handoffs…
            </div>
          ) : visibleHandoffs.length >
            0 ? (
            visibleHandoffs.map(
              (item) => (
                <HandoffCard
                  key={
                    normalizeId(
                      item
                    ) ||
                    `${item?.title}-${handoffTime(
                      item
                    )}`
                  }
                  item={item}
                  requesterName={resolveName(
                    item?.requestedBy,
                    "Requester"
                  )}
                  recipientName={resolveName(
                    item?.recipientId,
                    "Recipient"
                  )}
                  respondedByName={resolveName(
                    item?.respondedBy,
                    ""
                  )}
                  currentUserId={
                    currentUserId
                  }
                  busyId={busyId}
                  disabled={disabled}
                  readOnly={readOnly}
                  onCancel={
                    handleCancel
                  }
                  onDecision={
                    openDecision
                  }
                />
              )
            )
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center dark:border-white/10">
              <div className="text-sm font-black text-slate-700 dark:text-zinc-200">
                No Handoffs yet
              </div>

              <div className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-zinc-400">
                {isMoveMode
                  ? "When responsibility for this Move changes, record the transfer here."
                  : "Use a Handoff when responsibility needs to move clearly from one person to another."}
              </div>
            </div>
          )}
        </div>

        {scopedHandoffs.length >
        preview.length ? (
          <button
            type="button"
            onClick={() =>
              setShowAll(
                (value) =>
                  !value
              )
            }
            className="mt-3 inline-flex items-center gap-1 text-xs font-black text-violet-600 transition hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Show all{" "}
                {scopedHandoffs.length}
              </>
            )}
          </button>
        ) : null}
      </section>

      {showCreate ? (
        <div
          className="fixed inset-0 z-[1200] overflow-y-auto bg-black/50 px-4 pb-8 pt-24 backdrop-blur-sm sm:px-6 sm:pt-28"
          role="presentation"
          data-openshare-handoff-modal="create"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCreate();
            }
          }}
        >
          <form
            onSubmit={
              handleCreate
            }
            className="mx-auto flex max-h-[calc(100vh-8rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#17171b]"
          >
            {/* openshare-handoffs-modal-actions-visibility-v2 */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-white/[0.08]">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isMoveMode
                    ? "Hand off this Move"
                    : "Create Handoff"}
                </h3>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-zinc-400">
                  {isMoveMode
                    ? "The recipient must accept before responsibility for the Move transfers."
                    : "The recipient must explicitly accept or decline the responsibility transfer."}
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={
                  closeCreate
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-white/[0.06] dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-slate-700 dark:text-zinc-200">
                  Title
                </span>

                <input
                  type="text"
                  value={title}
                  maxLength={180}
                  disabled={saving}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder={
                    isMoveMode
                      ? "Transfer responsibility for this Move"
                      : "What responsibility is being transferred?"
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#111114] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-slate-700 dark:text-zinc-200">
                  Context
                </span>

                <textarea
                  value={context}
                  maxLength={4000}
                  disabled={saving}
                  rows={4}
                  onChange={(event) =>
                    setContext(
                      event.target.value
                    )
                  }
                  placeholder="Explain what is being handed off and what the recipient needs to know."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#111114] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-slate-700 dark:text-zinc-200">
                  Acceptance criteria{" "}
                  <span className="font-semibold text-slate-400">
                    optional
                  </span>
                </span>

                <textarea
                  value={
                    acceptanceCriteria
                  }
                  maxLength={4000}
                  disabled={saving}
                  rows={3}
                  onChange={(event) =>
                    setAcceptanceCriteria(
                      event.target.value
                    )
                  }
                  placeholder="What does the recipient need to own, deliver, or understand?"
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#111114] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-slate-700 dark:text-zinc-200">
                  Recipient
                </span>

                <select
                  value={
                    recipientId
                  }
                  disabled={saving}
                  onChange={(event) =>
                    setRecipientId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#111114] dark:text-white"
                >
                  <option value="">
                    Choose a project member
                  </option>

                  {eligibleRecipients.map(
                    (entry) => (
                      <option
                        key={
                          entry.id
                        }
                        value={
                          entry.id
                        }
                      >
                        {
                          entry.label
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              {isMoveMode ? (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-semibold leading-5 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/[0.08] dark:text-violet-300">
                  Accepting this
                  Handoff transfers
                  canonical responsibility
                  for the Move to the
                  recipient.
                </div>
              ) : null}

              {createError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
                  {createError}
                </div>
              ) : null}
            </div>

            <div className="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 dark:border-white/[0.08] dark:bg-[#17171b]">
              <button
                type="button"
                disabled={saving}
                onClick={
                  closeCreate
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.05]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl !bg-violet-600 px-4 py-2.5 text-sm font-black !text-white shadow-sm shadow-violet-500/20 transition hover:!bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  color: "#ffffff",
                  WebkitTextFillColor:
                    "#ffffff",
                  backgroundColor:
                    "#7c3aed",
                }}
                data-openshare-handoff-primary="create"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRightLeft className="h-4 w-4" />
                )}

                {isMoveMode
                  ? "Send Handoff"
                  : "Create Handoff"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {decision ? (
        <div
          className="fixed inset-0 z-[1210] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
          role="presentation"
          data-openshare-handoff-modal="decision"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDecision();
            }
          }}
        >
          <form
            onSubmit={
              handleDecision
            }
            className="flex max-h-[calc(100vh-4rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#17171b]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-white/[0.08]">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {decisionVerb}{" "}
                  Handoff
                </h3>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-zinc-400">
                  {decision?.status ===
                    "accepted" &&
                  decision?.item
                    ?.sourceType ===
                    "move"
                    ? "Accepting transfers this Move to you."
                    : `${decisionVerb} the responsibility transfer for ${decisionRecipient}.`}
                </p>
              </div>

              <button
                type="button"
                disabled={
                  Boolean(busyId)
                }
                onClick={
                  closeDecision
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-white/[0.06] dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-slate-700 dark:text-zinc-200">
                  Response note{" "}
                  <span className="font-semibold text-slate-400">
                    optional
                  </span>
                </span>

                <textarea
                  value={
                    responseNote
                  }
                  maxLength={4000}
                  disabled={
                    Boolean(busyId)
                  }
                  rows={4}
                  onChange={(event) =>
                    setResponseNote(
                      event.target.value
                    )
                  }
                  placeholder={
                    decision?.status ===
                    "accepted"
                      ? "Add any acknowledgement or next step."
                      : "Explain why you are declining, if useful."
                  }
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#111114] dark:text-white"
                />
              </label>

              {decisionError ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
                  {decisionError}
                </div>
              ) : null}
            </div>

            <div className="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 dark:border-white/[0.08] dark:bg-[#17171b]">
              <button
                type="button"
                disabled={
                  Boolean(busyId)
                }
                onClick={
                  closeDecision
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.05]"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={
                  Boolean(busyId)
                }
                className={
                  decision?.status ===
                  "accepted"
                    ? "inline-flex items-center justify-center gap-2 rounded-xl !bg-violet-600 px-4 py-2.5 text-sm font-black !text-white shadow-sm shadow-violet-500/20 transition hover:!bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                    : "inline-flex items-center justify-center gap-2 rounded-xl !bg-rose-600 px-4 py-2.5 text-sm font-black !text-white transition hover:!bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                }
                style={{
                  color: "#ffffff",
                  WebkitTextFillColor:
                    "#ffffff",
                  backgroundColor:
                    decision?.status ===
                    "accepted"
                      ? "#7c3aed"
                      : "#e11d48",
                }}
                data-openshare-handoff-primary="decision"
              >
                {busyId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : decision?.status ===
                  "accepted" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}

                {decisionVerb}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
