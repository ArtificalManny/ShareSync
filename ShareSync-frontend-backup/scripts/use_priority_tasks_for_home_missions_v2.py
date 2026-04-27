#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/hooks/useHomeRealtime.js"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[use_priority_tasks_for_home_missions_v2] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path):
    backup_path = path.with_name(f"{path.name}.bak-priority-missions-v2-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[use_priority_tasks_for_home_missions_v2] backup created: {backup_path}")


HELPER = r'''
/**
 * Convert backend-ranked priority tasks into MissionCard-safe project missions.
 *
 * Important:
 * - MissionCard still ships projects, not individual tasks.
 * - This uses priority tasks to rank/select projects.
 * - The top task is attached as recommendedTask for future UI use.
 */
function toPriorityMissions(priorityTasks, projects) {
  const safeTasks = Array.isArray(priorityTasks) ? priorityTasks : [];
  const safeProjects = Array.isArray(projects) ? projects : [];

  if (safeTasks.length === 0) return [];

  const projectMissionMap = new Map();

  for (const project of toMissions(safeProjects)) {
    const projectId = String(project?._id || project?.id || project?.projectId || "");
    if (projectId) {
      projectMissionMap.set(projectId, project);
    }
  }

  const seenProjectIds = new Set();
  const priorityMissions = [];

  for (const task of safeTasks) {
    const rawProjectId =
      task?.projectId?._id ||
      task?.projectId?.id ||
      task?.projectId ||
      task?.project?._id ||
      task?.project?.id ||
      "";

    const projectId = String(rawProjectId || "");
    if (!projectId || seenProjectIds.has(projectId)) continue;

    const projectName =
      task?.projectName ||
      task?.project?.name ||
      task?.project?.title ||
      "Project";

    const baseMission =
      projectMissionMap.get(projectId) ||
      {
        id: projectId,
        _id: projectId,
        projectId,
        title: projectName,
        name: projectName,
        status: "active",
        metrics: {},
        raw: {},
      };

    priorityMissions.push({
      ...baseMission,
      id: baseMission.id || baseMission._id || projectId,
      _id: baseMission._id || baseMission.id || projectId,
      projectId,
      recommendedTask: {
        id: task?._id || task?.id || "",
        title: task?.title || "Untitled task",
        status: task?.status || "",
        priority: task?.priority || "medium",
        dueDate: task?.dueDate || null,
        isBlocking: Boolean(task?.isBlocking || task?.blockedBy?.length),
        blockedBy: Array.isArray(task?.blockedBy) ? task.blockedBy : [],
      },
      recommendationSource: "priority-task",
      recommendationReason: task?.isBlocking
        ? "Blocking task"
        : task?.dueDate
          ? "Time-sensitive task"
          : "Highest-ranked task",
      raw: {
        ...(baseMission.raw || {}),
        recommendedTask: task,
      },
    });

    seenProjectIds.add(projectId);
  }

  return priorityMissions;
}
'''


def main():
    print("[use_priority_tasks_for_home_missions_v2] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_before = [
        "function toMissions(projects)",
        "async function fetchPriorityTasks",
        "const [priorityTasks, setPriorityTasks] = useState([]);",
        "const missions = useMemo(() => toMissions(projects), [projects]);",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    if "function toPriorityMissions(priorityTasks, projects)" not in source:
        marker = "\nasync function fetchActivities"
        if marker not in source:
            fail("Could not find async function fetchActivities insertion point.")

        source = source.replace(
            marker,
            "\n" + HELPER + "\nasync function fetchActivities",
            1,
        )
        print("[use_priority_tasks_for_home_missions_v2] inserted toPriorityMissions helper")
    else:
        print("[use_priority_tasks_for_home_missions_v2] helper already exists")

    old_line = "  const missions = useMemo(() => toMissions(projects), [projects]);"
    new_block = """  const missions = useMemo(() => {
    const priorityMissions = toPriorityMissions(priorityTasks, projects);
    return priorityMissions.length > 0 ? priorityMissions : toMissions(projects);
  }, [priorityTasks, projects]);"""

    if old_line in source:
        source = source.replace(old_line, new_block, 1)
        print("[use_priority_tasks_for_home_missions_v2] replaced missions derivation")
    elif "const priorityMissions = toPriorityMissions(priorityTasks, projects);" in source:
        print("[use_priority_tasks_for_home_missions_v2] missions derivation already patched")
    else:
        fail("Could not find missions derivation line to replace.")

    required_after = [
        "function toPriorityMissions(priorityTasks, projects)",
        "const priorityMissions = toPriorityMissions(priorityTasks, projects);",
        "return priorityMissions.length > 0 ? priorityMissions : toMissions(projects);",
        "recommendedTask:",
        "recommendationSource: \"priority-task\"",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[use_priority_tasks_for_home_missions_v2] no changes needed")
        return

    backup(TARGET)
    TARGET.write_text(source, encoding="utf-8")

    print(f"[use_priority_tasks_for_home_missions_v2] patched: {TARGET}")
    print("")
    print("[use_priority_tasks_for_home_missions_v2] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"toPriorityMissions|priorityMissions|recommendedTask|recommendationSource|const missions\" src/hooks/useHomeRealtime.js -C 8")
    print("  git diff -- src/hooks/useHomeRealtime.js")


if __name__ == "__main__":
    main()
