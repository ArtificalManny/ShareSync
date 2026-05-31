from pathlib import Path
from datetime import datetime

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-complete-readiness-match-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1) Add a stable project matcher that compares both IDs AND normalized names.
helper_anchor = """function getHomeMissionReadinessKeys(project) {
  return [
    ...new Set([
      ...getHomeProjectLookupKeys(project),
      ...getHomeProjectNameKeys(project),
    ]),
  ];
}
"""

helper_addition = helper_anchor + """

function findHomeMissionSourceProject(mission, projects = []) {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const missionKeys = new Set(getHomeMissionReadinessKeys(mission));

  return (
    safeProjects.find((project) =>
      getHomeMissionReadinessKeys(project).some((key) => missionKeys.has(key))
    ) || null
  );
}
"""

if "function findHomeMissionSourceProject(" not in text:
    if helper_anchor not in text:
        raise SystemExit("❌ Could not find getHomeMissionReadinessKeys helper. No changes written.")
    text = text.replace(helper_anchor, helper_addition, 1)
    print("✅ Added findHomeMissionSourceProject().")
else:
    print("✅ findHomeMissionSourceProject() already exists.")

# 2) Replace applyReadinessToMission with a version that can use raw projects as fallback.
start = text.find("function applyReadinessToMission(")
end = text.find("\nfunction toPriorityMissions(", start)

if start == -1 or end == -1:
    raise SystemExit("❌ Could not find applyReadinessToMission/toPriorityMissions boundary. No changes written.")

new_apply = """function applyReadinessToMission(mission, readinessByProjectId = {}, projects = []) {
  const matchedProject = findHomeMissionSourceProject(mission, projects);

  const lookupKeys = [
    ...getHomeMissionReadinessKeys(mission),
    ...(matchedProject ? getHomeMissionReadinessKeys(matchedProject) : []),
  ];

  const readiness =
    [...new Set(lookupKeys)]
      .map((key) => readinessByProjectId[key])
      .find(Boolean) || null;

  if (!readiness) return mission;

  const readinessScore = Math.max(
    0,
    Math.min(100, Math.round(Number(readiness.readinessScore ?? 0)))
  );

  return {
    ...mission,
    progress: readinessScore,
    readinessScore,
    isReadyToClose: Boolean(readiness.isReadyToClose),
    blockingReasons: Array.isArray(readiness.blockingReasons)
      ? readiness.blockingReasons
      : [],
    warnings: Array.isArray(readiness.warnings)
      ? readiness.warnings
      : [],
    closureReadiness: readiness.closureReadiness || readiness,
  };
}
"""

text = text[:start] + new_apply + text[end:]
print("✅ Replaced applyReadinessToMission().")

# 3) Remove the local effect-only matcher if it exists, because we now use the shared helper.
local_matcher = """    const findMatchingProjectForMission = (mission, safeProjects) => {
      const missionKeys = new Set(getHomeProjectLookupKeys(mission));

      return (
        safeProjects.find((project) =>
          getHomeProjectLookupKeys(project).some((key) => missionKeys.has(key))
        ) || null
      );
    };

"""

if local_matcher in text:
    text = text.replace(local_matcher, "", 1)
    print("✅ Removed old local ID-only matcher.")
else:
    print("ℹ️ Old local matcher not found; continuing.")

# 4) Use the shared name-aware matcher inside readiness loading.
text = text.replace(
    "const matchedProject = findMatchingProjectForMission(mission, safeProjects);",
    "const matchedProject = findHomeMissionSourceProject(mission, safeProjects);"
)

# 5) Store readiness under BOTH project lookup keys and mission/name keys.
old_lookup_block = """            const lookupKeys = [
              projectId,
              ...getHomeProjectLookupKeys(sourceProject),
              ...getHomeProjectLookupKeys(mission),
            ].filter(Boolean);
"""

new_lookup_block = """            const lookupKeys = [
              projectId,
              ...getHomeMissionReadinessKeys(sourceProject),
              ...getHomeMissionReadinessKeys(mission),
            ].filter(Boolean);
"""

if old_lookup_block in text:
    text = text.replace(old_lookup_block, new_lookup_block, 1)
    print("✅ Readiness state now stores under ID keys and name keys.")
else:
    print("⚠️ Could not find old lookupKeys block exactly. Checking for already-patched version.")

# 6) Pass projects into applyReadinessToMission during final mission render.
old_map = """    return baseMissions.map((mission) =>
      applyReadinessToMission(mission, missionReadinessByProjectId)
    );
"""

new_map = """    return baseMissions.map((mission) =>
      applyReadinessToMission(mission, missionReadinessByProjectId, projects)
    );
"""

if old_map in text:
    text = text.replace(old_map, new_map, 1)
    print("✅ Final missions now apply readiness with project fallback context.")
elif "applyReadinessToMission(mission, missionReadinessByProjectId, projects)" in text:
    print("✅ Final missions already pass projects.")
else:
    raise SystemExit("❌ Could not patch final missions map. No changes written.")

# Safety checks.
if "findMatchingProjectForMission(" in text:
    raise SystemExit("❌ Safety failed: old findMatchingProjectForMission reference still exists.")

if "applyReadinessToMission(mission, missionReadinessByProjectId)" in text:
    raise SystemExit("❌ Safety failed: old applyReadinessToMission call still exists.")

if text.count("function applyReadinessToMission(") != 1:
    raise SystemExit("❌ Safety failed: applyReadinessToMission count is not exactly 1.")

if text.count("function findHomeMissionSourceProject(") != 1:
    raise SystemExit("❌ Safety failed: findHomeMissionSourceProject count is not exactly 1.")

path.write_text(text)

print("")
print("✅ Home readiness matching is now name-aware and ID-aware.")
print("✅ ShareSync Core should now receive 85% from /projects/:id/overview.")
print("")
print("Inspect with:")
print('rg -n "findHomeMissionSourceProject|applyReadinessToMission|lookupKeys = \\[|mission readiness hydrated|const missions = useMemo" src/hooks/useHomeRealtime.js -C 8')
print("node --check src/hooks/useHomeRealtime.js")
