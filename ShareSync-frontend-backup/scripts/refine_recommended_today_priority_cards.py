#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
HOOK = ROOT / "src/hooks/useHomeRealtime.js"
HOME = ROOT / "src/pages/Home.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


NEW_HELPER = r'''function toPriorityMissions(priorityTasks, projects) {
  const safeTasks = Array.isArray(priorityTasks) ? priorityTasks : [];
  const safeProjects = Array.isArray(projects) ? projects : [];

  if (safeTasks.length === 0) return [];

  const projectMissionMap = new Map();

  for (const project of toMissions(safeProjects)) {
    const possibleIds = [
      project?._id,
      project?.id,
      project?.projectId,
      project?.raw?._id,
      project?.raw?.id,
      project?.raw?.projectId,
    ]
      .filter(Boolean)
      .map((value) => String(value));

    for (const id of possibleIds) {
      projectMissionMap.set(id, project);
    }
  }

  const getProjectIdFromTask = (task) => {
    const rawProject =
      task?.projectId ||
      task?.project ||
      task?.projectRef ||
      task?.project_id ||
      task?.raw?.projectId ||
      task?.raw?.project;

    if (!rawProject) return "";

    if (typeof rawProject === "string" || typeof rawProject === "number") {
      return String(rawProject);
    }

    return String(
      rawProject?._id ||
        rawProject?.id ||
        rawProject?.projectId ||
        rawProject?.value ||
        ""
    );
  };

  const getProjectNameFromTask = (task, baseMission, projectId) => {
    const rawProject = task?.projectId || task?.project || task?.raw?.project || {};

    return (
      task?.projectName ||
      task?.projectTitle ||
      task?.project?.name ||
      task?.project?.title ||
      task?.projectId?.name ||
      task?.projectId?.title ||
      rawProject?.name ||
      rawProject?.title ||
      baseMission?.name ||
      baseMission?.title ||
      baseMission?.raw?.name ||
      baseMission?.raw?.title ||
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

    const baseMission =
      projectMissionMap.get(projectId) ||
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

      // Keep the real project identity so existing project shipping/navigation remains safe.
      id: baseMission.id || baseMission._id || projectId,
      _id: baseMission._id || baseMission.id || projectId,
      projectId,

      // Make the card read task-first instead of generic "Project".
      title: taskTitle,
      name: taskTitle,
      displayTitle: taskTitle,
      subtitle: projectName,
      projectName,
      description: `${reason} · ${projectName}`,
      status: task?.status || baseMission.status || "active",

      // Feed every common progress field MissionCard might use.
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
        recommendedTask: task,
        recommendationReason: reason,
        projectName,
      },
    });

    seenProjectIds.add(projectId);
  }

  return priorityMissions;
}'''


def fail(message: str):
    print(f"\n[refine_recommended_today_priority_cards] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path):
    backup_path = path.with_name(f"{path.name}.bak-recommended-today-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[refine_recommended_today_priority_cards] backup created: {backup_path}")


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


def patch_hook():
    print("[refine_recommended_today_priority_cards] patching useHomeRealtime.js")

    if not HOOK.exists():
        fail(f"Missing file: {HOOK}")

    source = HOOK.read_text(encoding="utf-8")
    original = source

    required = [
        "function toPriorityMissions(priorityTasks, projects)",
        "const priorityMissions = toPriorityMissions(priorityTasks, projects);",
        "return priorityMissions.length > 0 ? priorityMissions : toMissions(projects);",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected hook marker before patch: {marker}")

    block = find_function_block(source, "function toPriorityMissions(priorityTasks, projects)")
    if not block:
        fail("Could not locate full toPriorityMissions function block.")

    start, end = block
    source = source[:start] + NEW_HELPER + source[end:]

    required_after = [
        "displayTitle: taskTitle",
        "subtitle: projectName",
        "recommendationReason: reason",
        "actionLabel: \"Open\"",
        "priorityScore: score",
        "raw: {",
        "recommendedTask: task",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Hook safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[refine_recommended_today_priority_cards] hook already up to date")
        return False

    backup(HOOK)
    HOOK.write_text(source, encoding="utf-8")
    print(f"[refine_recommended_today_priority_cards] patched: {HOOK}")
    return True


def patch_home_click():
    print("[refine_recommended_today_priority_cards] patching Home.jsx click behavior")

    if not HOME.exists():
        fail(f"Missing file: {HOME}")

    source = HOME.read_text(encoding="utf-8")
    original = source

    old_variants = [
        'onClick={() => handleOpenPanel("telemetry", mission)}',
        "onClick={() => handleOpenPanel('telemetry', mission)}",
    ]

    new_click = '''onClick={() => {
                          const projectId =
                            getProjectId(mission) ||
                            mission?.projectId ||
                            mission?._id ||
                            mission?.id;

                          if (projectId) {
                            window.location.href = `/projects/${projectId}`;
                          }
                        }}'''

    replaced = False
    for old in old_variants:
        if old in source:
            source = source.replace(old, new_click, 1)
            replaced = True
            print("[refine_recommended_today_priority_cards] replaced telemetry click with project navigation")
            break

    if not replaced:
        if 'handleOpenPanel("telemetry", mission)' in source or "handleOpenPanel('telemetry', mission)" in source:
            fail("Found telemetry click text, but not the exact onClick wrapper. Paste the MissionCard block from Home.jsx.")
        print("[refine_recommended_today_priority_cards] no exact telemetry MissionCard click found; Home.jsx not changed")
        return False

    required_after = [
        "window.location.href = `/projects/${projectId}`;",
        "getProjectId(mission)",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Home safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[refine_recommended_today_priority_cards] Home.jsx already up to date")
        return False

    backup(HOME)
    HOME.write_text(source, encoding="utf-8")
    print(f"[refine_recommended_today_priority_cards] patched: {HOME}")
    return True


def main():
    print("[refine_recommended_today_priority_cards] starting")

    changed_hook = patch_hook()
    changed_home = patch_home_click()

    print("")
    print("[refine_recommended_today_priority_cards] done")
    print(f"[refine_recommended_today_priority_cards] changed useHomeRealtime.js: {changed_hook}")
    print(f"[refine_recommended_today_priority_cards] changed Home.jsx: {changed_home}")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"toPriorityMissions|displayTitle|subtitle: projectName|recommendationReason|priorityScore|actionLabel|window.location.href|handleOpenPanel\\(\\\"telemetry\\\", mission\\)\" src/hooks/useHomeRealtime.js src/pages/Home.jsx -C 8")
    print("  git diff -- src/hooks/useHomeRealtime.js src/pages/Home.jsx")


if __name__ == "__main__":
    main()
