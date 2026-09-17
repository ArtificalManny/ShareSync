import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Ban,
  Check,
  CheckCircle2,
  Clock3,
  Link2,
  Plus,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import api from "../../api/client";
import {
  createProjectApproval,
  getProjectApprovals,
  updateProjectApproval,
} from "../../api/approvals";
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

function unwrapProject(response) {
  return (
    response?.data?.data ??
    response?.data?.project ??
    response?.data ??
    response
  );
}

function toApprovalArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.approvals)) {
    return value.approvals;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.results)) {
    return value.results;
  }

  return [];
}

function getErrorMessage(error) {
  const raw =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Approvals could not be updated.";

  return Array.isArray(raw)
    ? raw.join(" ")
    : String(raw);
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

function approvalTime(item) {
  const raw =
    item?.decidedAt ||
    item?.cancelledAt ||
    item?.updatedAt ||
    item?.createdAt;

  const date = raw
    ? new Date(raw)
    : null;

  return date &&
    !Number.isNaN(date.getTime())
    ? date.getTime()
    : 0;
}

function StatusBadge({ status }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
        <CheckCircle2 className="h-2.5 w-2.5" />
        Approved
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
        <XCircle className="h-2.5 w-2.5" />
        Rejected
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

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300">
      <Clock3 className="h-2.5 w-2.5" />
      Pending
    </span>
  );
}

