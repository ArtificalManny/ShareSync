import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock3,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Users,
  X,
} from "lucide-react";

import {
  createProjectAsyncCheckIn,
  getProjectAsyncCheckIns,
  updateProjectAsyncCheckIn,
  upsertProjectAsyncCheckInResponse,
} from "../../api/asyncCheckIns";

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

function healthMeta(value) {
  switch (value) {
    case "blocked":
      return {
        label: "Blocked",
        icon: AlertTriangle,
        classes:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
      };

    case "at_risk":
      return {
        label: "At risk",
        icon: AlertTriangle,
        classes:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
      };

    default:
      return {
        label: "On track",
        icon: CheckCircle2,
        classes:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
      };
  }
}

function buildMemberDirectory({
  project,
  members,
  user,
  ownerName,
}) {
  const directory =
    new Map();

  const add = (
    value,
    preferredLabel = ""
  ) => {
    const id =
      normalizeId(value);

    if (!id) return;

    const label =
      String(
        preferredLabel ||
          memberLabel(value) ||
          ""
      ).trim();

    const existing =
      directory.get(id);

    if (
      !existing ||
      existing ===
        "Project member"
    ) {
      directory.set(
        id,
        label &&
          label !==
            "Project member"
          ? label
          : existing ||
              "Project member"
      );
    }

    if (
      value &&
      typeof value === "object"
    ) {
      [
        value?.userId,
        value?.user,
        value?.memberId,
        value?.member,
      ].forEach((nested) => {
        if (
          nested &&
          nested !== value
        ) {
          add(
            nested,
            preferredLabel
          );
        }
      });
    }
  };

  add(user);

  if (
    Array.isArray(members)
  ) {
    members.forEach(
      (member) => add(member)
    );
  }

  if (
    Array.isArray(project?.members)
  ) {
    project.members.forEach(
      (member) => add(member)
    );
  }

  const ownerCandidates = [
    project?.owner,
    project?.ownerId,
    project?.createdBy,
    project?.createdById,
  ];

  ownerCandidates.forEach(
    (candidate) =>
      add(
        candidate,
        ownerName
      )
  );

  return directory;
}

function getProjectOwnerIds(
  project
) {
  const result =
    new Set();

  [
    project?.owner,
    project?.ownerId,
    project?.createdBy,
    project?.createdById,
  ].forEach((candidate) => {
    const id =
      normalizeId(candidate);

    if (id) {
      result.add(id);
    }
  });

  return result;
}

function responseUserId(
  response
) {
  return normalizeId(
    response?.userId
  );
}

