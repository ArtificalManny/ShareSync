from pathlib import Path

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

def replace_function(source: str, function_name: str, replacement: str) -> str:
    marker = f"async function {function_name}"
    start = source.find(marker)
    if start == -1:
        raise SystemExit(f"Could not find {marker}")

    brace_start = source.find("{", start)
    if brace_start == -1:
        raise SystemExit(f"Could not find opening brace for {function_name}")

    depth = 0
    end = None

    for i in range(brace_start, len(source)):
        char = source[i]

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    if end is None:
        raise SystemExit(f"Could not find closing brace for {function_name}")

    return source[:start] + replacement + source[end:]


scoped_fetch_activity_feed = '''async function fetchActivityFeed(limit = 50, projectIds = []) {
  const allowedProjectIds = new Set(
    (Array.isArray(projectIds) ? projectIds : [])
      .map((id) => String(id || ""))
      .filter(Boolean)
  );

  // Home must never pull global dashboard activity for accounts with no projects.
  if (allowedProjectIds.size === 0) {
    return [];
  }

  try {
    const response = await client.get("/activities/feed", {
      params: {
        limit,
        projectIds: Array.from(allowedProjectIds).join(","),
      },
    });

    const items = extractArray(response.data || response);

    // Client-side safety filter even if the backend endpoint ignores projectIds.
    return items.filter((item) => {
      const rawProjectId =
        item?.projectId?._id ||
        item?.projectId?.id ||
        item?.projectId ||
        item?.project?._id ||
        item?.project?.id ||
        item?.project ||
        item?.targetProjectId ||
        item?.metadata?.projectId ||
        item?.data?.projectId;

      return rawProjectId && allowedProjectIds.has(String(rawProjectId));
    });
  } catch (err) {
    console.warn("[useHomeRealtime] Scoped activity feed failed:", err?.message || err);
    return [];
  }
}'''

disabled_cross_project_tasks = '''async function fetchCrossProjectTasks(limit = 30) {
  // Disabled for Home.
  // This was useful as an early demo fallback, but it can leak global/cross-user
  // tasks into "Your 3 Moves Today" or "Team Activity" for fresh accounts.
  return [];
}'''

text = replace_function(text, "fetchActivityFeed", scoped_fetch_activity_feed)
text = replace_function(text, "fetchCrossProjectTasks", disabled_cross_project_tasks)

text = text.replace(
    "fetchActivityFeed(50)",
    "fetchActivityFeed(50, projectIdsForHome)"
)

text = text.replace(
    "fetchActivities({ limit: 80, projectIds: projectIdsForHome }),",
    "projectIdsForHome.length ? fetchActivities({ limit: 80, projectIds: projectIdsForHome }) : Promise.resolve([]),"
)

text = text.replace(
    "let a = await fetchActivities({ limit: 80, projectIds: projectIdsForHome });",
    "let a = projectIdsForHome.length ? await fetchActivities({ limit: 80, projectIds: projectIdsForHome }) : [];"
)

path.write_text(text)

print("✅ Home activity feed is now project-scoped.")
print("✅ Home cross-project task fallback is disabled.")
print("✅ Accounts with zero projects now get empty Home activity.")