function ApprovalCard({
  item,
  requesterName,
  approverName,
  decidedByName,
  currentUserId,
  compact = false,
  busyId = "",
  readOnly = false,
  disabled = false,
  onCancel,
  onDecision,
}) {
  const id = normalizeId(item);
  const status =
    item?.status || "pending";

  const pending =
    status === "pending";

  const requesterId =
    normalizeId(item?.requestedBy);

  const approverId =
    normalizeId(item?.approverId);

  const isRequester =
    Boolean(currentUserId) &&
    currentUserId === requesterId;

  const isApprover =
    Boolean(currentUserId) &&
    currentUserId === approverId;

  const busy =
    Boolean(id) &&
    busyId === id;

  const actionsLocked =
    readOnly ||
    disabled ||
    busy;

  const canCancel =
    pending &&
    isRequester &&
    !readOnly &&
    !disabled;

  const canDecide =
    pending &&
    isApprover &&
    !readOnly &&
    !disabled;

  const terminalDate =
    status === "cancelled"
      ? item?.cancelledAt ||
        item?.updatedAt
      : item?.decidedAt ||
        item?.updatedAt;

  return (
    <article
      className={[
        "rounded-2xl border",
        compact
          ? "px-3.5 py-3"
          : "p-4",
        status === "approved"
          ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-500/20 dark:bg-emerald-500/[0.035]"
          : status === "rejected"
            ? "border-rose-200 bg-rose-50/30 dark:border-rose-500/20 dark:bg-rose-500/[0.035]"
            : status === "cancelled"
              ? "border-slate-200 bg-slate-50/75 opacity-80 dark:border-white/[0.07] dark:bg-white/[0.025]"
              : "border-slate-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.035]",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="min-w-0 truncate text-sm font-black text-slate-900 dark:text-white">
              {item?.title ||
                "Untitled approval"}
            </h4>

            <StatusBadge
              status={status}
            />
          </div>

          {pending ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-3 w-3" />
                Requested by{" "}
                {requesterName}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3" />
                Approver:{" "}
                {approverName}
              </span>

              {item?.sourceType ===
              "move" ? (
                <span className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-300">
                  <Link2 className="h-3 w-3" />
                  From Move
                </span>
              ) : null}
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              {status === "approved" ? (
                <span>
                  Approved by{" "}
                  {decidedByName ||
                    approverName}
                </span>
              ) : null}

              {status === "rejected" ? (
                <span>
                  Rejected by{" "}
                  {decidedByName ||
                    approverName}
                </span>
              ) : null}

              {status === "cancelled" ? (
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

              {item?.sourceType ===
              "move" ? (
                <span className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-300">
                  <Link2 className="h-3 w-3" />
                  From Move
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-zinc-200">
        {item?.request ||
          "No approval request recorded."}
      </p>

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
                disabled={actionsLocked}
                onClick={() =>
                  onCancel?.(item)
                }
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.05]"
              >
                Cancel request
              </button>
            ) : null}
          </div>

          {canDecide ? (
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                disabled={actionsLocked}
                onClick={() =>
                  onDecision?.(
                    item,
                    "rejected"
                  )
                }
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
              >
                Reject
              </button>

              <button
                type="button"
                disabled={actionsLocked}
                onClick={() =>
                  onDecision?.(
                    item,
                    "approved"
                  )
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 text-xs font-black !text-white shadow-sm shadow-violet-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  color: "#ffffff",
                }}
                data-openshare-approval-primary="true"
              >
                <Check className="h-3.5 w-3.5" />
                Approve
              </button>
            </div>
          ) : (
            !isApprover ? (
              <div className="ml-auto text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                Waiting for{" "}
                {approverName}
              </div>
            ) : null
          )}
        </div>
      ) : null}
    </article>
  );
}

export default function ApprovalsPanel({
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
    approvals,
    setApprovals,
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
    requestText,
    setRequestText,
  ] = useState("");

  const [
    approverId,
    setApproverId,
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

  const load = useCallback(
    async () => {
      if (!projectId) {
        setApprovals([]);
        setProject(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setPanelError("");

      try {
        const approvalResult =
          await getProjectApprovals(
            projectId
          );

        setApprovals(
          toApprovalArray(
            approvalResult
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

      if (Array.isArray(members)) {
        raw.push(...members);
      }

      if (
        Array.isArray(
          project?.members
        )
      ) {
        raw.push(
          ...project.members
        );
      }

      if (
        Array.isArray(
          project?.participants
        )
      ) {
        raw.push(
          ...project.participants
        );
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
        const current =
          byId.get(
            projectOwnerId
          );

        if (
          !current ||
          memberLabel(current) ===
            "Project member" ||
          memberLabel(current) ===
            projectOwnerId
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
          label: memberLabel(
            entry
          ),
        })
      );
    },
    [
      members,
      ownerName,
      project,
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

  const sortedApprovals =
    useMemo(() => {
      return [...approvals].sort(
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
            approvalTime(b) -
            approvalTime(a)
          );
        }
      );
    }, [approvals]);

  const scopedApprovals =
    useMemo(() => {
      if (!isMoveMode) {
        return sortedApprovals;
      }

      return sortedApprovals.filter(
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
      sortedApprovals,
    ]);

  const preview =
    useMemo(() => {
      return scopedApprovals.slice(
        0,
        compact ? 3 : 4
      );
    }, [
      compact,
      scopedApprovals,
    ]);

  const pendingCount =
    useMemo(
      () =>
        scopedApprovals.filter(
          (item) =>
            item?.status ===
            "pending"
        ).length,
      [scopedApprovals]
    );

  const replaceApproval =
    useCallback(
      (updated) => {
        const updatedId =
          normalizeId(updated);

        if (!updatedId) {
          return;
        }

        setApprovals(
          (current) =>
            current.map(
              (item) =>
                normalizeId(
                  item
                ) === updatedId
                  ? updated
                  : item
            )
        );
      },
      []
    );

  const resetCreateForm =
    () => {
      setTitle("");
      setRequestText("");
      setApproverId("");
      setCreateError("");
    };

  const openCreate = () => {
    if (
      readOnly ||
      disabled
    ) {
      return;
    }

    resetCreateForm();

    if (
      participantEntries.length ===
      1
    ) {
      setApproverId(
        participantEntries[0]
          .id
      );
    }

    setShowCreate(true);
  };

  const closeCreate = () => {
    if (saving) return;

    setShowCreate(false);
    resetCreateForm();
  };

  const handleCreate =
    async (event) => {
      event?.preventDefault?.();

      const cleanTitle =
        title.trim();

      const cleanRequest =
        requestText.trim();

      if (!cleanTitle) {
        setCreateError(
          "Give this approval request a short title."
        );
        return;
      }

      if (!cleanRequest) {
        setCreateError(
          "Describe exactly what needs approval."
        );
        return;
      }

      if (!approverId) {
        setCreateError(
          "Choose the project member who must approve or reject this request."
        );
        return;
      }

      setSaving(true);
      setCreateError("");

      try {
        const payload = {
          title: cleanTitle,
          request: cleanRequest,
          approverId,
        };

        if (isMoveMode) {
          payload.sourceMoveId =
            moveId;
        }

        const created =
          await createProjectApproval(
            projectId,
            payload
          );

        setApprovals(
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
        resetCreateForm();
      } catch (error) {
        setCreateError(
          getErrorMessage(error)
        );
      } finally {
        setSaving(false);
      }
    };

  const handleCancel =
    async (item) => {
      if (
        readOnly ||
        disabled
      ) {
        return;
      }

      const approvalId =
        normalizeId(item);

      if (!approvalId) return;

      setBusyId(approvalId);
      setPanelError("");

      try {
        const updated =
          await updateProjectApproval(
            projectId,
            approvalId,
            {
              status:
                "cancelled",
            }
          );

        replaceApproval(updated);
      } catch (error) {
        setPanelError(
          getErrorMessage(error)
        );
      } finally {
        setBusyId("");
      }
    };

  const openDecision = (
    item,
    status
  ) => {
    if (
      readOnly ||
      disabled
    ) {
      return;
    }

    setDecision({
      item,
      status,
    });

    setResponseNote("");
    setDecisionError("");
  };

  const closeDecision = () => {
    if (busyId) return;

    setDecision(null);
    setResponseNote("");
    setDecisionError("");
  };

  const handleDecision =
    async (event) => {
      event?.preventDefault?.();

      if (!decision?.item) {
        return;
      }

      const approvalId =
        normalizeId(
          decision.item
        );

      if (!approvalId) {
        return;
      }

      setBusyId(approvalId);
      setDecisionError("");

      try {
        const updates = {
          status:
            decision.status,
        };

        const cleanNote =
          responseNote.trim();

        if (cleanNote) {
          updates.responseNote =
            cleanNote;
        }

        const updated =
          await updateProjectApproval(
            projectId,
            approvalId,
            updates
          );

        replaceApproval(updated);

        setDecision(null);
        setResponseNote("");
      } catch (error) {
        setDecisionError(
          getErrorMessage(error)
        );
      } finally {
        setBusyId("");
      }
    };

  const renderCard = (
    item,
    index,
    prefix
  ) => (
    <ApprovalCard
      key={
        normalizeId(item) ||
        `${prefix}-${index}`
      }
      item={item}
      compact={compact}
      requesterName={resolveName(
        item?.requestedBy,
        "Project member"
      )}
      approverName={resolveName(
        item?.approverId,
        "Project member"
      )}
      decidedByName={resolveName(
        item?.decidedBy,
        ""
      )}
      currentUserId={
        currentUserId
      }
      busyId={busyId}
      readOnly={readOnly}
      disabled={disabled}
      onCancel={handleCancel}
      onDecision={
        openDecision
      }
    />
  );

  return (
    <>
      {/* openshare-approvals-primary-button-visibility-v1 */}
      <style>{`
        [data-openshare-approval-primary="true"] {
          background-color: #7c3aed !important;
          background-image: linear-gradient(
            90deg,
            #7c3aed 0%,
            #c026d3 100%
          ) !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          border-color: transparent !important;
          visibility: visible !important;
        }

        [data-openshare-approval-primary="true"] span,
        [data-openshare-approval-primary="true"] svg {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          stroke: #ffffff !important;
        }
      `}</style>

      <section
        className={[
          "rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#111216]",
          compact
            ? "p-4"
            : "p-5 md:p-6",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Approvals
                </h3>

                <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  {pendingCount === 1
                    ? "1 request waiting for a decision"
                    : `${pendingCount} requests waiting for a decision`}
                </p>
              </div>
            </div>
          </div>

          {!readOnly &&
          !disabled ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3.5 py-2.5 text-xs font-black !text-white shadow-sm shadow-violet-500/20 transition hover:brightness-105"
              style={{
                color: "#ffffff",
              }}
              data-openshare-primary="request-approval"
              data-openshare-approval-primary="true"
            >
              <Plus className="h-3.5 w-3.5" />
              Request approval
            </button>
          ) : null}
        </div>

        {panelError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
            {panelError}
          </div>
        ) : null}

        <div className="mt-4">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm font-semibold text-slate-400 dark:border-white/[0.08] dark:text-zinc-500">
              Loading approvals…
            </div>
          ) : scopedApprovals.length ===
            0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center dark:border-white/[0.08]">
              <ShieldCheck className="mx-auto h-5 w-5 text-slate-300 dark:text-zinc-600" />

              <div className="mt-2 text-sm font-black text-slate-700 dark:text-zinc-200">
                No approvals yet
              </div>

              <div className="mt-1 text-xs leading-5 text-slate-400 dark:text-zinc-500">
                {isMoveMode
                  ? "No explicit sign-off has been requested for this Move."
                  : "Create an approval when work needs an explicit yes or no from a project member."}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {preview.map(
                (item, index) =>
                  renderCard(
                    item,
                    index,
                    "approval-preview"
                  )
              )}
            </div>
          )}

          {compact &&
          scopedApprovals.length >
            preview.length ? (
            <div className="mt-3 text-center text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
              +
              {scopedApprovals.length -
                preview.length}{" "}
              older approval
              {scopedApprovals.length -
                preview.length ===
              1
                ? ""
                : "s"}{" "}
              on this Move
            </div>
          ) : null}

          {!compact &&
          scopedApprovals.length >
            preview.length ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  setShowAll(true)
                }
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.05]"
              >
                View all
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {showCreate ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/55 px-4 pb-8 pt-[88px] backdrop-blur-sm md:pt-[96px]">
          <div className="flex max-h-[calc(100vh-120px)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111216]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-white/[0.08] md:px-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Request approval
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/[0.05]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6"
            >
              {createError ? (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {createError}
                </div>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                  Approval title
                </span>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  maxLength={180}
                  autoFocus
                  placeholder="Production launch approval"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                  What needs approval?
                </span>

                <textarea
                  value={requestText}
                  onChange={(event) =>
                    setRequestText(
                      event.target.value
                    )
                  }
                  maxLength={4000}
                  rows={6}
                  placeholder="Approve the final production build before public launch."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                  Approver
                </span>

                <select
                  value={approverId}
                  onChange={(event) =>
                    setApproverId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#17181d] dark:text-white"
                >
                  <option value="">
                    Choose project member
                  </option>

                  {participantEntries.map(
                    (participant) => (
                      <option
                        key={
                          participant.id
                        }
                        value={
                          participant.id
                        }
                      >
                        {
                          participant.label
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              {participantEntries.length ===
              0 ? (
                <div className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-300">
                  Project members could not be resolved yet. Close this form and retry after the project finishes loading.
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-5 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={closeCreate}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.05]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    participantEntries.length ===
                      0
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-black !text-white shadow-sm shadow-violet-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    color: "#ffffff",
                  }}
                  data-openshare-primary="create-approval"
                  data-openshare-approval-primary="true"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {saving
                    ? "Requesting…"
                    : "Request approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {decision ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/55 px-4 pb-8 pt-[88px] backdrop-blur-sm md:pt-[96px]">
          <div className="flex max-h-[calc(100vh-120px)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111216]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-white/[0.08]">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {decision.status ===
                  "approved"
                    ? "Approve request"
                    : "Reject request"}
                </h3>

                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  {
                    decision.item
                      ?.title
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={closeDecision}
                disabled={Boolean(
                  busyId
                )}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/[0.05]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={
                handleDecision
              }
              className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6"
            >
              {decisionError ? (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {decisionError}
                </div>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                  Response note
                  <span className="ml-1 normal-case tracking-normal text-slate-400">
                    (optional)
                  </span>
                </span>

                <textarea
                  value={responseNote}
                  onChange={(event) =>
                    setResponseNote(
                      event.target.value
                    )
                  }
                  maxLength={4000}
                  rows={5}
                  placeholder={
                    decision.status ===
                    "approved"
                      ? "Approved for production."
                      : "Explain what must change before a new approval request is submitted."
                  }
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
              </label>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-200 pt-5 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={closeDecision}
                  disabled={Boolean(
                    busyId
                  )}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.05]"
                >
                  Back
                </button>

                {decision.status ===
                "approved" ? (
                  <button
                    type="submit"
                    disabled={Boolean(
                      busyId
                    )}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-black !text-white shadow-sm shadow-violet-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      color:
                        "#ffffff",
                    }}
                    data-openshare-primary="approve-request"
                    data-openshare-approval-primary="true"
                  >
                    <Check className="h-4 w-4" />
                    {busyId
                      ? "Approving…"
                      : "Approve"}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={Boolean(
                      busyId
                    )}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      color:
                        "#ffffff",
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                    {busyId
                      ? "Rejecting…"
                      : "Reject"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showAll ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/55 px-4 pb-8 pt-[88px] backdrop-blur-sm md:pt-[96px]">
          <div className="flex max-h-[calc(100vh-120px)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111216]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-white/[0.08] md:px-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  All approvals
                </h3>

                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  {scopedApprovals.length}{" "}
                  approval
                  {scopedApprovals.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  recorded
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAll(false)
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/[0.05]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
              <div className="space-y-3">
                {scopedApprovals.map(
                  (item, index) =>
                    renderCard(
                      item,
                      index,
                      "approval-all"
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
