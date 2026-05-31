from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/home/MissionCard.jsx")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-remove-direct-card-readiness-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# Remove direct readiness helper block.
start = text.find("function getMissionCardProjectId(project) {")
end = text.find("function getMissionProjectForAvatar(mission) {")

if start != -1 and end != -1 and start < end:
    text = text[:start] + text[end:]
    print("✅ Removed MissionCard direct readiness helper block.")
else:
    print("ℹ️ Direct readiness helper block not found or already removed.")

# Replace direct card projectId helper usage.
text = text.replace(
    "const projectId = getMissionCardProjectId(project);",
    """
  const projectId =
    project?.sourceProjectId ||
    project?.parentProjectId ||
    project?.project?._id ||
    project?.project?.id ||
    project?.projectId?._id ||
    project?.projectId?.id ||
    project?.projectId ||
    project?._id ||
    project?.id;
""".rstrip()
)

# Remove readinessOverride effect/useMemo block and return to using project directly.
pattern = re.compile(
    r"""
\s+const\s+\[readinessOverride,\s*setReadinessOverride\]\s*=\s*useState\(null\);
.*?
\s+const\s+hydratedProject\s*=\s*useMemo\(\(\)\s*=>\s*\{
.*?
\s+\},\s*\[project,\s*readinessOverride\]\);
""",
    re.S | re.X,
)

text, count = pattern.subn("\n\n  const hydratedProject = project;", text, count=1)

if count == 1:
    print("✅ Removed direct readiness state/effect/useMemo from MissionCard.")
else:
    print("ℹ️ Direct readiness state/effect block not found or already removed.")

# Clean React import if useEffect/useMemo/useState are no longer used anywhere in the file.
# Keep this conservative: only touch import if those names do not appear outside import.
for hook in ["useEffect", "useMemo", "useState"]:
    occurrences = len(re.findall(rf"\b{hook}\b", text))
    # 1 occurrence means import only.
    if occurrences <= 1:
        text = re.sub(rf",\s*{hook}\b|\b{hook}\s*,\s*", "", text)

# Normalize React import spacing.
text = re.sub(r'import React,\s*\{\s*\}\s*from\s*["\']react["\'];', 'import React from "react";', text)
text = re.sub(r'import React,\s*\{\s*,\s*', 'import React, { ', text)
text = re.sub(r'\{\s*,\s*', '{ ', text)
text = re.sub(r',\s*\}', ' }', text)

path.write_text(text)

print("")
print("✅ MissionCard cleaned.")
print("")
print("Inspect:")
print('rg -n "getMissionCardProjectId|fetchMissionCardOverviewReadiness|readinessOverride|hydratedProject|progressValue|__missionCardDirectReadiness" src/components/home/MissionCard.jsx -C 6')
