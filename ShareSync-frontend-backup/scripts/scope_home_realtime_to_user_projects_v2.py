from pathlib import Path
import re

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

# 1) Add helper for extracting project ids
helper = '''
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

# 2) Replace initial load so projects load first, then activities are scoped to those project IDs
pattern = re.compile(
    r'''const\s+\[pRes,\s*aRes,\s*sRes,\s*iRes,\s*statsRes\]\s*=\s*await\s+Promise\.allSettled\(\s*\[\s*
\s*fetchProjects\(\),\s*
\s*fetchActivities\(\{\s*limit:\s*80\s*\}\),\s*
\s*fetchActivitySummary\(\),\s*
\s*fetchUserIntelligence\(\),\s*
\s*fetchUserStats\(\),\s*
\s*\]\s*\);''',
    re.MULTILINE
)

replacement = '''const projectsPayload = await fetchProjects();
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

text, count = pattern.subn(replacement, text, count=1)

if count == 0:
    raise SystemExit("Could not replace initial Promise.allSettled load block.")

# 3) Remove the global/cross-project Team Activity fallback block using line-based scanning
lines = text.splitlines()
fallback_index = None

for i, line in enumerate(lines):
    if "FALLBACK: If activities endpoint returned empty" in line:
        fallback_index = i
        break

if fallback_index is None:
    print("No fallback comment block found. It may already be removed.")
else:
    start = fallback_index

    # Include decorative/comment lines above the fallback title
    while start > 0 and lines[start - 1].lstrip().startswith("//"):
        start -= 1

    if_index = None
    for j in range(fallback_index, min(len(lines), fallback_index + 30)):
        if "if (a.length === 0)" in lines[j]:
            if_index = j
            break

    if if_index is None:
        raise SystemExit("Found fallback comment but could not find if (a.length === 0) block.")

    brace_balance = 0
    end = None
    started = False

    for j in range(if_index, len(lines)):
        line = lines[j]
        brace_balance += line.count("{")
        brace_balance -= line.count("}")
        started = True

        if started and brace_balance == 0:
            end = j + 1
            break

    if end is None:
        raise SystemExit("Could not locate end of fallback if block.")

    scoped_comment = [
        "        // Home Team Activity is intentionally user/project scoped.",
        "        // If the scoped activity endpoint returns empty, keep it empty.",
        "        // Discover is where global/public activity belongs.",
    ]

    lines = lines[:start] + scoped_comment + lines[end:]
    text = "\n".join(lines) + "\n"

# 4) Scope polling refresh too
old_poll = "let a = await fetchActivities({ limit: 80 });"
new_poll = '''const projectIdsForHome = (lastGoodRef.current.projects || [])
          .map(getHomeProjectId)
          .filter(Boolean);

        let a = await fetchActivities({ limit: 80, projectIds: projectIdsForHome });'''

if old_poll in text:
    text = text.replace(old_poll, new_poll, 1)
else:
    print("Polling fetchActivities call already patched or not found.")

path.write_text(text)
print("✅ Scoped Home realtime activity to logged-in user's projects.")
print("✅ Removed global/cross-project Team Activity fallback.")
