function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value?._id || value?.id || value?.taskId || value?.goalId || "");
}

function cleanText(value) {
  return String(value || "").trim();
}

function isDone(item) {
  const status = String(item?.status || item?.state || "").toLowerCase();

  return (
    item?.completed === true ||
    item?.isCompleted === true ||
    item?.done === true ||
    status === "done" ||
    status === "completed" ||
    status === "complete" ||
    status === "closed"
  );
}

function isBlocked(item) {
  const status = String(item?.status || item?.state || "").toLowerCase();
  const priority = String(item?.priority || "").toLowerCase();

  return (
    item?.blocked === true ||
    item?.isBlocked === true ||
    status.includes("block") ||
    priority.includes("blocker")
  );
}

function isHighLeverage(item) {
  const priority = String(item?.priority || item?.impact || "").toLowerCase();
  const type = String(item?.type || item?.kind || item?.category || "").toLowerCase();

  return (
    item?.isGoal === true ||
    item?.goal === true ||
    item?.isPriority === true ||
    item?.isTopMove === true ||
    item?.pinned === true ||
    priority === "high" ||
    priority === "critical" ||
    priority === "urgent" ||
    type.includes("goal") ||
    type.includes("milestone") ||
    type.includes("objective")
  );
}

function getTitle(item) {
  return (
    cleanText(item?.title) ||
    cleanText(item?.name) ||
    cleanText(item?.taskTitle) ||
    cleanText(item?.goalTitle) ||
    cleanText(item?.label) ||
    "Untitled goal"
  );
}

function getSubtitle(item) {
  return (
    cleanText(item?.description) ||
    cleanText(item?.summary) ||
    cleanText(item?.note) ||
    cleanText(item?.projectName) ||
    "Keep this moving to protect project momentum."
  );
}

function getOwnerName(item) {
  const owner =
    item?.assignee ||
    item?.assignedTo ||
    item?.owner ||
    item?.user ||
    item?.createdBy ||
    item?.member ||
    null;

  if (typeof owner === "string") return "";

  const first = cleanText(owner?.firstName);
  const last = cleanText(owner?.lastName);
  const full = `${first} ${last}`.trim();

  return (
    full ||
    cleanText(owner?.displayName) ||
    cleanText(owner?.name) ||
    cleanText(owner?.username) ||
    ""
  );
}

function getProgress(item) {
  const direct =
    item?.progress ??
    item?.completion ??
    item?.percent ??
    item?.completionRate ??
    item?.readiness;

  const numeric = Number(direct);

  if (Number.isFinite(numeric)) {
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }

  return isDone(item) ? 100 : 0;
}

function normalizeGoal(item, source = "goal", index = 0) {
  const blocked = isBlocked(item);
  const done = isDone(item);
  const progress = getProgress(item);

  return {
    id: getId(item) || `${source}-${index}`,
    title: getTitle(item),
    subtitle: getSubtitle(item),
    source,
    ownerName: getOwnerName(item),
    status: done ? "Done" : blocked ? "Blocked" : progress > 0 ? "In motion" : "Active",
    progress,
    blocked,
    done,
    priority: cleanText(item?.priority) || cleanText(item?.impact) || "",
    raw: item,
  };
}

export function buildProjectActiveGoals({
  project = null,
  tasks = [],
  overview = null,
  priorityStack = [],
  foresight = null,
} = {}) {
  const projectGoals = [
    ...toArray(project?.activeGoals),
    ...toArray(project?.goals),
    ...toArray(project?.objectives),
    ...toArray(project?.milestones),
    ...toArray(overview?.activeGoals),
    ...toArray(overview?.goals),
    ...toArray(overview?.objectives),
  ];

  const openTasks = toArray(tasks).filter((task) => !isDone(task));

  const taskGoals = openTasks.filter((task) => isHighLeverage(task));

  const priorityGoals = toArray(priorityStack).filter(Boolean);

  const suggestedGoal =
    foresight?.suggestedNext || foresight?.nextMove || overview?.nextMove || null;

  const candidates = [
    ...projectGoals.map((item, index) => normalizeGoal(item, "goal", index)),
    ...taskGoals.map((item, index) => normalizeGoal(item, "task", index)),
    ...priorityGoals.map((item, index) => normalizeGoal(item, "priority", index)),
    ...(suggestedGoal
      ? [
          normalizeGoal(
            typeof suggestedGoal === "string"
              ? {
                  title: suggestedGoal,
                  description: "Recommended next move from project foresight.",
                  priority: "high",
                }
              : suggestedGoal,
            "suggested",
            0
          ),
        ]
      : []),
  ];

  const seen = new Set();

  const unique = candidates.filter((goal) => {
    const key = `${goal.id}-${goal.title}`.toLowerCase();

    if (seen.has(key)) return false;
    seen.add(key);

    return goal.title && goal.title !== "Untitled goal";
  });

  unique.sort((a, b) => {
    if (a.blocked !== b.blocked) return a.blocked ? -1 : 1;
    if (a.source === "priority" && b.source !== "priority") return -1;
    if (b.source === "priority" && a.source !== "priority") return 1;
    return b.progress - a.progress;
  });

  return unique.slice(0, 5);
}

export default buildProjectActiveGoals;
