function readNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function isDone(task) {
  const status = normalizeStatus(task?.status || task?.state || task?.column);
  return (
    status === "done" ||
    status === "completed" ||
    task?.completed === true ||
    task?.isCompleted === true ||
    Boolean(task?.completedAt)
  );
}

function isBlocked(task) {
  const status = normalizeStatus(task?.status || task?.state || task?.column);
  return (
    status.includes("block") ||
    task?.blocked === true ||
    task?.isBlocked === true ||
    Boolean(task?.blockedAt)
  );
}

function isInMotion(task) {
  const status = normalizeStatus(task?.status || task?.state || task?.column);
  return (
    status === "in-progress" ||
    status === "in progress" ||
    status === "doing" ||
    status === "active" ||
    status === "started"
  );
}

function isReady(task) {
  const status = normalizeStatus(task?.status || task?.state || task?.column);
  return (
    status === "todo" ||
    status === "to do" ||
    status === "ready" ||
    status === "open" ||
    status === "backlog"
  );
}

function getMoveTitle(move) {
  if (!move) return "";
  if (typeof move === "string") return move;

  return (
    move.title ||
    move.name ||
    move.taskTitle ||
    move.label ||
    move.text ||
    move.description ||
    ""
  );
}

function countUnresolvedBlockers(blockers) {
  if (!Array.isArray(blockers)) return 0;

  return blockers.filter((blocker) => {
    const status = normalizeStatus(blocker?.status || blocker?.state);
    return !(
      blocker?.resolved === true ||
      blocker?.isResolved === true ||
      Boolean(blocker?.resolvedAt) ||
      status === "resolved" ||
      status === "closed" ||
      status === "done"
    );
  }).length;
}

export default function buildProjectForesight({
  project = {},
  tasks = [],
  blockers = [],
  priorityStack = [],
  pulse = {},
  momentum = {},
  finishLine = {},
} = {}) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const openTasks = safeTasks.filter((task) => !isDone(task));

  const taskBlocked = openTasks.filter(isBlocked).length;
  const blockerCount = countUnresolvedBlockers(blockers);

  const blocked = Math.max(
    readNumber(pulse?.blocked, 0),
    taskBlocked,
    blockerCount,
    readNumber(project?.blockedCount, 0),
    readNumber(finishLine?.blockerCount, 0)
  );

  const ready = Math.max(
    readNumber(pulse?.ready, 0),
    openTasks.filter((task) => isReady(task) && !isBlocked(task)).length
  );

  const inMotion = Math.max(
    readNumber(pulse?.inMotion, 0),
    openTasks.filter((task) => isInMotion(task) && !isBlocked(task)).length
  );

  const weeklyShips = readNumber(momentum?.weeklyShips, readNumber(project?.weeklyShips, 0));
  const trend = readNumber(momentum?.trend, 0);
  const momentumScore = readNumber(momentum?.score, readNumber(project?.momentum, 0));
  const readiness = readNumber(
    finishLine?.readiness ?? finishLine?.readinessScore ?? project?.readiness,
    0
  );

  const topMove =
    getMoveTitle(priorityStack?.[0]) ||
    getMoveTitle(openTasks.find((task) => !isBlocked(task))) ||
    "Choose the next high-leverage move";

  let severity = "low";
  let riskLabel = "Stable";
  let confidence = 72;
  let prediction = "Execution looks stable. Keep shipping the next visible move.";
  let recommendation = "Protect momentum by finishing the next ready task before opening new work.";

  if (blocked > 0) {
    severity = blocked >= 5 ? "high" : "medium";
    riskLabel = blocked >= 5 ? "High friction" : "Rising friction";
    confidence = blocked >= 5 ? 88 : 82;
    prediction = `Timeline risk is rising because ${blocked} blocker${blocked === 1 ? "" : "s"} are constraining execution.`;
    recommendation = `Unblock "${topMove}" or remove the main blocker before starting new scope.`;
  } else if (trend < 0) {
    severity = "medium";
    riskLabel = "Momentum cooling";
    confidence = 78;
    prediction = "Momentum is cooling compared with the previous signal window.";
    recommendation = `Rebuild pace by shipping "${topMove}" next.`;
  } else if (ready > 0 && inMotion === 0) {
    severity = "medium";
    riskLabel = "Ready, not moving";
    confidence = 76;
    prediction = `${ready} ready move${ready === 1 ? "" : "s"} can be converted into momentum.`;
    recommendation = `Start "${topMove}" and keep the scope narrow.`;
  } else if (momentumScore >= 60) {
    severity = "low";
    riskLabel = "Healthy momentum";
    confidence = 84;
    prediction = "Execution signals are healthy and the project is moving.";
    recommendation = "Keep the current cadence and close the next visible move.";
  }

  return {
    severity,
    riskLabel,
    confidence,
    prediction,
    suggestedNext: topMove,
    recommendation,
    risks:
      blocked > 0
        ? [`${blocked} blocker${blocked === 1 ? "" : "s"} suppressing flow`]
        : trend < 0
          ? ["Momentum trend is cooling"]
          : [],
    signals: {
      blocked,
      ready,
      inMotion,
      weeklyShips,
      trend,
      momentumScore,
      readiness,
    },
    updatedAt: new Date().toISOString(),
  };
}
