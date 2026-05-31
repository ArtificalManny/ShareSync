from pathlib import Path
from datetime import datetime

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-hide-shipped-missions-readiness-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

def find_function_bounds(src, name):
    needle = f"function {name}"
    start = src.find(needle)
    if start == -1:
        return None

    brace_start = src.find("{", start)
    if brace_start == -1:
        return None

    depth = 0
    for i in range(brace_start, len(src)):
        char = src[i]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return start, i + 1

    return None

helpers = r'''
function toHomeDateKey(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function wasProjectShippedTodayForHome(project) {
  const lastShipAt =
    project?.lastShipAt ||
    project?.metrics?.lastShipAt ||
    project?.metrics?.lastActivityAt ||
    project?.shippedAt ||
    null;

  if (!lastShipAt) return false;

  return toHomeDateKey(lastShipAt) === toHomeDateKey(new Date());
}

function isProjectCompletedForHomeMission(project) {
  const status = String(project?.status || "").toLowerCase();

  return (
    status === "completed" ||
    status === "archived" ||
    status === "deleted" ||
    project?.isArchived === true ||
    Boolean(project?.completedAt)
  );
}

function getProjectLogoFieldsForHome(project) {
  const logoUrl =
    project?.logoUrl ||
    project?.logo ||
    project?.picture ||
    project?.avatarUrl ||
    project?.imageUrl ||
    project?.project?.logoUrl ||
    project?.project?.logo ||
    project?.project?.picture ||
    project?.project?.avatarUrl ||
    project?.project?.imageUrl ||
    "";

  return {
    logoUrl,
    logo: project?.logo || logoUrl,
    picture: project?.picture || logoUrl,
    avatarUrl: project?.avatarUrl || logoUrl,
    imageUrl: project?.imageUrl || logoUrl,
  };
}

function toFiniteHomeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getMissionReadinessScore(project) {
  const raw =
    project?.closureReadiness?.readinessScore ??
    project?.finishLine?.readinessScore ??
    project?.readiness?.readinessScore ??
    project?.readinessScore ??
    project?.completionSnapshot?.readinessScore ??
    project?.metrics?.readinessScore ??
    project?.metrics?.completionPercent ??
    project?.metrics?.progress ??
    project?.progress ??
    0;

  return Math.max(0, Math.min(100, Math.round(toFiniteHomeNumber(raw, 0))));
}
'''

if "function wasProjectShippedTodayForHome" not in text:
    bounds = find_function_bounds(text, "toMissions")
    if not bounds:
        raise SystemExit("❌ Could not find function toMissions(projects). No changes written.")

    start, _ = bounds
    text = text[:start] + helpers + "\n\n" + text[start:]
else:
    print("ℹ️ Home mission helper functions already exist. Not duplicated.")

bounds = find_function_bounds(text, "toMissions")
if not bounds:
    raise SystemExit("❌ Could not find function toMissions(projects) after helper insertion. No changes written.")

start, end = bounds

new_to_missions = r'''function toMissions(projects) {
  const safe = Array.isArray(projects) ? projects : [];

  const visibleProjects = safe.filter((project) => {
    if (!project) return false;

    // Completed/archived projects belong in history/case study areas, not Home suggestions.
    if (isProjectCompletedForHomeMission(project)) return false;

    // A ship update is a daily action. Once shipped today, remove it from this suggested queue.
    if (wasProjectShippedTodayForHome(project)) return false;

    return true;
  });

  // Heuristic ranking: at-risk first, then most open tasks, then lowest velocity/readiness.
  const ranked = [...visibleProjects].sort((a, b) => {
    const aRisk = a?.isAtRisk ? 1 : 0;
    const bRisk = b?.isAtRisk ? 1 : 0;
    if (aRisk !== bRisk) return bRisk - aRisk;

    const aOpen = a?.metrics?.openTasks?.value ?? a?.openTaskCount ?? 0;
    const bOpen = b?.metrics?.openTasks?.value ?? b?.openTaskCount ?? 0;
    if (aOpen !== bOpen) return bOpen - aOpen;

    const aReadiness = getMissionReadinessScore(a);
    const bReadiness = getMissionReadinessScore(b);
    return aReadiness - bReadiness;
  });

  return ranked.slice(0, 3).map((project) => {
    const id =
      getProjectId?.(project) ||
      project?._id ||
      project?.id ||
      project?.projectId ||
      project?.project?._id ||
      project?.project?.id ||
      "";

    const name =
      project?.name ||
      project?.title ||
      project?.project?.name ||
      project?.project?.title ||
      "Untitled Project";

    const readinessScore = getMissionReadinessScore(project);
    const logoFields = getProjectLogoFieldsForHome(project);

    return {
      ...project,
      ...logoFields,

      id: String(id),
      _id: String(id),
      projectId: String(id),

      title: name,
      name,
      projectName: name,

      status: project?.status,
      completedAt: project?.completedAt,
      shippedAt: project?.shippedAt,
      lastShip: project?.lastShip || project?.metrics?.lastShip || "",
      lastShipAt: project?.lastShipAt || project?.metrics?.lastShipAt || null,

      progress: readinessScore,
      readinessScore,
      closureReadiness: project?.closureReadiness || null,

      type: project?.type || "ship",
      category: project?.category || "Core",
      eta: project?.eta || "1h",
      priority: project?.priority || "normal",
      reason:
        project?.reason ||
        project?.description ||
        "Recommended from your active project work.",
    };
  });
}'''

text = text[:start] + new_to_missions + text[end:]

path.write_text(text)

print("✅ Home missions now hide projects that were shipped today.")
print("✅ Completed/archived projects remain filtered out.")
print("✅ Mission progress now uses readinessScore-style fields before project.progress.")
print("✅ Logo fields remain preserved for MissionCard.")
print("")
print("Inspect with:")
print("rg -n \"wasProjectShippedTodayForHome|isProjectCompletedForHomeMission|getMissionReadinessScore|function toMissions|lastShipAt|progress: readinessScore\" src/hooks/useHomeRealtime.js -C 6")
