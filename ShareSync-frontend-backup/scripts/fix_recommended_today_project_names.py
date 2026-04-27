#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/hooks/useHomeRealtime.js"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

NEW_HELPER = r'''function toPriorityMissions(priorityTasks, projects) {
  const safeTasks = Array.isArray(priorityTasks) ? priorityTasks : [];
  const safeProjects = Array.isArray(projects) ? projects : [];

  if (safeTasks.length === 0) return [];

  const normalizeId = (value) => {
    if (!value) return "";

    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    return String(
      value?._id ||
        value?.id ||
        value?.projectId ||
        value?.$oid ||
        value?.value ||
        value?.toString?.() ||
        ""
    );
  };

  const getProjectIdFromTask = (task) => {
    return normalizeId(
      task?.projectId ||
        task?.project ||
        task?.projectRef ||
        task?.project_id ||
        task?.raw?.projectId ||
        task?.raw?.project
    );
  };

  const getProjectTitle = (project) => {
    return (
      project?.title ||
      project?.name ||
      project?.projectName ||
      project?.projectTitle ||
      project?.raw?.title ||
      project?.raw?.name ||
      project?.raw?.projectName ||
      project?.raw?.projectTitle ||
      ""
    );
  };

  const rawProjectLookup = new Map();

  for (const project of safeProjects) {
    const ids = [
      normalizeId(project),
      normalizeId(project?._id),
      normalizeId(project?.id),
      normalizeId(project?.projectId),
      normalizeId(project?.raw),
      normalizeId(project?.raw?._id),
      normalizeId(project?.raw?.id),
      normalizeId(project?.raw?.projectId),
    ].filter(Boolean);

    for (const id of ids) {
      rawProjectLookup.set(id, project);
    }
  }

  const missionLookup = new Map();

  for (const mission of toMissions(safeProjects)) {
    const ids = [
      normalizeId(mission),
      normalizeId(mission?._id),
      normalizeId(mission?.id),
      normalizeId(mission?.projectId),
      normalizeId(mission?.raw),
      normalizeId(mission?.raw?._id),
      normalizeId(mission?.raw?.id),
      normalizeId(mission?.raw?.projectId),
    ].filter(Boolean);

    for (const id of ids) {
      missionLookup.set(id, mission);
    }
  }

  const getProjectNameFromTask = (task, baseMission, projectId) => {
    const rawTaskProject =
      task?.project ||
      task?.projectId ||
      task?.projectRef ||
      task?.raw?.project ||
      task?.raw?.projectId ||
      {};

    const rawProject = rawProjectLookup.get(projectId);

    return (
      task?.projectName ||
      task?.projectTitle ||
      task?.project?.name ||
      task?.project?.title ||
      task?.projectId?.name ||
      task?.projectId?.title ||
      rawTaskProject?.name ||
      rawTaskProject?.title ||
      getProjectTitle(rawProject) ||
      getProjectTitle(baseMission) ||
      (projectId ? `Project ${projectId.slice(-4)}` : "Project")
    );
  };

  const normalizePriority = (priority) => {
    const p = String(priority || "medium").toLowerCase();
    if (p === "critical" || p === "crit") return "critical";
    if (p === "high") return "high";
    if (p === "low") return "low";
    return "medium";
  };

  const getPriorityScore = (priority) => {
    switch (normalizePriority(priority)) {
      case "critical":
        return 95;
      case "high":
        return 82;
      case "medium":
        return 62;
      case "low":
        return 42;
      default:
        return 50;
    }
  };

  const getDueLabel = (dueDate) => {
    if (!dueDate) return "";

    const date = new Date(dueDate);
    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDue = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const days = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86400000);

    if (days < 0) return "Overdue";
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    if (days <= 7) return `Due in ${days} days`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const getRecommendationReason = (task) => {
    const priority = normalizePriority(task?.priority);
    const blocked =
      Boolean(task?.isBlocking) ||
      Boolean(task?.blocked) ||
      Boolean(task?.isBlocked) ||
      (Array.isArray(task?.blockedBy) && task.blockedBy.length > 0);

    const dueLabel = getDueLabel(task?.dueDate);

    if (blocked && (priority === "critical" || priority === "high")) {
      return `${priority === "critical" ? "Critical" : "High-priority"} blocker`;
    }

    if (blocked) return "Blocked task";
    if (dueLabel) return dueLabel;
    if (priority === "critical") return "Critical priority";
    if (priority === "high") return "High priority";

    return "Recommended next move";
  };

  const seenProjectIds = new Set();
  const priorityMissions = [];

  for (const task of safeTasks) {
    const projectId = getProjectIdFromTask(task);
    if (!projectId || seenProjectIds.has(projectId)) continue;

    const rawProject = rawProjectLookup.get(projectId);

    const baseMission =
      missionLookup.get(projectId) ||
      (rawProject
        ? toMissions([rawProject])?.[0]
        : null) ||
      {
        id: projectId,
        _id: projectId,
        projectId,
        title: `Project ${projectId.slice(-4)}`,
        name: `Project ${projectId.slice(-4)}`,
        status: "active",
        metrics: {},
        raw: {},
      };

    const taskId = String(task?._id || task?.id || "");
    const taskTitle = task?.title || task?.name || "Untitled task";
    const projectName = getProjectNameFromTask(task, baseMission, projectId);
    const priority = normalizePriority(task?.priority);
    const reason = getRecommendationReason(task);
    const score = getPriorityScore(priority);
    const blocked =
      Boolean(task?.isBlocking) ||
      Boolean(task?.blocked) ||
      Boolean(task?.isBlocked) ||
      (Array.isArray(task?.blockedBy) && task.blockedBy.length > 0);

    const momentum =
      priority === "critical"
        ? 10
        : priority === "high"
          ? 8
          : priority === "medium"
            ? 5
            : 3;

    priorityMissions.push({
      ...baseMission,

      id: baseMission.id || baseMission._id || projectId,
      _id: baseMission._id || baseMission.id || projectId,
      projectId,

      title: taskTitle,
      name: taskTitle,
      displayTitle: taskTitle,
      subtitle: projectName,
      projectName,
      projectTitle: projectName,
      category: projectName,
      description: `${reason} · ${projectName}`,
      status: task?.status || baseMission.status || "active",

      progress: task?.progress ?? task?.completion ?? score,
      completion: task?.completion ?? task?.progress ?? score,
      completionPercent: task?.completionPercent ?? task?.progress ?? score,
      percentComplete: task?.percentComplete ?? task?.progress ?? score,
      health: task?.health ?? score,

      metrics: {
        ...(baseMission.metrics || {}),
        progress: task?.progress ?? score,
        completion: task?.completion ?? score,
        completionPercent: task?.completionPercent ?? score,
        health: task?.health ?? score,
        momentum,
        priorityScore: score,
      },

      recommendedTask: {
        id: taskId,
        _id: taskId,
        title: taskTitle,
        name: taskTitle,
        status: task?.status || "",
        priority,
        dueDate: task?.dueDate || null,
        isBlocking: blocked,
        blockedBy: Array.isArray(task?.blockedBy) ? task.blockedBy : [],
        reason,
        projectId,
        projectName,
      },

      recommendationSource: "priority-task",
      recommendationReason: reason,
      actionLabel: "Open",
      ctaLabel: "Open",

      raw: {
        ...(baseMission.raw || {}),
        project: rawProject || baseMission.raw?.project || null,
        projectName,
        projectTitle: projectName,
        recommendedTask: task,
        recommendationReason: reason,
      },
    });

    seenProjectIds.add(projectId);
  }

  return priorityMissions;
}'''


