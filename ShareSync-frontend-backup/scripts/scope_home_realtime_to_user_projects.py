from pathlib import Path
import re

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

helper = r'''
function getHomeProjectId(project) {
  const raw =
    project?._id ||
    project?.id ||
    project?.projectId?._id ||
    project?.projectId ||
    project?.project?._id ||
    project?.project?.id;

  return raw ? String(raw) : "";
}
'''

if "function getHomeProjectId(project)" not in text:
    marker = 'import { useSocketEvent } from "../context/SocketContext";'
    if marker not in text:
        raise SystemExit("Could not find SocketContext import marker.")
    text = text.replace(marker, marker + "\n" + helper, 1)

old_load = '''const [pRes, aRes, sRes, iRes, statsRes] = await Promise.allSettled([
        fetchProjects(),
        fetchActivities({ limit: 80 }),
        fetchActivitySummary(),
        fetchUserIntelligence(),
        fetchUserStats(),
      ]);'''

new_load = '''const projectsPayload = await fetchProjects();
      const projectIdsForHome = (Array.isArray(projectsPayload) ? projectsPayload : [])
        .map(getHomeProjectId)
        .filter(Boolean);

      const [aRes, sRes, iRes, statsRes] = await Promise.allSettled([
        fetchActivities({ limit: 80, projectIds: projectIdsForHome }),
        fetchActivitySummary(),
        fetchUserIntelligence(),
        fetchUserStats(),
      ]);

      const pRes = {
        status: "fulfilled",
        value: Array.isArray(projectsPayload) ? projectsPayload : [],
      };'''

if old_load not in text:
    raise SystemExit("Could not find initial Promise.allSettled Home load block.")
text = text.replace(old_load, new_load, 1)

fallback_pattern = re.compile(
    r'''
        // ═{40,}\n
        // FALLBACK: If activities endpoint returned empty, build activity\n
        // items from real task data across all user projects\.\n
        // ═{40,}\n
        if \(a\.length === 0\) \{\n
          try \{\n
            // Primary: use /activities/feed with real user names\n
            const feedItems = await fetchActivityFeed\(50\);\n
            if \(feedItems\.length > 0\) \{\n
              a = feedItems;\n
            \} else \{\n
              // Legacy fallback: cross-project tasks\n
              const taskItems = await fetchCrossProjectTasks\(30\);\n
              if \(taskItems\.length > 0\) a = taskItems;\n
            \}\n
          \} catch \(fallbackErr\) \{\n
            console\.warn\('\[useHomeRealtime\] Feed fallback failed:', fallbackErr\?\.message\);\n
            try \{\n
              const taskItems = await fetchCrossProjectTasks\(30\);\n
              if \(taskItems\.length > 0\) a = taskItems;\n
            \} catch \(_\) \{\}\n
          \}\n
        \}\n
''',
    re.VERBOSE,
)

text, count = fallback_pattern.subn(
    '''        // Home Team Activity is intentionally user/project scoped.
        // If the scoped activity endpoint returns empty, keep it empty.
        // Discover is where global/public activity belongs.
''',
    text,
    count=1,
)

if count == 0:
    raise SystemExit("Could not remove global/cross-project activity fallback block.")

old_poll = "let a = await fetchActivities({ limit: 80 });"
new_poll = '''const projectIdsForHome = (lastGoodRef.current.projects || [])
          .map(getHomeProjectId)
          .filter(Boolean);

        let a = await fetchActivities({ limit: 80, projectIds: projectIdsForHome });'''

if old_poll not in text:
    raise SystemExit("Could not find polling fetchActivities call.")
text = text.replace(old_poll, new_poll, 1)

path.write_text(text)
print("Scoped Home Team Activity to the logged-in user's projects and removed global fallback.")
