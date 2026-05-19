const DAY_MS = 24 * 60 * 60 * 1000;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTaskStatus(task) {
  return String(task?.status || task?.state || task?.column || "").toLowerCase();
}

function isTaskDone(task) {
  const status = getTaskStatus(task);

  return (
    status === "done" ||
    status === "completed" ||
    status === "complete" ||
    task?.completed === true ||
    task?.isCompleted === true ||
    Boolean(task?.completedAt)
  );
}

function getCompletedDate(task) {
  return (
    toDate(task?.completedAt) ||
    toDate(task?.completed_at) ||
    toDate(task?.finishedAt) ||
    toDate(task?.doneAt) ||
    null
  );
}

function isTaskInMotion(task) {
  const status = getTaskStatus(task);

  return (
    status === "in-progress" ||
    status === "in progress" ||
    status === "doing" ||
    status === "active" ||
    status === "started"
  );
}

function isTaskBlocked(task) {
  const status = getTaskStatus(task);

  return (
    status === "blocked" ||
    task?.blocked === true ||
    task?.isBlocked === true
  );
}

function isTaskReady(task) {
  const status = getTaskStatus(task);

  if (isTaskDone(task) || isTaskBlocked(task)) return false;

  return (
    status === "ready" ||
    status === "todo" ||
    status === "to-do" ||
    status === "open" ||
    status === "backlog" ||
    status === "planned" ||
    status === ""
  );
}

function countRecentShips(tasks, daysBack) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - daysBack * DAY_MS);

  return tasks.filter((task) => {
    if (!isTaskDone(task)) return false;

    const completedDate = getCompletedDate(task);

    // If a task is done but has no completion date, do NOT count it as a recent ship.
    // This prevents old seed/demo tasks from inflating weekly momentum.
    if (!completedDate) return false;

    return completedDate >= cutoff && completedDate <= now;
  }).length;
}

function countPreviousWindowShips(tasks, daysBack) {
  const now = new Date();
  const currentWindowStart = new Date(now.getTime() - daysBack * DAY_MS);
  const previousWindowStart = new Date(now.getTime() - daysBack * 2 * DAY_MS);

  return tasks.filter((task) => {
    if (!isTaskDone(task)) return false;

    const completedDate = getCompletedDate(task);
    if (!completedDate) return false;

    return completedDate >= previousWindowStart && completedDate < currentWindowStart;
  }).length;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function buildProjectMomentum({ project = {}, tasks = [], activities = [] } = {}) {
  const safeTasks = asArray(tasks);
  const safeActivities = asArray(activities);

  const openTasks = safeTasks.filter((task) => !isTaskDone(task));

  const weeklyShipsFromTasks = countRecentShips(safeTasks, 7);
  const previousWeeklyShipsFromTasks = countPreviousWindowShips(safeTasks, 7);

  const weeklyShipsFromActivity = safeActivities.filter((activity) => {
    const action = String(activity?.type || activity?.action || activity?.event || "").toLowerCase();
    const createdAt = toDate(activity?.createdAt || activity?.timestamp || activity?.date);

    if (!createdAt) return false;

    const cutoff = new Date(Date.now() - 7 * DAY_MS);

    return (
      createdAt >= cutoff &&
      (
        action.includes("completed") ||
        action.includes("done") ||
        action.includes("shipped") ||
        action.includes("ship")
      )
    );
  }).length;

  const weeklyShips = Math.max(weeklyShipsFromTasks, weeklyShipsFromActivity);

  const previousWeeklyShips = previousWeeklyShipsFromTasks;
  const trend = weeklyShips - previousWeeklyShips;

  const inMotion = openTasks.filter(isTaskInMotion).length;
  const ready = openTasks.filter(isTaskReady).length;
  const blocked = openTasks.filter(isTaskBlocked).length;

  // Momentum score is intentionally separate from weekly ships.
  // Weekly ships = factual count.
  // Score = simple operational temperature from recent shipping + current flow.
  const score = clamp(
    Math.round(
      weeklyShips * 12 +
      inMotion * 8 +
      ready * 5 -
      blocked * 12
    ),
    0,
    100
  );

  return {
    score,
    weeklyShips,
    previousWeeklyShips,
    trend,
    inMotion,
    ready,
    blocked,
    updatedAt: new Date().toISOString(),
  };
}

export default buildProjectMomentum;