def fail(message: str):
    print(f"\n[fix_recommended_today_project_names] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def find_function_block(source: str, signature: str):
    start = source.find(signature)
    if start == -1:
        return None

    brace_start = source.find("{", start)
    if brace_start == -1:
        return None

    depth = 0
    in_string = None
    escape = False

    for index in range(brace_start, len(source)):
        char = source[index]

        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == in_string:
                in_string = None
            continue

        if char in ("'", '"', "`"):
            in_string = char
            continue

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return start, index + 1

    return None


def main():
    print("[fix_recommended_today_project_names] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_before = [
        "function toPriorityMissions(priorityTasks, projects)",
        "const priorityMissions = toPriorityMissions(priorityTasks, projects);",
        "return priorityMissions.length > 0 ? priorityMissions : toMissions(projects);",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    block = find_function_block(source, "function toPriorityMissions(priorityTasks, projects)")
    if not block:
        fail("Could not locate full toPriorityMissions function block.")

    start, end = block
    source = source[:start] + NEW_HELPER + source[end:]

    required_after = [
        "const rawProjectLookup = new Map();",
        "const missionLookup = new Map();",
        "function toPriorityMissions(priorityTasks, projects)",
        "const rawProject = rawProjectLookup.get(projectId);",
        "projectTitle: projectName",
        "category: projectName",
        "project: rawProject || baseMission.raw?.project || null",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[fix_recommended_today_project_names] no changes needed")
        return

    backup_path = TARGET.with_name(f"{TARGET.name}.bak-project-names-{STAMP}")
    backup_path.write_text(original, encoding="utf-8")
    print(f"[fix_recommended_today_project_names] backup created: {backup_path}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[fix_recommended_today_project_names] patched: {TARGET}")

    print("")
    print("[fix_recommended_today_project_names] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"rawProjectLookup|missionLookup|getProjectNameFromTask|projectTitle: projectName|category: projectName|Project \\\\${projectId.slice\" src/hooks/useHomeRealtime.js -C 8")
    print("  git diff -- src/hooks/useHomeRealtime.js")


if __name__ == "__main__":
    main()
