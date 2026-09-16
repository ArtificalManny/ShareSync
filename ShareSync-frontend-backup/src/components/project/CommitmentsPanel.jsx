import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Handshake,
  Link2,
  Loader2,
  Plus,
  RotateCcw,
  UserRound,
  X,
} from "lucide-react";

import api from "../../api/client";

import {
  createProjectCommitment,
  getProjectCommitments,
  updateProjectCommitment,
} from "../../api/commitments";

function normalizeId(value) {
  if (!value) return "";

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

function memberLabel(member) {
  if (!member) return "Project member";

  if (
    typeof member === "string" ||
    typeof member === "number"
  ) {
    return String(member);
  }

  const nested =
    member?.user ||
    member?.member ||
    member?.profile ||
    {};

  const firstName =
    member?.firstName ||
    nested?.firstName ||
    "";

  const lastName =
    member?.lastName ||
    nested?.lastName ||
    "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  return (
    member?.name ||
    member?.displayName ||
    member?.fullName ||
    nested?.name ||
    nested?.displayName ||
    nested?.fullName ||
    fullName ||
    member?.username ||
    nested?.username ||
    member?.email ||
    nested?.email ||
    "Project member"
  );
}

function unwrap(response) {
  return (
    response?.data?.data ??
    response?.data?.project ??
    response?.data ??
    response
  );
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(date);
}

function dateInputToIso(value) {
  if (!value) return "";

  const parts = String(value)
    .split("-")
    .map(Number);

  if (
    parts.length !== 3 ||
    parts.some(
      (part) => !Number.isFinite(part)
    )
  ) {
    return "";
  }

  const [year, month, day] =
    parts;

  const date = new Date(
    year,
    month - 1,
    day,
    23,
    59,
    0,
    0
  );

  return Number.isNaN(
    date.getTime()
  )
    ? ""
    : date.toISOString();
}

function getErrorMessage(error) {
  const raw =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Commitments could not be updated.";

  return Array.isArray(raw)
    ? raw.join(" ")
    : String(raw);
}

function getDueMeta(item) {
  if (
    item?.status !== "active" ||
    !item?.dueAt
  ) {
    return {
      overdue: false,
      label: "",
    };
  }

  const due = new Date(item.dueAt);

  if (Number.isNaN(due.getTime())) {
    return {
      overdue: false,
      label: "",
    };
  }

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const dueDay = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate()
  );

  const diffDays =
    Math.round(
      (dueDay - today) /
        86400000
    );

  if (diffDays < 0) {
    const amount =
      Math.abs(diffDays);

    return {
      overdue: true,
      label:
        amount === 1
          ? "Overdue by 1 day"
          : `Overdue by ${amount} days`,
    };
  }

  if (diffDays === 0) {
    return {
      overdue: false,
      label: "Due today",
    };
  }

  if (diffDays === 1) {
    return {
      overdue: false,
      label: "Due tomorrow",
    };
  }

  return {
    overdue: false,
    label: `Due in ${diffDays} days`,
  };
}

function StatusBadge({
  status,
  overdue = false,
}) {
  if (status === "fulfilled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
        <CheckCircle2 className="h-2.5 w-2.5" />
        Fulfilled
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-400">
        <Ban className="h-2.5 w-2.5" />
        Cancelled
      </span>
    );
  }

  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
        <Clock3 className="h-2.5 w-2.5" />
        Overdue
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300">
      <Clock3 className="h-2.5 w-2.5" />
      Active
    </span>
  );
}

