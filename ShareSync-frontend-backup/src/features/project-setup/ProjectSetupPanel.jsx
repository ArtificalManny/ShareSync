import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Flag,
  Image,
  ListTodo,
  RefreshCw,
  UserRoundCheck,
  Users,
} from "lucide-react";

import {
  listTasks,
} from "../../api/tasks";

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
    return String(value);
  }

  if (typeof value !== "object") {
    return "";
  }

  return normalizeId(
    value._id ||
      value.id ||
      value.userId ||
      value.user ||
      ""
  );
}

function normalizeStatus(task) {
  return String(
    task?.status ||
      task?.scheduleState ||
      task?.state ||
      task?.lane ||
      ""
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function hasMoveOwner(task) {
  const candidates = [
    task?.assigneeId,
    task?.assignee,
    task?.assignedTo,
    task?.assignedToId,
    task?.ownerId,
    task?.owner,
  ];

  return candidates.some(
    (candidate) =>
      Boolean(normalizeId(candidate)) ||
      Boolean(
        candidate?.name ||
          candidate?.username ||
          candidate?.email
      )
  );
}

function isBlockedMove(task) {
  const status = normalizeStatus(task);

  return Boolean(
    task?.isBlocked ||
      task?.blocked ||
      task?.hasBlocker ||
      task?.blockedBy ||
      task?.blockedReason ||
      task?.blockerReason ||
      (
        Array.isArray(task?.blockers) &&
        task.blockers.length > 0
      ) ||
      status.includes("block") ||
      status.includes("stuck") ||
      status.includes("risk")
  );
}

function isCompletedMove(task) {
  const status = normalizeStatus(task);

  return Boolean(
    task?.completedAt ||
      task?.doneAt ||
      task?.finishedAt ||
      task?.shippedAt ||
      task?.completed === true ||
      task?.done === true ||
      [
        "done",
        "completed",
        "complete",
        "shipped",
        "closed",
      ].includes(status)
  );
}

function hasCustomizedIdentity(project) {
  const name = String(
    project?.name ||
      project?.title ||
      ""
  ).trim();

  const description = String(
    project?.description || ""
  ).trim();

  const icon = String(
    project?.icon ||
      project?.emoji ||
      ""
  ).trim();

  const image =
    project?.logoUrl ||
    project?.logo ||
    project?.avatarUrl ||
    project?.picture ||
    project?.bannerUrl ||
    project?.banner ||
    project?.coverUrl ||
    project?.coverImageUrl ||
    "";

  const hasIntentionalVisual =
    Boolean(String(image).trim()) ||
    Boolean(
      icon &&
        icon !== "📁" &&
        icon.toLowerCase() !== "folder"
    );

  return (
    name.length >= 2 &&
    description.length >= 10 &&
    hasIntentionalVisual
  );
}

function hasInvitedTeammate(project) {
  const ownerId = normalizeId(
    project?.ownerId ||
      project?.owner
  );

  const members = Array.isArray(
    project?.members
  )
    ? project.members
    : [];

  const teammateIds = new Set();

  members.forEach((member) => {
    const memberId = normalizeId(
      member?.userId ||
        member?.user ||
        member
    );

    if (
      memberId &&
      memberId !== ownerId
    ) {
      teammateIds.add(memberId);
    }
  });

  return teammateIds.size > 0;
}

function ChecklistItem({
  complete,
  icon: Icon,
  title,
  description,
}) {
  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        complete
          ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/25 dark:bg-emerald-500/10"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-xl p-2.5 ${
            complete
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3
              className={`font-black ${
                complete
                  ? "text-emerald-800 dark:text-emerald-100"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {title}
            </h3>

            {complete ? (
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-emerald-500"
                aria-label="Complete"
              />
            ) : (
              <Circle
                className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600"
                aria-label="Not complete"
              />
            )}
          </div>

          <p
            className={`mt-1 text-sm leading-6 ${
              complete
                ? "text-emerald-700 dark:text-emerald-200/80"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function ProjectSetupPanel({
  projectId,
  project,
  canManage = false,
  onRefreshProject,
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const loadTasks = useCallback(
    async ({
      showLoading = true,
    } = {}) => {
      if (!projectId) {
        setTasks([]);
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      setError("");

      try {
        const result = await listTasks(
          projectId,
          {
            limit: 250,
          }
        );

        setTasks(
          Array.isArray(result)
            ? result
            : []
        );
      } catch (loadError) {
        console.error(
          "[ProjectSetupPanel] Failed to load Moves:",
          loadError
        );

        setError(
          loadError?.response?.data?.message ||
            loadError?.message ||
            "Move progress could not be loaded."
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [projectId]
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function refreshProgress() {
    setRefreshing(true);

    try {
      const operations = [
        loadTasks({
          showLoading: false,
        }),
      ];

      if (
        typeof onRefreshProject ===
        "function"
      ) {
        operations.push(
          Promise.resolve(
            onRefreshProject()
          )
        );
      }

      await Promise.allSettled(
        operations
      );
    } finally {
      setRefreshing(false);
    }
  }

  const checklist = useMemo(
    () => [
      {
        key: "identity",
        complete:
          hasCustomizedIdentity(
            project
          ),
        icon: Image,
        title:
          "Customize project identity",
        description:
          "Add a clear name, useful description, and an intentional icon, logo, or banner.",
      },
      {
        key: "first-move",
        complete: tasks.length > 0,
        icon: ListTodo,
        title:
          "Create the first Move",
        description:
          "Turn the project outcome into one concrete, trackable action.",
      },
      {
        key: "move-owner",
        complete:
          tasks.some(hasMoveOwner),
        icon: UserRoundCheck,
        title:
          "Assign a Move owner",
        description:
          "Make responsibility visible by assigning at least one Move.",
      },
      {
        key: "blocker",
        optional: true,
        complete:
          tasks.some(isBlockedMove),
        icon: AlertTriangle,
        title:
          "Record a blocker (optional)",
        description:
          "Use a blocker when work is genuinely stuck so the project can surface risk.",
      },
      {
        key: "teammate",
        optional: true,
        complete:
          hasInvitedTeammate(
            project
          ),
        icon: Users,
        title:
          "Invite a teammate (optional)",
        description:
          "Bring in a collaborator when the project is intended for a team.",
      },
      {
        key: "completed-move",
        complete:
          tasks.some(
            isCompletedMove
          ),
        icon: Flag,
        title:
          "Complete the first Move",
        description:
          "Ship one Move to establish the project’s first completed outcome.",
      },
    ],
    [project, tasks]
  );

  const coreChecklist =
    checklist.filter(
      (item) => !item.optional
    );

  const completedCount =
    coreChecklist.filter(
      (item) => item.complete
    ).length;

  const totalCount =
    coreChecklist.length;

  const progress =
    totalCount > 0
      ? Math.round(
          (completedCount /
            totalCount) *
            100
        )
      : 0;

  const allComplete =
    completedCount === totalCount;

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-xl dark:border-violet-500/20 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-6 py-5 dark:border-slate-700 dark:from-violet-500/10 dark:via-slate-900 dark:to-cyan-500/10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-500/15 dark:text-violet-200">
              <ClipboardCheck className="h-6 w-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Project Setup
                </h2>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    allComplete
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                      : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {completedCount} of{" "}
                  {totalCount} core complete
                </span>
              </div>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                A live activation checklist
                based on real project activity.
                Optional collaboration and blocker
                milestones do not affect completion.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshProgress}
            disabled={
              loading || refreshing
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </button>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            <span>
              Setup progress
            </span>
            <span>{progress}%</span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                allComplete
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-violet-500 to-cyan-500"
              }`}
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </header>

      <div className="p-6">
        {allComplete && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-500/25 dark:bg-emerald-500/10">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />

            <div>
              <p className="font-black text-emerald-800 dark:text-emerald-100">
                Project setup complete
              </p>

              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-200/80">
                This project has crossed
                the key activation
                milestones and is ready
                for sustained execution.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              {error} Project identity
              and teammate progress are
              still shown.
            </span>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Loading project setup
            progress…
          </div>
        ) : (
          <div
            className="grid gap-4 lg:grid-cols-2"
            aria-live="polite"
          >
            {checklist.map((item) => (
              <ChecklistItem
                key={item.key}
                complete={item.complete}
                icon={item.icon}
                title={item.title}
                description={
                  item.description
                }
              />
            ))}
          </div>
        )}

        <p className="mt-5 text-xs leading-5 text-slate-400 dark:text-slate-500">
          {canManage
            ? "Project owners and admins can update identity and invite collaborators. Every member can help move execution milestones forward."
            : "Project identity changes require owner or admin access. Your Move activity still contributes to setup progress."}{" "}
          Optional milestones remain visible but do not prevent a solo project from completing setup.
        </p>
      </div>
    </section>
  );
}
