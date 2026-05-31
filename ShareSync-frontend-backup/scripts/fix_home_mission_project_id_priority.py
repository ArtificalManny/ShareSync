from pathlib import Path
from datetime import datetime
import re

targets = [
    Path("src/hooks/useHomeRealtime.js"),
    Path("src/pages/Home.jsx"),
]

helper_body = '''function getHomeProjectId(project) {
  const raw =
    // Priority-task missions often have id/_id as the TASK id.
    // Always prefer the parent project id first.
    project?.projectId?._id ||
    project?.projectId?.id ||
    project?.project?._id ||
    project?.project?.id ||
    project?.recommendedTask?.projectId?._id ||
    project?.recommendedTask?.projectId?.id ||
    project?.recommendedTask?.projectId ||
    project?.task?.projectId?._id ||
    project?.task?.projectId?.id ||
    project?.task?.projectId ||
    project?.raw?.projectId?._id ||
    project?.raw?.projectId?.id ||
    project?.raw?.projectId ||
    project?.metadata?.projectId ||
    project?.payload?.projectId ||
    project?.sourceProjectId ||
    project?.parentProjectId ||
    project?.projectId ||
    project?._id ||
    project?.id;

  if (!raw) return "";

  if (typeof raw === "object") {
    return String(raw._id || raw.id || raw.toString?.() || "");
  }

  return String(raw);
}'''

for path in targets:
    if not path.exists():
        print(f"⚠️ Skipping missing file: {path}")
        continue

    text = path.read_text()

    backup = path.with_suffix(
        path.suffix + f".bak-before-prioritize-project-id-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(text)
    print(f"✅ Backup created: {backup}")

    pattern = re.compile(
        r"function\s+getHomeProjectId\s*\(\s*project\s*\)\s*\{[\s\S]*?\n\}",
        re.M
    )

    text, count = pattern.subn(helper_body, text, count=1)

    if count == 0:
        print(f"⚠️ No local getHomeProjectId helper found in {path}. No helper replacement made.")
    else:
        print(f"✅ Patched getHomeProjectId in {path}")

    path.write_text(text)

# Patch the older hydrateMissionReadiness helper if it still manually checks id before projectId.
hook_path = Path("src/hooks/useHomeRealtime.js")
text = hook_path.read_text()

old_block = '''      const projectId =
        mission?._id ||
        mission?.id ||
        mission?.projectId ||
        mission?.project?._id ||
        mission?.project?.id;'''

if old_block in text:
    text = text.replace(old_block, "      const projectId = getHomeProjectId(mission);", 1)
    hook_path.write_text(text)
    print("✅ hydrateMissionReadiness now uses getHomeProjectId(mission).")
else:
    print("✅ No old hydrateMissionReadiness projectId block found, or already patched.")

print("")
print("✅ Priority-task missions should now hydrate using their parent project id, not task id.")
print("")
print("Inspect with:")
print('rg -n "function getHomeProjectId|const projectId = getHomeProjectId|loadMissionReadiness|readinessScore" src/hooks/useHomeRealtime.js src/pages/Home.jsx -C 6')
