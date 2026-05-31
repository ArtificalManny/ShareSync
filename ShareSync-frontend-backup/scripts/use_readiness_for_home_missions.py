from pathlib import Path
from datetime import datetime

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-home-mission-readiness-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

helper = '''
function getMissionReadinessScore(project) {
  const candidates = [
    project?.closureReadiness?.readinessScore,
    project?.readiness?.readinessScore,
    project?.finishLine?.readinessScore,
    project?.completionSnapshot?.readinessScore,
    project?.readinessScore,
    project?.progress,
    project?.completion,
    project?.completionPercent,
    project?.metrics?.readinessScore,
    project?.metrics?.progress,
    project?.metrics?.completionPercent,
  ];

  for (const value of candidates) {
    const number = Number(value);
    if (Number.isFinite(number)) {
      return Math.max(0, Math.min(100, Math.round(number)));
    }
  }

  return 0;
}

function isProjectCompletedForHomeMission(project) {
  const status = String(project?.status || project?.lifecycleState || "").toLowerCase();

  return Boolean(
    status === "completed" ||
      status === "archived" ||
      status === "deleted" ||
      project?.completedAt ||
      project?.shippedAt ||
      project?.isArchived
  );
}

function getProjectLogoFields(project) {
  const logo =
    project?.logoUrl ||
    project?.logo ||
    project?.picture ||
    project?.avatarUrl ||
    project?.imageUrl ||
    "";

  return {
    logoUrl: logo,
    logo,
    picture: logo,
    avatarUrl: logo,
    imageUrl: logo,
  };
}
'''

if "function getMissionReadinessScore(project)" not in text:
    marker = "function toMissions(projects) {"
    if marker not in text:
      raise SystemExit("❌ Could not find function toMissions(projects). No changes written.")

    text = text.replace(marker, helper + "\\n" + marker, 1)

# Filter completed projects out of missions.
old_safe = "const safe = Array.isArray(projects) ? projects : [];"
new_safe = "const safe = (Array.isArray(projects) ? projects : []).filter((project) => !isProjectCompletedForHomeMission(project));"

if old_safe in text:
    text = text.replace(old_safe, new_safe, 1)
elif new_safe not in text:
    raise SystemExit("❌ Could not patch safe projects filter. No changes written.")

# Replace obvious progress mappings.
text = text.replace(
    "progress: p?.progress ?? p?.completion ?? p?.completionPercent ?? 0,",
    "progress: getMissionReadinessScore(p),",
)

text = text.replace(
    "progress: p.progress ?? p.completion ?? p.completionPercent ?? 0,",
    "progress: getMissionReadinessScore(p),",
)

# Add logo fields into returned mission objects after a known id line if possible.
if "...getProjectLogoFields(p)" not in text:
    text = text.replace(
        "projectId: getProjectId(p),",
        "projectId: getProjectId(p),\\n      ...getProjectLogoFields(p),",
        1,
    )

# Add status fields if not present.
if "completedAt: p?.completedAt" not in text and "completedAt: p.completedAt" not in text:
    text = text.replace(
        "...getProjectLogoFields(p),",
        "...getProjectLogoFields(p),\\n      status: p?.status,\\n      completedAt: p?.completedAt,\\n      shippedAt: p?.shippedAt,\\n      closureReadiness: p?.closureReadiness,",
        1,
    )

path.write_text(text)

print("✅ Home missions now prefer readinessScore over project.progress.")
print("✅ Completed/shipped/archived projects are filtered out of Home missions.")
print("✅ Logo fields are preserved for MissionCard.")
print("")
print("Inspect with:")
print("rg -n \"getMissionReadinessScore|isProjectCompletedForHomeMission|getProjectLogoFields|progress: getMissionReadinessScore|completedAt|shippedAt\" src/hooks/useHomeRealtime.js -C 6")
