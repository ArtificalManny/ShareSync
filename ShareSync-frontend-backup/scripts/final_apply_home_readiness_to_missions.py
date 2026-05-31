from pathlib import Path
from datetime import datetime
import re

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-final-apply-home-readiness-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

MARKER_START = "/* FINAL_HOME_READINESS_APPLIER_START */"
MARKER_END = "/* FINAL_HOME_READINESS_APPLIER_END */"

# Remove previous copy of this exact patch if it exists.
if MARKER_START in text and MARKER_END in text:
    start = text.index(MARKER_START)
    end = text.index(MARKER_END, start) + len(MARKER_END)
    text = text[:start] + text[end:]

helper_block = r'''
/* FINAL_HOME_READINESS_APPLIER_START */
function normalizeFinalHomeReadinessKey(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "object") {
    const raw =
      value._id ||
      value.id ||
      value.projectId ||
      value.$oid ||
      value.value ||
      value.toString?.();

    return raw ? String(raw).trim().toLowerCase() : "";
  }

  return String(value).trim().toLowerCase();
}

function collectFinalHomeMissionKeys(item) {
  const keys = [
    item?._id,
    item?.id,
    item?.projectId,
    item?.sourceProjectId,
    item?.parentProjectId,
    item?.project?._id,
    item?.project?.id,
    item?.project?.projectId,
  ]
    .map(normalizeFinalHomeReadinessKey)
    .filter(Boolean);

  const names = [
    item?.name,
    item?.title,
    item?.projectName,
    item?.project?.name,
    item?.project?.title,
    item?.recommendedTask?.projectName,
    item?.recommendedTask?.project?.name,
    item?.recommendedTask?.project?.title,
  ]
    .map(normalizeFinalHomeReadinessKey)
    .filter(Boolean)
    .map((name) => `name:${name}`);

  return [...new Set([...keys, ...names])];
}

function findFinalHomeSourceProject(mission, projects = []) {
  const missionKeys = new Set(collectFinalHomeMissionKeys(mission));

  return (Array.isArray(projects) ? projects : []).find((project) => {
    const projectKeys = collectFinalHomeMissionKeys(project);
    return projectKeys.some((key) => missionKeys.has(key));
  });
}

function getFinalHomeReadinessScore(readiness) {
  const raw =
    readiness?.readinessScore ??
    readiness?.closureReadiness?.readinessScore ??
    readiness?.finishLine?.readinessScore ??
    readiness?.score ??
    readiness?.progress ??
    readiness?.completionPercent;

  const num = Number(raw);
  return Number.isFinite(num) ? Math.max(0, Math.min(100, Math.round(num))) : null;
}

function applyFinalHomeReadinessToMission(mission, readinessByProjectId = {}, projects = []) {
  const sourceProject = findFinalHomeSourceProject(mission, projects);

  const lookupKeys = [
    ...collectFinalHomeMissionKeys(mission),
    ...collectFinalHomeMissionKeys(sourceProject),
  ];

  const readiness =
    lookupKeys
      .map((key) => readinessByProjectId[key])
      .find((value) => getFinalHomeReadinessScore(value) !== null) || null;

  if (!readiness) return mission;

  const readinessScore = getFinalHomeReadinessScore(readiness);

  if (readinessScore === null) return mission;

  return {
    ...mission,
    progress: readinessScore,
    readinessScore,
    closureReadiness: {
      ...(mission?.closureReadiness || {}),
      ...(readiness?.closureReadiness || readiness),
      readinessScore,
    },
    readiness: {
      ...(mission?.readiness || {}),
      ...(readiness?.readiness || readiness),
      readinessScore,
    },
    finishLine: {
      ...(mission?.finishLine || {}),
      readinessScore,
    },
  };
}
/* FINAL_HOME_READINESS_APPLIER_END */

'''

anchor = "function toPriorityMissions("
idx = text.find(anchor)

if idx == -1:
    raise SystemExit("❌ Could not find function toPriorityMissions anchor. No changes written.")

text = text[:idx] + helper_block + text[idx:]
print("✅ Added final readiness applier helpers.")

# Replace the final missions useMemo.
pattern = re.compile(
    r'''const\s+missions\s*=\s*useMemo\s*\(\s*\(\)\s*=>\s*\{.*?\}\s*,\s*\[[^\]]*\]\s*\);''',
    re.S
)

replacement = r'''const missions = useMemo(() => {
    const priorityMissions = toPriorityMissions(priorityTasks, projects);
    const baseMissions = priorityMissions.length > 0 ? priorityMissions : toMissions(projects);

    return baseMissions.map((mission) =>
      applyFinalHomeReadinessToMission(
        mission,
        missionReadinessByProjectId,
        projects
      )
    );
  }, [priorityTasks, projects, missionReadinessByProjectId]);'''

matches = list(pattern.finditer(text))

if not matches:
    raise SystemExit("❌ Could not find const missions = useMemo(...) block. No changes written.")

# Use the last one in case old duplicate code exists higher in the file.
match = matches[-1]
text = text[:match.start()] + replacement + text[match.end():]

path.write_text(text)

print("✅ Replaced final missions useMemo with readiness-aware mapper.")
print("")
print("Inspect with:")
print('rg -n "FINAL_HOME_READINESS_APPLIER|applyFinalHomeReadinessToMission|const missions = useMemo" src/hooks/useHomeRealtime.js -C 8')
print("node --check src/hooks/useHomeRealtime.js")
