from pathlib import Path
from datetime import datetime
import re

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()
backup = path.with_suffix(path.suffix + f".bak-before-filter-completed-missions-logos-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# Insert helpers after getProjectId if missing.
if "function isProjectCompletedForHomeMission" not in text:
    marker = "function getProjectId(project) {"
    start = text.find(marker)
    if start == -1:
        raise SystemExit("❌ Could not find getProjectId(project). No changes written.")

    # Find the end of getProjectId by matching the known return line block.
    end_marker = "  return raw ? String(raw) : \"\";\n}\n"
    end = text.find(end_marker, start)
    if end == -1:
        raise SystemExit("❌ Could not find end of getProjectId(project). No changes written.")

    insert_at = end + len(end_marker)
    helper = """

function isProjectCompletedForHomeMission(project) {
  const status = String(
    project?.status ||
      project?.lifecycleState ||
      project?.state ||
      ""
  ).toLowerCase();

  return (
    status === "completed" ||
    status === "complete" ||
    status === "done" ||
    Boolean(project?.completedAt) ||
    Boolean(project?.shippedAt) ||
    project?.isArchived === true
  );
}

function getProjectLogoFields(project) {
  const logoUrl =
    project?.logoUrl ||
    project?.logo ||
    project?.picture ||
    project?.avatarUrl ||
    project?.imageUrl ||
    "";

  return {
    logoUrl,
    logo: project?.logo || logoUrl,
    picture: project?.picture || logoUrl,
    avatarUrl: project?.avatarUrl || logoUrl,
    imageUrl: project?.imageUrl || logoUrl,
    bannerUrl: project?.bannerUrl || project?.banner || project?.coverUrl || "",
  };
}
"""
    text = text[:insert_at] + helper + text[insert_at:]

# Change `const safe = Array.isArray(projects) ? projects : [];`
old_safe = "  const safe = Array.isArray(projects) ? projects : [];"
new_safe = """  const safe = (Array.isArray(projects) ? projects : []).filter(
    (project) => !isProjectCompletedForHomeMission(project)
  );"""

if old_safe not in text:
    print("ℹ️ Exact safe-array line not found. Checking if completed filter already exists.")
    if "isProjectCompletedForHomeMission(project)" not in text:
        raise SystemExit("❌ Could not patch mission filtering. No changes written.")
else:
    text = text.replace(old_safe, new_safe, 1)

# Add logo fields into returned mission object.
# We patch the object returned inside ranked.slice(0, 3).map((p) => ({ ... }))
if "...getProjectLogoFields(p)," not in text:
    # Put logo fields immediately after `id:` or before title if possible.
    text = re.sub(
        r"(return ranked\.slice\(0, 3\)\.map\(\(p\) => \(\{\s*\n\s*id: getProjectId\(p\),)",
        r"\1\n    ...getProjectLogoFields(p),",
        text,
        count=1,
    )

if "...getProjectLogoFields(p)," not in text:
    raise SystemExit("❌ Could not insert logo fields into mission object. No changes written.")

path.write_text(text)

print("✅ useHomeRealtime.js now filters completed/shipped/archived projects out of missions.")
print("✅ Mission objects now carry logoUrl/logo/picture/avatarUrl/imageUrl.")
print("✅ This should stop shipped missions from coming back after refresh.")
print("✅ This should allow MissionCard to render uploaded project logos.")
print("")
print("Inspect with:")
print("rg -n \"isProjectCompletedForHomeMission|getProjectLogoFields|toMissions|logoUrl|completedAt|shippedAt\" src/hooks/useHomeRealtime.js -C 6")