function ResponseCard({
  response,
  nameForId,
  isCurrentUser = false,
}) {
  const meta =
    healthMeta(
      response?.health
    );

  const HealthIcon =
    meta.icon;

  const userId =
    responseUserId(
      response
    );

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-white/[0.07] dark:bg-white/[0.025]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
            {nameForId(userId)}
            {isCurrentUser
              ? " · You"
              : ""}
          </div>

          {response?.submittedAt ? (
            <div className="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-500">
              Updated{" "}
              {formatDate(
                response.submittedAt
              )}
            </div>
          ) : null}
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${meta.classes}`}
        >
          <HealthIcon className="h-3 w-3" />
          {meta.label}
        </span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-zinc-500">
            Progress
          </div>

          <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-zinc-300">
            {response?.progress ||
              "No progress update."}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-zinc-500">
            Next
          </div>

          <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-zinc-300">
            {response?.next ||
              "No next step."}
          </div>
        </div>
      </div>

      {response?.blockers ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/[0.07]">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3 w-3" />
            Blockers
          </div>

          <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-900 dark:text-amber-100">
            {response.blockers}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CheckInCard({
  item,
  index,
  currentUserId,
  projectOwnerIds,
  nameForId,
  busyId,
  readOnly,
  onRespond,
  onStatusChange,
}) {
  const [
    expanded,
    setExpanded,
  ] = useState(
    index === 0
  );

  const id =
    normalizeId(item);

  const status =
    item?.status || "open";

  const open =
    status === "open";

  const responses =
    Array.isArray(
      item?.responses
    )
      ? item.responses
      : [];

  const participantIds =
    Array.isArray(
      item?.participantIds
    )
      ? item.participantIds
          .map(normalizeId)
          .filter(Boolean)
      : [];

  const respondedIds =
    new Set(
      responses
        .map(responseUserId)
        .filter(Boolean)
    );

  const pendingIds =
    participantIds.filter(
      (participantId) =>
        !respondedIds.has(
          participantId
        )
    );

  const currentUserIncluded =
    participantIds.includes(
      currentUserId
    );

  const creatorId =
    normalizeId(
      item?.createdBy
    );

  const canManage =
    Boolean(currentUserId) &&
    (
      currentUserId ===
        creatorId ||
      projectOwnerIds.has(
        currentUserId
      )
    );

  const busy =
    busyId === id;

  const myResponse =
    item?.myResponse ||
    responses.find(
      (response) =>
        responseUserId(
          response
        ) === currentUserId
    ) ||
    null;

  const blockedCount =
    responses.filter(
      (response) =>
        response?.health ===
        "blocked"
    ).length;

  const riskCount =
    responses.filter(
      (response) =>
        response?.health ===
        "at_risk"
    ).length;

  const responseCount =
    Number.isFinite(
      Number(
        item?.responseCount
      )
    )
      ? Number(
          item.responseCount
        )
      : responses.length;

  const participantCount =
    Number.isFinite(
      Number(
        item?.participantCount
      )
    )
      ? Number(
          item.participantCount
        )
      : participantIds.length;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#17171b]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
          <MessageSquareText className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="truncate text-sm font-black text-slate-900 dark:text-white">
                {item?.title ||
                  "Async Check-in"}
              </h4>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {responseCount}/
                  {participantCount} responded
                </span>

                {item?.dueAt ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Due{" "}
                    {formatDate(
                      item.dueAt
                    )}
                  </span>
                ) : null}
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                open
                  ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300"
                  : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400"
              }`}
            >
              <CircleDot className="h-3 w-3" />
              {open
                ? "Open"
                : "Closed"}
            </span>
          </div>

          {item?.prompt ? (
            <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-zinc-300">
              {item.prompt}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {blockedCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertTriangle className="h-3 w-3" />
                {blockedCount} blocked
              </span>
            ) : null}

            {riskCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                {riskCount} at risk
              </span>
            ) : null}

            {responses.length > 0 &&
            blockedCount === 0 &&
            riskCount === 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Team on track
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {open &&
            currentUserIncluded &&
            !readOnly ? (
              <button
                type="button"
                onClick={() =>
                  onRespond(item)
                }
                disabled={busy}
                className="inline-flex items-center justify-center rounded-xl !bg-violet-600 px-3 py-2 text-xs font-black !text-white shadow-sm transition hover:!bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor:
                    "#7c3aed",
                  color:
                    "#ffffff",
                  WebkitTextFillColor:
                    "#ffffff",
                }}
              >
                {myResponse
                  ? "Edit my check-in"
                  : "Submit my check-in"}
              </button>
            ) : null}

            {canManage &&
            !readOnly ? (
              <button
                type="button"
                onClick={() =>
                  onStatusChange(
                    item,
                    open
                      ? "closed"
                      : "open"
                  )
                }
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : open ? (
                  <Clock3 className="h-3.5 w-3.5" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}

                {open
                  ? "Close check-in"
                  : "Reopen"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() =>
                setExpanded(
                  (value) => !value
                )
              }
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              {expanded
                ? "Hide updates"
                : "View updates"}

              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {!open &&
          item?.closedAt ? (
            <div className="mt-2 text-[11px] text-slate-400 dark:text-zinc-500">
              Closed{" "}
              {formatDate(
                item.closedAt
              )}
            </div>
          ) : null}

          {expanded ? (
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 dark:text-zinc-400">
                    Team updates
                  </div>

                  <div className="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-500">
                    Structured progress without another meeting.
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                  {responseCount}/
                  {participantCount}
                </div>
              </div>

              {responses.length ? (
                <div className="space-y-2.5">
                  {responses.map(
                    (
                      response,
                      responseIndex
                    ) => {
                      const responseId =
                        normalizeId(
                          response
                        ) ||
                        `${responseUserId(
                          response
                        )}-${responseIndex}`;

                      return (
                        <ResponseCard
                          key={
                            responseId
                          }
                          response={
                            response
                          }
                          nameForId={
                            nameForId
                          }
                          isCurrentUser={
                            responseUserId(
                              response
                            ) ===
                            currentUserId
                          }
                        />
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-white/10 dark:text-zinc-500">
                  No one has checked in yet.
                </div>
              )}

              {pendingIds.length ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/[0.07] dark:bg-white/[0.025]">
                  <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-zinc-500">
                    Waiting for
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pendingIds.map(
                      (participantId) => (
                        <span
                          key={
                            participantId
                          }
                          className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300"
                        >
                          {nameForId(
                            participantId
                          )}
                        </span>
                      )
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function AsyncCheckInsPanel({
  projectId,
  project = null,
  members = [],
  ownerName = "",
  readOnly = false,
}) {
  const { user } =
    useAuth();

  const [
    checkIns,
    setCheckIns,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    panelError,
    setPanelError,
  ] = useState("");

  const [
    busyId,
    setBusyId,
  ] = useState("");

  const [
    showCreate,
    setShowCreate,
  ] = useState(false);

  const [
    responseItem,
    setResponseItem,
  ] = useState(null);

  const [
    createForm,
    setCreateForm,
  ] = useState({
    title: "",
    prompt: "",
    dueAt: "",
  });

  const [
    responseForm,
    setResponseForm,
  ] = useState({
    health: "on_track",
    progress: "",
    next: "",
    blockers: "",
  });

  const currentUserId =
    normalizeId(user);

  const memberDirectory =
    useMemo(
      () =>
        buildMemberDirectory({
          project,
          members,
          user,
          ownerName,
        }),
      [
        project,
        members,
        user,
        ownerName,
      ]
    );

  const projectOwnerIds =
    useMemo(
      () =>
        getProjectOwnerIds(
          project
        ),
      [project]
    );

  const nameForId =
    useCallback(
      (value) => {
        const id =
          normalizeId(value);

        if (!id) {
          return "Project member";
        }

        if (
          id === currentUserId &&
          memberDirectory.get(id)
        ) {
          return memberDirectory.get(
            id
          );
        }

        return (
          memberDirectory.get(id) ||
          "Project member"
        );
      },
      [
        currentUserId,
        memberDirectory,
      ]
    );

  const load =
    useCallback(
      async () => {
        if (!projectId) {
          setCheckIns([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setPanelError("");

        try {
          const data =
            await getProjectAsyncCheckIns(
              projectId
            );

          setCheckIns(
            Array.isArray(data)
              ? data
              : []
          );
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
    load();
  }, [load]);

  const replaceCheckIn =
    useCallback(
      (nextItem) => {
        const nextId =
          normalizeId(nextItem);

        if (!nextId) return;

        setCheckIns(
          (current) => {
            const exists =
              current.some(
                (item) =>
                  normalizeId(item) ===
                  nextId
              );

            if (!exists) {
              return [
                nextItem,
                ...current,
              ];
            }

            return current.map(
              (item) =>
                normalizeId(item) ===
                nextId
                  ? nextItem
                  : item
            );
          }
        );
      },
      []
    );

  const handleCreate =
    async (event) => {
      event.preventDefault();

      if (
        !projectId ||
        readOnly
      ) {
        return;
      }

      const title =
        String(
          createForm.title || ""
        ).trim();

      if (!title) {
        setPanelError(
          "Check-in title is required."
        );
        return;
      }

      setBusyId("create");
      setPanelError("");

      try {
        const dueAt =
          createForm.dueAt
            ? new Date(
                createForm.dueAt
              ).toISOString()
            : null;

        const created =
          await createProjectAsyncCheckIn(
            projectId,
            {
              title,
              prompt:
                String(
                  createForm.prompt ||
                    ""
                ).trim(),
              dueAt,
            }
          );

        replaceCheckIn(
          created
        );

        setCreateForm({
          title: "",
          prompt: "",
          dueAt: "",
        });

        setShowCreate(false);
      } catch (error) {
        setPanelError(
          getErrorMessage(error)
        );
      } finally {
        setBusyId("");
      }
    };

  const openResponseModal =
    (item) => {
      const responses =
        Array.isArray(
          item?.responses
        )
          ? item.responses
          : [];

      const mine =
        item?.myResponse ||
        responses.find(
          (response) =>
            responseUserId(
              response
            ) ===
            currentUserId
        ) ||
        null;

      setResponseForm({
        health:
          mine?.health ||
          "on_track",
        progress:
          mine?.progress ||
          "",
        next:
          mine?.next ||
          "",
        blockers:
          mine?.blockers ||
          "",
      });

      setPanelError("");
      setResponseItem(item);
    };

  const handleResponse =
    async (event) => {
      event.preventDefault();

      const checkInId =
        normalizeId(
          responseItem
        );

      if (
        !projectId ||
        !checkInId ||
        readOnly
      ) {
        return;
      }

      const progress =
        String(
          responseForm.progress ||
            ""
        ).trim();

      const next =
        String(
          responseForm.next || ""
        ).trim();

      if (!progress) {
        setPanelError(
          "Progress is required."
        );
        return;
      }

      if (!next) {
        setPanelError(
          "Next step is required."
        );
        return;
      }

      setBusyId(checkInId);
      setPanelError("");

      try {
        const updated =
          await upsertProjectAsyncCheckInResponse(
            projectId,
            checkInId,
            {
              health:
                responseForm.health,
              progress,
              next,
              blockers:
                String(
                  responseForm.blockers ||
                    ""
                ).trim(),
            }
          );

        replaceCheckIn(
          updated
        );

        setResponseItem(null);
      } catch (error) {
        setPanelError(
          getErrorMessage(error)
        );
      } finally {
        setBusyId("");
      }
    };

  const handleStatusChange =
    async (
      item,
      status
    ) => {
      const checkInId =
        normalizeId(item);

      if (
        !projectId ||
        !checkInId ||
        readOnly
      ) {
        return;
      }

      setBusyId(checkInId);
      setPanelError("");

      try {
        const updated =
          await updateProjectAsyncCheckIn(
            projectId,
            checkInId,
            {
              status,
            }
          );

        replaceCheckIn(
          updated
        );
      } catch (error) {
        setPanelError(
          getErrorMessage(error)
        );
      } finally {
        setBusyId("");
      }
    };

  return (
    <>
      <section
        className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/[0.08] dark:bg-[#111114]/80"
        data-openshare-async-check-ins="panel"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
              <MessageSquareText className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                Async Check-ins
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500 dark:text-zinc-400">
                Structured progress, next steps, and blockers without another meeting.
              </p>
            </div>
          </div>

          {!readOnly ? (
            <button
              type="button"
              onClick={() => {
                setPanelError("");
                setShowCreate(true);
              }}
              disabled={
                !projectId ||
                busyId === "create"
              }
              className="inline-flex items-center justify-center gap-1.5 rounded-xl !bg-violet-600 px-3 py-2 text-xs font-black !text-white shadow-sm transition hover:!bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor:
                  "#7c3aed",
                color:
                  "#ffffff",
                WebkitTextFillColor:
                  "#ffffff",
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              New check-in
            </button>
          ) : null}
        </div>

        {panelError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {panelError}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400 dark:text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading check-ins…
          </div>
        ) : checkIns.length ? (
          <div className="mt-4 space-y-3">
            {checkIns.map(
              (item, index) => (
                <CheckInCard
                  key={
                    normalizeId(item) ||
                    index
                  }
                  item={item}
                  index={index}
                  currentUserId={
                    currentUserId
                  }
                  projectOwnerIds={
                    projectOwnerIds
                  }
                  nameForId={
                    nameForId
                  }
                  busyId={busyId}
                  readOnly={
                    readOnly
                  }
                  onRespond={
                    openResponseModal
                  }
                  onStatusChange={
                    handleStatusChange
                  }
                />
              )
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center dark:border-white/10">
            <MessageSquareText className="mx-auto h-6 w-6 text-slate-300 dark:text-zinc-600" />

            <div className="mt-2 text-sm font-bold text-slate-700 dark:text-zinc-300">
              No async check-ins yet
            </div>

            <div className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400 dark:text-zinc-500">
              Start one when the team needs a concise progress update without scheduling a meeting.
            </div>
          </div>
        )}
      </section>

      {showCreate ? (
        <div
          className="fixed inset-0 z-[1200] overflow-y-auto bg-black/50 px-4 pb-8 pt-24 backdrop-blur-sm sm:px-6 sm:pt-28"
          data-openshare-async-check-ins-modal="create"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCreate(false);
            }
          }}
        >
          <form
            onSubmit={
              handleCreate
            }
            className="mx-auto flex max-h-[calc(100vh-8rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#151519]"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-white/[0.07]">
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">
                  New Async Check-in
                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  Ask everyone for progress, next steps, and blockers.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.07] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <label className="block">
                <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
                  Title
                </span>

                <input
                  autoFocus
                  type="text"
                  maxLength={140}
                  value={
                    createForm.title
                  }
                  onChange={(event) =>
                    setCreateForm(
                      (current) => ({
                        ...current,
                        title:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Friday team check-in"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-600"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
                  Prompt
                </span>

                <textarea
                  rows={3}
                  maxLength={1000}
                  value={
                    createForm.prompt
                  }
                  onChange={(event) =>
                    setCreateForm(
                      (current) => ({
                        ...current,
                        prompt:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="What changed, what are you doing next, and is anything blocking you?"
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-600"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
                  Due date
                  <span className="ml-1 font-medium text-slate-400">
                    optional
                  </span>
                </span>

                <input
                  type="datetime-local"
                  value={
                    createForm.dueAt
                  }
                  onChange={(event) =>
                    setCreateForm(
                      (current) => ({
                        ...current,
                        dueAt:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
              </label>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4 dark:border-white/[0.07] dark:bg-[#151519]">
              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  busyId ===
                    "create" ||
                  !String(
                    createForm.title ||
                      ""
                  ).trim()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl !bg-violet-600 px-4 py-2.5 text-sm font-black !text-white shadow-sm transition hover:!bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor:
                    "#7c3aed",
                  color:
                    "#ffffff",
                  WebkitTextFillColor:
                    "#ffffff",
                }}
              >
                {busyId ===
                "create" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}

                Create check-in
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {responseItem ? (
        <div
          className="fixed inset-0 z-[1210] overflow-y-auto bg-black/50 px-4 pb-8 pt-24 backdrop-blur-sm sm:px-6 sm:pt-28"
          data-openshare-async-check-ins-modal="response"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setResponseItem(null);
            }
          }}
        >
          <form
            onSubmit={
              handleResponse
            }
            className="mx-auto flex max-h-[calc(100vh-8rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#151519]"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-white/[0.07]">
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">
                  Your check-in
                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {responseItem?.title ||
                    "Async Check-in"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setResponseItem(null)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.07] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div>
                <div className="text-xs font-black text-slate-700 dark:text-zinc-300">
                  How is work going?
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    {
                      value:
                        "on_track",
                      label:
                        "On track",
                      classes:
                        "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
                    },
                    {
                      value:
                        "at_risk",
                      label:
                        "At risk",
                      classes:
                        "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
                    },
                    {
                      value:
                        "blocked",
                      label:
                        "Blocked",
                      classes:
                        "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
                    },
                  ].map(
                    (option) => {
                      const selected =
                        responseForm.health ===
                        option.value;

                      return (
                        <button
                          key={
                            option.value
                          }
                          type="button"
                          onClick={() =>
                            setResponseForm(
                              (
                                current
                              ) => ({
                                ...current,
                                health:
                                  option.value,
                              })
                            )
                          }
                          className={`rounded-xl border px-2 py-2.5 text-xs font-black transition ${
                            selected
                              ? option.classes
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
                  Progress
                </span>

                <textarea
                  autoFocus
                  rows={3}
                  maxLength={2000}
                  value={
                    responseForm.progress
                  }
                  onChange={(event) =>
                    setResponseForm(
                      (current) => ({
                        ...current,
                        progress:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="What changed since the last update?"
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-600"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
                  Next
                </span>

                <textarea
                  rows={3}
                  maxLength={2000}
                  value={
                    responseForm.next
                  }
                  onChange={(event) =>
                    setResponseForm(
                      (current) => ({
                        ...current,
                        next:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="What will you do next?"
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-600"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
                  Blockers
                  <span className="ml-1 font-medium text-slate-400">
                    optional
                  </span>
                </span>

                <textarea
                  rows={2}
                  maxLength={2000}
                  value={
                    responseForm.blockers
                  }
                  onChange={(event) =>
                    setResponseForm(
                      (current) => ({
                        ...current,
                        blockers:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Anything preventing progress?"
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-600"
                />
              </label>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4 dark:border-white/[0.07] dark:bg-[#151519]">
              <button
                type="button"
                onClick={() =>
                  setResponseItem(null)
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={
                  busyId ===
                    normalizeId(
                      responseItem
                    ) ||
                  !String(
                    responseForm.progress ||
                      ""
                  ).trim() ||
                  !String(
                    responseForm.next ||
                      ""
                  ).trim()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl !bg-violet-600 px-4 py-2.5 text-sm font-black !text-white shadow-sm transition hover:!bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor:
                    "#7c3aed",
                  color:
                    "#ffffff",
                  WebkitTextFillColor:
                    "#ffffff",
                }}
              >
                {busyId ===
                normalizeId(
                  responseItem
                ) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}

                Save check-in
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
