const DONE_STATUSES = new Set([
  "done",
  "complete",
  "completed",
  "closed",
  "resolved",
  "archived",
]);

const IN_MOTION_STATUSES = new Set([
  "doing",
  "active",
  "started",
  "working",
  "inprogress",
  "in_progress",
  "in-progress",
  "in progress",
  "review",
  "inreview",
  "in_review",
  "under_review",
  "under review",
]);

const READY_STATUSES = new Set([
  "todo",
  "to do",
  "open",
  "ready",
  "new",
  "backlog",
  "planned",
  "planning",
]);

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function compactStatus(value) {
  return normalize(value).replace(/[\s_-]+/g, "");
}

function readNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function readArray(value) {
  return Array.isArray(value) ? value : [];
}

function getTaskStatus(task) {
  return (
    task?.status ??
    task?.state ??
    task?.taskStatus ??
    task?.workflowStatus ??
    ""
  );
}

export function isTaskDone(task) {
  const status = normalize(getTaskStatus(task));
  const compact = compactStatus(getTaskStatus(task));

  return (
    DONE_STATUSES.has(status) ||
    DONE_STATUSES.has(compact) ||
    task?.completed === true ||
    Boolean(task?.completedAt)
  );
}

export function isTaskInMotion(task) {
  if (isTaskDone(task)) return false;

  const status = normalize(getTaskStatus(task));
  const compact = compactStatus(getTaskStatus(task));

  return IN_MOTION_STATUSES.has(status) || IN_MOTION_STATUSES.has(compact);
}

export function isTaskBlocked(task) {
  if (isTaskDone(task)) return false;

  const status = normalize(getTaskStatus(task));
  const compact = compactStatus(getTaskStatus(task));

  const blockedBy = readArray(task?.blockedBy);
  const blockers = readArray(task?.blockers);
  const dependencies = readArray(task?.dependencies);
  const blockingReasons = readArray(task?.blockingReasons);

  return (
    task?.isBlocked === true ||
    task?.blocked === true ||
    status === "blocked" ||
    compact === "blocked" ||
    status === "blocker" ||
    compact === "blocker" ||
    blockedBy.length > 0 ||
    blockers.length > 0 ||
    dependencies.some((dep) => dep?.status === "blocked" || dep?.isBlocking === true) ||
    blockingReasons.length > 0
  );
}

export function isTaskReady(task) {
  if (isTaskDone(task)) return false;
  if (isTaskBlocked(task)) return false;
  if (isTaskInMotion(task)) return false;

  const status = normalize(getTaskStatus(task));
  const compact = compactStatus(getTaskStatus(task));

  return (
    READY_STATUSES.has(status) ||
    READY_STATUSES.has(compact) ||
    status === ""
  );
}

function isResolvedBlocker(item) {
  const status = normalize(item?.status ?? item?.state ?? item?.resolutionStatus);

  return (
    item?.resolved === true ||
    item?.isResolved === true ||
    Boolean(item?.resolvedAt) ||
    Boolean(item?.completedAt) ||
    status === "resolved" ||
    status === "done" ||
    status === "completed" ||
    status === "closed"
  );
}

function isBlockerLike(item) {
  const status = normalize(item?.status ?? item?.state ?? item?.type ?? item?.kind ?? item?.category);
  const compact = compactStatus(status);

  return (
    item?.isBlocked === true ||
    item?.blocked === true ||
    item?.isBlocker === true ||
    item?.blocking === true ||
    status.includes("block") ||
    compact.includes("block") ||
    readArray(item?.blockedBy).length > 0 ||
    readArray(item?.blockers).length > 0 ||
    readArray(item?.blockingReasons).length > 0
  );
}

function countUnresolvedBlockers(blockers) {
  return readArray(blockers).filter((item) => {
    if (!item) return false;
    if (isTaskDone(item)) return false;
    if (isResolvedBlocker(item)) return false;
    return isBlockerLike(item);
  }).length;
}

export function buildProjectPulse(project = {}, options = {}) {
  const tasks = readArray(options.tasks);
  const blockers = readArray(options.blockers);

  const openTasks = tasks.filter((task) => !isTaskDone(task));

  const completedTodayFromTasks = tasks.filter((task) => {
    if (!task?.completedAt) return false;

    const completedAt = new Date(task.completedAt);
    if (Number.isNaN(completedAt.getTime())) return false;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    return completedAt >= start;
  }).length;

  const completedTodayFromProject = readNumber(
    project?.completedToday ??
      project?.todayCompleted ??
      project?.shipsToday ??
      project?.metrics?.completedToday,
    0
  );

  const blockedFromTasks = openTasks.filter((task) => isTaskBlocked(task)).length;
  const blockedFromBlockers = countUnresolvedBlockers(blockers);

  return {
    today: Math.max(completedTodayFromTasks, completedTodayFromProject),
    inMotion: openTasks.filter((task) => isTaskInMotion(task)).length,
    blocked: Math.max(blockedFromTasks, blockedFromBlockers),
    ready: openTasks.filter((task) => isTaskReady(task)).length,
  };
}

export default buildProjectPulse;
