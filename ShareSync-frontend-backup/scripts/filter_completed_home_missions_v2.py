from pathlib import Path
from datetime import datetime
import re

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(path.suffix + f".bak-before-filter-completed-home-missions-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

if "function isProjectCompletedForHomeMission" not in text:
    marker = """function getHomeProjectId(project) {
  const raw =
    project?._id ||
    project?.id ||
    project?.projectId?._id ||
    project?.projectId ||
    project?.project?._id ||
    project?.project?.id;

  return raw ? String(raw) : "";
}
"""
    if marker not in text:
        raise SystemExit("❌ Could not find getHomeProjectId() exact block. No changes written.")

    helpers = marker + """

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
    text = text.replace(marker, helpers, 1)

old_safe = "  const safe = Array.isArray(projects) ? projects : [];"
new_safe = """  const safe = (Array.isArray(projects) ? projects : []).filter(
    (project) => !isProjectCompletedForHomeMission(project)
  );"""

if old_safe not in text:
    raise SystemExit("❌ Could not find the safe projects line inside toMissions(). No changes written.")

text = text.replace(old_safe, new_safe, 1)

if "...getProjectLogoFields(p)," not in text:
    old_return_start = """    return {
      id: p?._id || p?.id,
      _id: p?._id || p?.id,"""

    new_return_start = """    return {
      id: p?._id || p?.id,
      _id: p?._id || p?.id,
      ...getProjectLogoFields(p),
      status: p?.status,
      completedAt: p?.completedAt,
      shippedAt: p?.shippedAt,
      isArchived: p?.isArchived,
      progress: p?.progress,"""

    if old_return_start not in text:
        raise SystemExit("❌ Could not find mission return object start. No changes written.")

    text = text.replace(old_return_start, new_return_start, 1)

path.write_text(text)

print("✅ Completed/shipped/archived projects are filtered out of Home missions.")
print("✅ Mission objects now carry logoUrl/logo/picture/avatarUrl/imageUrl.")
print("✅ Mission objects now carry status/completedAt/shippedAt/progress.")
print("")
print("Inspect with:")
print("rg -n \"isProjectCompletedForHomeMission|getProjectLogoFields|const safe|logoUrl|completedAt|shippedAt|progress\" src/hooks/useHomeRealtime.js -C 6")
