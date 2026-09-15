import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const DAY_MS = 24 * 60 * 60 * 1000;

const CLOSED_STATUSES = new Set([
  "completed",
  "complete",
  "done",
  "shipped",
  "closed",
  "cancelled",
  "canceled",
  "deferred",
]);

function normalizeId(value) {
  if (!value) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (typeof value === "object") {
    return normalizeId(
      value._id ||
        value.id ||
        value.userId ||
        value.memberId ||
        value.user ||
        value.member
    );
  }

  return "";
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function isTaskClosed(task) {
  const status = normalizeStatus(task?.status);

  return Boolean(
    task?.completed === true ||
      task?.completedAt ||
      CLOSED_STATUSES.has(status)
  );
}

function getBlockedBy(task) {
  if (Array.isArray(task?.blockedBy)) return task.blockedBy.filter(Boolean);
  return [];
}

function isTaskBlocked(task) {
  const status = normalizeStatus(task?.status);

  return Boolean(
    status === "blocked" ||
      task?.isBlocked === true ||
      getBlockedBy(task).length > 0
  );
}

function startOfDay(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDueMeta(dueDate) {
  if (!dueDate) {
    return {
      hasDueDate: false,
      overdue: false,
      dueSoon: false,
      diffDays: null,
      label: "",
      timestamp: Number.POSITIVE_INFINITY,
    };
  }

  const due = new Date(dueDate);

  if (Number.isNaN(due.getTime())) {
    return {
      hasDueDate: false,
      overdue: false,
      dueSoon: false,
      diffDays: null,
      label: "",
      timestamp: Number.POSITIVE_INFINITY,
    };
  }

  const today = startOfDay(new Date());
  const dueDay = startOfDay(due);
  const diffDays = Math.round((dueDay - today) / DAY_MS);

  let label = "";

  if (diffDays < -1) {
    label = `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === -1) {
    label = "1 day overdue";
  } else if (diffDays === 0) {
    label = "Due today";
  } else if (diffDays === 1) {
    label = "Due tomorrow";
  } else {
    label = `Due in ${diffDays} days`;
  }

  return {
    hasDueDate: true,
    overdue: diffDays < 0,
    dueSoon: diffDays >= 0 && diffDays <= 3,
    diffDays,
    label,
    timestamp: due.getTime(),
  };
}

function getTaskAssigneeId(task) {
  return normalizeId(
    task?.assigneeId ||
      task?.assignee ||
      task?.assignedTo ||
      task?.ownerId
  );
}

function getTaskId(task) {
  return normalizeId(task?._id || task?.id);
}

function getTaskTitle(task) {
  return String(task?.title || task?.name || "Untitled Move").trim();
}

function getDisplayName(value) {
  if (!value || typeof value !== "object") return "";

  return String(
    value.displayName ||
      value.name ||
      value.fullName ||
      value.username ||
      ""
  ).trim();
}

function getNestedMember(member) {
  if (!member || typeof member !== "object") return null;

  if (member.userId && typeof member.userId === "object") {
    return member.userId;
  }

  if (member.user && typeof member.user === "object") {
    return member.user;
  }

  if (member.memberId && typeof member.memberId === "object") {
    return member.memberId;
  }

  if (member.member && typeof member.member === "object") {
    return member.member;
  }

  if (member.profile && typeof member.profile === "object") {
    return member.profile;
  }

  return null;
}

function buildMemberMap(project, overview) {
  const map = new Map();

  const candidates = [
    project?.owner,
    project?.ownerId,
    ...(Array.isArray(project?.members) ? project.members : []),
    ...(Array.isArray(overview?.overviewMembers)
      ? overview.overviewMembers
      : []),
    ...(Array.isArray(overview?.members) ? overview.members : []),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    const nested = getNestedMember(candidate);

    const id = normalizeId(
      nested ||
        candidate?.userId ||
        candidate?.memberId ||
        candidate?._id ||
        candidate?.id ||
        candidate
    );

    if (!id) continue;

    const name =
      getDisplayName(nested) ||
      getDisplayName(candidate) ||
      "Teammate";

    map.set(id, name);
  }

  return map;
}

function getAssigneeName(task, memberMap) {
  const direct =
    getDisplayName(task?.assignee) ||
    getDisplayName(task?.assignedTo);

  if (direct) return direct;

  const id = getTaskAssigneeId(task);

  if (!id) return "Unassigned";

  return memberMap.get(id) || "Teammate";
}

function decorateTask(task, memberMap) {
  const due = getDueMeta(task?.dueDate);
  const blockedBy = getBlockedBy(task);
  const assigneeId = getTaskAssigneeId(task);

  return {
    task,
    id: getTaskId(task),
    title: getTaskTitle(task),
    assigneeId,
    assigneeName: getAssigneeName(task, memberMap),
    blocked: isTaskBlocked(task),
    blockedByCount: blockedBy.length,
    due,
  };
}

function sortLoops(items) {
  return [...items].sort((a, b) => {
    const aRank =
      !a.assigneeId ? 0 : a.blocked ? 1 : a.due.overdue ? 2 : 3;

    const bRank =
      !b.assigneeId ? 0 : b.blocked ? 1 : b.due.overdue ? 2 : 3;

    if (aRank !== bRank) return aRank - bRank;

    return a.due.timestamp - b.due.timestamp;
  });
}

function LoopRow({ item, mode, onOpenMoves }) {
  let reason = item.due.label;

  if (mode === "blocked") {
    reason =
      item.blockedByCount > 0
        ? `Blocked by ${item.blockedByCount} ${
            item.blockedByCount === 1 ? "dependency" : "dependencies"
          }`
        : "Blocked";
  } else if (mode === "others" && !item.assigneeId) {
    reason = "Needs owner";
  } else if (item.blocked) {
    reason = item.due.label ? `Blocked · ${item.due.label}` : "Blocked";
  }

  return (
    <button
      type="button"
      onClick={onOpenMoves}
      className="group w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-left transition hover:-translate-y-[1px] hover:border-violet-200 hover:shadow-sm dark:border-white/[0.07] dark:bg-white/[0.025] dark:hover:border-violet-500/25"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {item.title}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-zinc-400">
            <span>{item.assigneeName}</span>

            {reason ? (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    item.due.overdue || item.blocked
                      ? "font-medium text-rose-600 dark:text-rose-300"
                      : !item.assigneeId
                        ? "font-medium text-amber-600 dark:text-amber-300"
                        : ""
                  }
                >
                  {reason}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <span className="shrink-0 text-xs font-semibold text-slate-400 transition group-hover:text-violet-600 dark:text-zinc-500 dark:group-hover:text-violet-300">
          Open
        </span>
      </div>
    </button>
  );
}

function LoopColumn({
  title,
  count,
  description,
  accentClass,
  items,
  mode,
  emptyText,
  onOpenMoves,
}) {
  const visible = items.slice(0, 4);
  const remaining = Math.max(0, items.length - visible.length);

  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.025]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${accentClass}`}
              aria-hidden="true"
            />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              {title}
            </h4>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-400">
            {description}
          </p>
        </div>

        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
          {count}
        </span>
      </div>

      <div className="space-y-2">
        {visible.length > 0 ? (
          visible.map((item, index) => (
            <LoopRow
              key={item.id || `${mode}-${index}`}
              item={item}
              mode={mode}
              onOpenMoves={onOpenMoves}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-5 text-center text-xs text-slate-500 dark:border-white/[0.07] dark:bg-white/[0.018] dark:text-zinc-500">
            {emptyText}
          </div>
        )}
      </div>

      {remaining > 0 ? (
        <button
          type="button"
          onClick={onOpenMoves}
          className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
        >
          +{remaining} more
        </button>
      ) : null}
    </div>
  );
}

export default function OpenLoopsPanel({
  tasks = [],
  project = null,
  overview = null,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentUserId = normalizeId(
    user?.id || user?._id || user?.userId
  );

  const memberMap = useMemo(
    () => buildMemberMap(project, overview),
    [project, overview]
  );

  const loops = useMemo(() => {
    const safeTasks = Array.isArray(tasks)
      ? tasks.filter((task) => task && !isTaskClosed(task))
      : [];

    const decorated = safeTasks.map((task) =>
      decorateTask(task, memberMap)
    );

    const waitingOnYou = decorated.filter((item) => {
      if (!currentUserId) return false;
      if (item.assigneeId !== currentUserId) return false;

      return (
        item.blocked ||
        item.due.overdue ||
        item.due.dueSoon
      );
    });

    const waitingOnOthers = decorated.filter((item) => {
      if (currentUserId && item.assigneeId === currentUserId) {
        return false;
      }

      return item.due.overdue || item.due.dueSoon;
    });

    const blocked = decorated.filter((item) => item.blocked);

    return {
      waitingOnYou: sortLoops(waitingOnYou),
      waitingOnOthers: sortLoops(waitingOnOthers),
      blocked: sortLoops(blocked),
    };
  }, [tasks, currentUserId, memberMap]);

  const projectId = normalizeId(
    project?._id ||
      project?.id ||
      overview?.project?._id ||
      overview?.project?.id
  );

  const openMoves = () => {
    if (!projectId) return;

    navigate(
      `/projects/${encodeURIComponent(projectId)}?view=tasks`
    );
  };

  const uniqueLoopCount = useMemo(() => {
    const ids = new Set();

    [
      ...loops.waitingOnYou,
      ...loops.waitingOnOthers,
      ...loops.blocked,
    ].forEach((item, index) => {
      ids.add(item.id || `open-loop-${index}`);
    });

    return ids.size;
  }, [loops]);

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400" />

      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-sm font-black text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
              ↻
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Open Loops
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                What needs attention before work can move forward
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300">
            {uniqueLoopCount} open{" "}
            {uniqueLoopCount === 1 ? "loop" : "loops"}
          </span>

          <button
            type="button"
            onClick={openMoves}
            disabled={!projectId}
            className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-default disabled:opacity-50 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/15"
          >
            View Moves
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <LoopColumn
          title="Waiting on you"
          count={loops.waitingOnYou.length}
          description="Near-term work that needs your attention."
          accentClass="bg-violet-500"
          items={loops.waitingOnYou}
          mode="you"
          emptyText="Nothing urgent is waiting on you."
          onOpenMoves={openMoves}
        />

        <LoopColumn
          title="Waiting on team"
          count={loops.waitingOnOthers.length}
          description="Near-term work owned by teammates or still needing an owner."
          accentClass="bg-amber-500"
          items={loops.waitingOnOthers}
          mode="others"
          emptyText="No near-term teammate follow-ups."
          onOpenMoves={openMoves}
        />

        <LoopColumn
          title="Blocked"
          count={loops.blocked.length}
          description="Moves that cannot progress yet."
          accentClass="bg-rose-500"
          items={loops.blocked}
          mode="blocked"
          emptyText="No blocked Moves right now."
          onOpenMoves={openMoves}
        />
      </div>
    </section>
  );
}