function CommitmentCard({
  item,
  ownerName,
  compact = false,
  busyId = "",
  readOnly = false,
  disabled = false,
  onStatus,
}) {
  const id = normalizeId(item);

  const due =
    getDueMeta(item);

  const active =
    item?.status === "active";

  return (
    <article
      className={[
        "rounded-2xl border",
        compact
          ? "px-3.5 py-3"
          : "p-4",
        item?.status === "cancelled"
          ? "border-slate-200 bg-slate-50/75 opacity-75 dark:border-white/[0.07] dark:bg-white/[0.025]"
          : due.overdue
            ? "border-rose-200 bg-rose-50/35 dark:border-rose-500/20 dark:bg-rose-500/[0.045]"
            : "border-slate-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.035]",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="min-w-0 truncate text-sm font-black text-slate-900 dark:text-white">
              {item?.title ||
                "Untitled commitment"}
            </h4>

            <StatusBadge
              status={item?.status}
              overdue={due.overdue}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-3 w-3" />
              {ownerName ||
                "Project member"}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3 w-3" />
              Due{" "}
              {formatDate(
                item?.dueAt
              ) || "—"}
            </span>

            {item?.sourceType ===
            "move" ? (
              <span className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-300">
                <Link2 className="h-3 w-3" />
                From Move
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-zinc-200">
        {item?.commitment ||
          "No commitment text recorded."}
      </p>

      {active &&
      due.label ? (
        <div
          className={[
            "mt-3 text-[11px] font-black",
            due.overdue
              ? "text-rose-600 dark:text-rose-300"
              : "text-slate-400 dark:text-zinc-500",
          ].join(" ")}
        >
          {due.label}
        </div>
      ) : null}

      {!readOnly ? (
        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
          {active ? (
            <>
              <button
                type="button"
                onClick={() =>
                  onStatus?.(
                    item,
                    "cancelled"
                  )
                }
                disabled={
                  disabled ||
                  busyId === id
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08]"
              >
                <Ban className="h-3.5 w-3.5" />
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  onStatus?.(
                    item,
                    "fulfilled"
                  )
                }
                disabled={
                  disabled ||
                  busyId === id
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                {busyId === id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Mark fulfilled
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() =>
                onStatus?.(
                  item,
                  "active"
                )
              }
              disabled={
                disabled ||
                busyId === id
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] font-black text-violet-700 transition hover:bg-violet-100 disabled:opacity-50 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300"
            >
              {busyId === id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Reopen
            </button>
          )}
        </div>
      ) : null}
    </article>
  );
}

export default function CommitmentsPanel({
  projectId,
  task = null,
  members = [],
  ownerName = "",
  compact = false,
  disabled = false,
  readOnly = false,
} = {}) {
  const taskId =
    normalizeId(task);

  const isMoveMode =
    Boolean(taskId);

  const [
    commitments,
    setCommitments,
  ] = useState([]);

  const [
    projectPayload,
    setProjectPayload,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [showAll, setShowAll] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [busyId, setBusyId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [
    commitmentText,
    setCommitmentText,
  ] = useState("");

  const [ownerId, setOwnerId] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const load = useCallback(
    async () => {
      if (!projectId) {
        setCommitments([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          commitmentResult,
          projectResult,
        ] =
          await Promise.all([
            getProjectCommitments(
              projectId
            ),

            api
              .get(
                `/projects/${projectId}`
              )
              .catch(() => null),
          ]);

        setCommitments(
          Array.isArray(
            commitmentResult
          )
            ? commitmentResult
            : []
        );

        setProjectPayload(
          projectResult
            ? unwrap(projectResult)
            : null
        );
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const memberOptions =
    useMemo(() => {
      const seen = new Set();

      const projectMembers =
        Array.isArray(
          projectPayload?.members
        )
          ? projectPayload.members
          : [];

      /* openshare-commitments-owner-label-v2 */
      const projectOwnerIds =
        new Set(
          [
            projectPayload?.ownerId,
            projectPayload?.owner,
            projectPayload?.createdBy,
            projectPayload?.createdById,
          ]
            .map(normalizeId)
            .filter(Boolean)
        );

      const cleanOwnerName =
        typeof ownerName === "string"
          ? ownerName.trim()
          : "";

      const candidates = [
        ...(Array.isArray(members)
          ? members
          : []),

        ...projectMembers,

        projectPayload?.owner,
        projectPayload?.createdBy,
        projectPayload?.ownerId,
        projectPayload?.createdById,
      ].filter(Boolean);

      return candidates
        .map((member) => {
          const id =
            normalizeId(member);

          let label =
            memberLabel(member);

          if (
            cleanOwnerName &&
            projectOwnerIds.has(id)
          ) {
            label =
              cleanOwnerName;
          }

          return {
            id,
            label,
          };
        })
        .filter((member) => {
          if (
            !member.id ||
            seen.has(member.id)
          ) {
            return false;
          }

          seen.add(member.id);
          return true;
        });
    }, [
      members,
      ownerName,
      projectPayload,
    ]);

  useEffect(() => {
    if (
      !ownerId &&
      memberOptions.length === 1
    ) {
      setOwnerId(
        memberOptions[0].id
      );
    }
  }, [
    memberOptions,
    ownerId,
  ]);

  const ownerNameById =
    useMemo(
      () =>
        new Map(
          memberOptions.map(
            (member) => [
              member.id,
              member.label,
            ]
          )
        ),
      [memberOptions]
    );

  const scopedCommitments =
    useMemo(() => {
      const all =
        Array.isArray(
          commitments
        )
          ? commitments
          : [];

      const scoped = isMoveMode
        ? all.filter(
            (item) =>
              item?.sourceType ===
                "move" &&
              normalizeId(
                item?.sourceMoveId
              ) === taskId
          )
        : all;

      return [...scoped].sort(
        (a, b) => {
          const statusOrder = {
            active: 0,
            fulfilled: 1,
            cancelled: 2,
          };

          const statusDiff =
            (statusOrder[
              a?.status
            ] ?? 9) -
            (statusOrder[
              b?.status
            ] ?? 9);

          if (statusDiff !== 0) {
            return statusDiff;
          }

          const aDue =
            new Date(
              a?.dueAt || 0
            ).getTime() || 0;

          const bDue =
            new Date(
              b?.dueAt || 0
            ).getTime() || 0;

          return aDue - bDue;
        }
      );
    }, [
      commitments,
      isMoveMode,
      taskId,
    ]);

  const activeCount =
    scopedCommitments.filter(
      (item) =>
        item?.status === "active"
    ).length;

  const overdueCount =
    scopedCommitments.filter(
      (item) =>
        getDueMeta(item).overdue
    ).length;

  const preview =
    scopedCommitments.slice(
      0,
      compact ? 3 : 3
    );

  const resetForm = () => {
    setTitle("");
    setCommitmentText("");
    setDueDate("");

    if (
      memberOptions.length === 1
    ) {
      setOwnerId(
        memberOptions[0].id
      );
    } else {
      setOwnerId("");
    }
  };

  const openCreate = () => {
    if (
      readOnly ||
      disabled
    ) {
      return;
    }

    resetForm();
    setError("");
    setShowCreate(true);
  };

  const closeCreate = () => {
    if (saving) return;

    setShowCreate(false);
    setError("");
    resetForm();
  };

  const handleCreate =
    async (event) => {
      event?.preventDefault?.();

      const cleanTitle =
        title.trim();

      const cleanCommitment =
        commitmentText.trim();

      if (!cleanTitle) {
        setError(
          "Give this commitment a short title."
        );
        return;
      }

      if (!cleanCommitment) {
        setError(
          "Record the explicit promise being made."
        );
        return;
      }

      if (!ownerId) {
        setError(
          "Choose who owns this commitment."
        );
        return;
      }

      const dueAt =
        dateInputToIso(
          dueDate
        );

      if (!dueAt) {
        setError(
          "Choose a due date."
        );
        return;
      }

      setSaving(true);
      setError("");

      try {
        const created =
          await createProjectCommitment(
            projectId,
            {
              title:
                cleanTitle,

              commitment:
                cleanCommitment,

              ownerId,

              dueAt,

              sourceType:
                isMoveMode
                  ? "move"
                  : "project",

              ...(isMoveMode
                ? {
                    sourceMoveId:
                      taskId,
                  }
                : {}),
            }
          );

        setCommitments(
          (current) => [
            created,
            ...(Array.isArray(
              current
            )
              ? current
              : []),
          ]
        );

        setShowCreate(false);
        resetForm();
      } catch (createError) {
        setError(
          getErrorMessage(
            createError
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const handleStatus =
    async (
      item,
      status
    ) => {
      if (
        readOnly ||
        disabled
      ) {
        return;
      }

      const commitmentId =
        normalizeId(item);

      if (!commitmentId) return;

      setBusyId(
        commitmentId
      );

      setError("");

      try {
        const updated =
          await updateProjectCommitment(
            projectId,
            commitmentId,
            {
              status,
            }
          );

        setCommitments(
          (current) =>
            (
              Array.isArray(current)
                ? current
                : []
            ).map((candidate) =>
              normalizeId(
                candidate
              ) === commitmentId
                ? updated
                : candidate
            )
        );
      } catch (updateError) {
        setError(
          getErrorMessage(
            updateError
          )
        );
      } finally {
        setBusyId("");
      }
    };

  return (
    <>
      <style>{`
        [data-commitments-panel="true"]
        button[data-commitments-primary="true"] {
          background: linear-gradient(
            90deg,
            #7c3aed 0%,
            #8b5cf6 50%,
            #a855f7 100%
          ) !important;
          background-color: #7c3aed !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          border-color: transparent !important;
          opacity: 1 !important;
        }

        [data-commitments-panel="true"]
        button[data-commitments-primary="true"] svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        [data-commitments-panel="true"]
        button[data-commitments-primary="true"]:disabled {
          background: #e2e8f0 !important;
          background-image: none !important;
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
          cursor: not-allowed !important;
          opacity: 1 !important;
        }

        .dark [data-commitments-panel="true"]
        button[data-commitments-primary="true"]:disabled {
          background: rgba(255,255,255,0.08) !important;
          color: #71717a !important;
          -webkit-text-fill-color: #71717a !important;
        }
      `}</style>

      <section
        data-commitments-panel="true"
        className={[
          "overflow-hidden border bg-white dark:border-white/10 dark:bg-white/[0.035]",
          compact
            ? "rounded-2xl border-slate-200"
            : "mb-8 rounded-[28px] border-slate-200/80 shadow-[0_18px_55px_rgba(15,23,42,0.06)] dark:shadow-none",
        ].join(" ")}
      >
        {!compact ? (
          <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400" />
        ) : null}

        <div
          className={[
            "flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06]",
            compact
              ? "px-4 py-3.5"
              : "px-5 py-5 md:px-6",
          ].join(" ")}
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
              <Handshake className="h-5 w-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={[
                    "font-black text-slate-950 dark:text-white",
                    compact
                      ? "text-sm"
                      : "text-lg tracking-tight",
                  ].join(" ")}
                >
                  Commitments
                </h3>

                {!loading ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                    {activeCount} active
                  </span>
                ) : null}

                {!loading &&
                overdueCount > 0 ? (
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-rose-600 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
                    {overdueCount} overdue
                  </span>
                ) : null}
              </div>

              <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-zinc-400">
                {isMoveMode
                  ? "Promises attached to this Move."
                  : "Explicit promises with an owner and deadline."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!compact &&
            scopedCommitments.length >
              0 ? (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setShowAll(true);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200"
              >
                View all
              </button>
            ) : null}

            {!readOnly ? (
              <button
                type="button"
                data-commitments-primary="true"
                onClick={
                  openCreate
                }
                disabled={
                  disabled ||
                  loading
                }
                className={[
                  "inline-flex items-center gap-2 rounded-xl font-black shadow-sm transition",
                  compact
                    ? "px-3 py-2 text-xs"
                    : "px-4 py-2.5 text-sm",
                ].join(" ")}
              >
                <Plus className="h-4 w-4" />
                Add commitment
              </button>
            ) : null}
          </div>
        </div>

        <div
          className={
            compact
              ? "p-4"
              : "p-5 md:p-6"
          }
        >
          {error &&
          !showCreate &&
          !showAll ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading commitments…
              </div>
            </div>
          ) : preview.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-6 text-center dark:border-white/10">
              <Handshake className="mx-auto h-6 w-6 text-slate-300 dark:text-zinc-600" />

              <div className="mt-3 text-sm font-black text-slate-800 dark:text-zinc-100">
                No commitments yet
              </div>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-zinc-400">
                Record an explicit promise, assign its owner, and give it a deadline.
              </p>
            </div>
          ) : (
            <div
              className={
                compact
                  ? "space-y-3"
                  : "grid gap-3 lg:grid-cols-3"
              }
            >
              {preview.map(
                (item, index) => (
                  <CommitmentCard
                    key={
                      normalizeId(item) ||
                      `commitment-${index}`
                    }
                    item={item}
                    compact={compact}
                    ownerName={
                      ownerNameById.get(
                        normalizeId(
                          item?.ownerId
                        )
                      ) ||
                      "Project member"
                    }
                    busyId={busyId}
                    readOnly={readOnly}
                    disabled={
                      disabled
                    }
                    onStatus={
                      handleStatus
                    }
                  />
                )
              )}
            </div>
          )}

          {compact &&
          scopedCommitments.length >
            preview.length ? (
            <div className="mt-3 text-center text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
              +
              {scopedCommitments.length -
                preview.length}{" "}
              older commitment
              {scopedCommitments.length -
                preview.length ===
              1
                ? ""
                : "s"}{" "}
              in the project
            </div>
          ) : null}
        </div>
      </section>

      {showCreate ? (
        <div
          className="fixed inset-0 z-[195] flex items-start justify-center overflow-y-auto bg-slate-950/55 px-4 pb-6 pt-[88px] backdrop-blur-sm md:pt-[96px]"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCreate();
            }
          }}
        >
          <div className="flex max-h-[calc(100vh-120px)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111113]">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-white/[0.07]">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">
                  Commitments
                </div>

                <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                  Add commitment
                </h3>

                {isMoveMode ? (
                  <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-300">
                    <Link2 className="h-3 w-3" />
                    Linked to this Move automatically
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={closeCreate}
                disabled={saving}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6"
            >
              {error ? (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </div>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                  Commitment title
                </span>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  maxLength={300}
                  autoFocus
                  disabled={saving}
                  placeholder="Complete production QA"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#19191f] dark:text-white"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                  What is being promised?
                </span>

                <textarea
                  value={
                    commitmentText
                  }
                  onChange={(event) =>
                    setCommitmentText(
                      event.target.value
                    )
                  }
                  maxLength={5000}
                  rows={4}
                  disabled={saving}
                  placeholder="Manny commits to completing production QA before launch."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#19191f] dark:text-zinc-100"
                />
              </label>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                    <UserRound className="h-3.5 w-3.5" />
                    Owner
                  </span>

                  <select
                    value={ownerId}
                    onChange={(event) =>
                      setOwnerId(
                        event.target.value
                      )
                    }
                    disabled={
                      saving ||
                      !memberOptions.length
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#19191f] dark:text-white"
                  >
                    <option value="">
                      Select owner
                    </option>

                    {memberOptions.map(
                      (member) => (
                        <option
                          key={
                            member.id
                          }
                          value={
                            member.id
                          }
                        >
                          {
                            member.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                    <CalendarClock className="h-3.5 w-3.5" />
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
                    disabled={saving}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#19191f] dark:text-white"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5 dark:border-white/[0.07]">
                <button
                  type="button"
                  onClick={closeCreate}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  data-commitments-primary="true"
                  disabled={
                    saving ||
                    !title.trim() ||
                    !commitmentText.trim() ||
                    !ownerId ||
                    !dueDate
                  }
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Handshake className="h-4 w-4" />
                  )}

                  {saving
                    ? "Adding…"
                    : "Add commitment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showAll ? (
        <div
          className="fixed inset-0 z-[195] flex items-start justify-center overflow-y-auto bg-slate-950/55 px-4 pb-6 pt-[88px] backdrop-blur-sm md:pt-[96px]"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowAll(false);
            }
          }}
        >
          <div className="flex max-h-[calc(100vh-120px)] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111113]">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.07]">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">
                  Commitments
                </div>

                <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                  Project commitments
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAll(false)
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-white/10 dark:text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
              {error ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </div>
              ) : null}

              <div className="space-y-3">
                {scopedCommitments.map(
                  (item, index) => (
                    <CommitmentCard
                      key={
                        normalizeId(
                          item
                        ) ||
                        `commitment-all-${index}`
                      }
                      item={item}
                      ownerName={
                        ownerNameById.get(
                          normalizeId(
                            item?.ownerId
                          )
                        ) ||
                        "Project member"
                      }
                      busyId={busyId}
                      readOnly={
                        readOnly
                      }
                      disabled={
                        disabled
                      }
                      onStatus={
                        handleStatus
                      }
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
