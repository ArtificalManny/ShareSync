#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
PROJECT_HOME = ROOT / "src/pages/ProjectHome.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message):
    print(f"\n[fix_projecthome_sprint_api_route] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path):
    backup_path = path.with_suffix(path.suffix + f".bak-fix-sprint-api-route-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[fix_projecthome_sprint_api_route] backup created: {backup_path}")


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        fail(f"Expected exactly 1 match for {label}, found {count}. No changes were written.")
    print(f"[fix_projecthome_sprint_api_route] replacing: {label}")
    return source.replace(old, new, 1)


def main():
    print("[fix_projecthome_sprint_api_route] starting")

    if not PROJECT_HOME.exists():
        fail(f"Missing file: {PROJECT_HOME}")

    source = PROJECT_HOME.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "async function createProjectSprint(projectId, payload)",
        "buildDefaultSprintPayload(project?.name)",
        "POST /api/projects/:projectId/sprints",
        "The sprint backend route is not available yet",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    old_payload_block = '''function buildDefaultSprintPayload(projectName) {
  const now = new Date();
  const end = addDays(now, 14);

  return {
    title: "Sprint 1",
    goal: `Build momentum on ${projectName || "this project"}`,
    startDate: toIsoDateOnly(now),
    endDate: toIsoDateOnly(end),
    status: "active",
  };
}'''

    new_payload_block = '''function buildDefaultSprintPayload(projectId, projectName) {
  const now = new Date();
  const end = addDays(now, 14);
  const goal = `Build momentum on ${projectName || "this project"}`;

  return {
    projectId,
    name: "Sprint 1",
    title: "Sprint 1",
    goal,
    goals: [
      {
        title: goal,
        description: "Default kickoff goal created from the Project Overview sprint card.",
        status: "active",
      },
    ],
    startDate: toIsoDateOnly(now),
    endDate: toIsoDateOnly(end),
    status: "active",
  };
}'''

    source = replace_once(
        source,
        old_payload_block,
        new_payload_block,
        "buildDefaultSprintPayload signature/body"
    )

    old_create_block = '''async function createProjectSprint(projectId, payload) {
  const encodedProjectId = encodeURIComponent(projectId);

  const response = await fetch(`/api/projects/${encodedProjectId}/sprints`, {
    method: "POST",
    headers: buildJsonHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readApiJson(response);

  if (!response.ok) {
    const message =
      data?.normalizedMessage ||
      data?.message ||
      data?.error ||
      `Sprint request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}'''

    new_create_block = '''async function createProjectSprint(projectId, payload) {
  const response = await fetch("/api/sprints", {
    method: "POST",
    headers: buildJsonHeaders(),
    body: JSON.stringify({
      ...payload,
      projectId,
    }),
  });

  const data = await readApiJson(response);

  if (!response.ok) {
    const message =
      data?.normalizedMessage ||
      data?.message ||
      data?.error ||
      `Sprint request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}'''

    source = replace_once(
        source,
        old_create_block,
        new_create_block,
        "createProjectSprint API route"
    )

    source = replace_once(
        source,
        "          const payload = buildDefaultSprintPayload(project?.name);",
        "          const payload = buildDefaultSprintPayload(id, project?.name);",
        "buildDefaultSprintPayload call site"
    )

    old_error_block = '''  if (error?.status === 404) {
    return "The sprint backend route is not available yet: POST /api/projects/:projectId/sprints.";
  }'''

    new_error_block = '''  if (error?.status === 404) {
    return "The sprint backend route is not available yet: POST /api/sprints.";
  }'''

    source = replace_once(
        source,
        old_error_block,
        new_error_block,
        "404 sprint route error message"
    )

    source = source.replace(
        "  This wires the frontend to POST /api/projects/:projectId/sprints.",
        "  This wires the frontend to POST /api/sprints."
    )

    required_after = [
        'fetch("/api/sprints"',
        "buildDefaultSprintPayload(id, project?.name)",
        "projectId,",
        "name: \"Sprint 1\"",
        "POST /api/sprints",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if "/api/projects/${encodedProjectId}/sprints" in source:
        fail("Safety check failed: old /api/projects/:projectId/sprints fetch still exists.")

    if source == original:
        fail("No changes detected. No file was written.")

    backup(PROJECT_HOME)
    PROJECT_HOME.write_text(source, encoding="utf-8")

    print(f"[fix_projecthome_sprint_api_route] patched: {PROJECT_HOME}")
    print("")
    print("[fix_projecthome_sprint_api_route] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "createProjectSprint|buildDefaultSprintPayload|/api/sprints|/api/projects/.*/sprints|Sprint could not start" src/pages/ProjectHome.jsx -C 8')
    print("  git diff -- src/pages/ProjectHome.jsx")


if __name__ == "__main__":
    main()
