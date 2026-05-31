from pathlib import Path
from datetime import datetime

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-readiness-name-key-fallback-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

def replace_function(source, function_name, replacement):
    marker = f"function {function_name}("
    start = source.find(marker)
    if start == -1:
        raise SystemExit(f"❌ Could not find function {function_name}(). No changes written.")

    brace_start = source.find("{", start)
    if brace_start == -1:
        raise SystemExit(f"❌ Could not find opening brace for {function_name}(). No changes written.")

    depth = 0
    end = None

    for index in range(brace_start, len(source)):
        char = source[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end = index + 1
                break

    if end is None:
        raise SystemExit(f"❌ Could not find closing brace for {function_name}(). No changes written.")

    return source[:start] + replacement + source[end:]


# 1) Add name-key helpers after getHomeProjectLookupKeys()
if "function getHomeProjectNameKeys(" not in text:
    anchor = "function getProjectLogoFields(project) {"
    helper = r'''
function normalizeHomeReadinessNameKey(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  return text ? `name:${text}` : "";
}

function getHomeProjectNameKeys(project) {
  const candidates = [
    project?.name,
    project?.title,
    project?.displayTitle,
    project?.projectName,
    project?.projectTitle,
    project?.subtitle,
    project?.category,

    project?.project?.name,
    project?.project?.title,
    project?.raw?.project?.name,
    project?.raw?.project?.title,

    project?.recommendedTask?.projectName,
    project?.recommendedTask?.projectTitle,
    project?.task?.projectName,
    project?.task?.projectTitle,
  ];

  return [
    ...new Set(
      candidates
        .map(normalizeHomeReadinessNameKey)
        .filter(Boolean)
    ),
  ];
}

function getHomeMissionReadinessKeys(project) {
  return [
    ...new Set([
      ...getHomeProjectLookupKeys(project),
      ...getHomeProjectNameKeys(project),
    ]),
  ];
}

'''
    if anchor not in text:
        raise SystemExit("❌ Could not find insertion point before getProjectLogoFields(). No changes written.")

    text = text.replace(anchor, helper + anchor, 1)
    print("✅ Added name-key readiness helpers.")
else:
    print("✅ Name-key readiness helpers already exist.")


# 2) Replace applyReadinessToMission so it checks ID + name keys
replacement_apply = r'''function applyReadinessToMission(mission, readinessByProjectId = {}) {
  const lookupKeys = getHomeMissionReadinessKeys(mission);
  const readiness =
    lookupKeys
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
    blockingReasons: Array.isArray(readiness.blockingReasons) ? readiness.blockingReasons : [],
    warnings: Array.isArray(readiness.warnings) ? readiness.warnings : [],
    closureReadiness: readiness.closureReadiness || readiness,
  };
}'''

text = replace_function(text, "applyReadinessToMission", replacement_apply)
print("✅ applyReadinessToMission now checks ID + name readiness keys.")


# 3) Replace the visible mission/project ID collection block in loadMissionReadiness()
old_block = r'''      const priorityMissions = toPriorityMissions(priorityTasks, projects);
      const visibleMissions = (
        priorityMissions.length > 0 ? priorityMissions : toMissions(projects)
      ).slice(0, 3);

      const projectIds = [
        ...new Set(
          visibleMissions
            .map((mission) => getHomeProjectId(mission))
            .filter(Boolean)
        ),
      ];'''

new_block = r'''      const priorityMissions = toPriorityMissions(priorityTasks, projects);
      const visibleMissions = (
        priorityMissions.length > 0 ? priorityMissions : toMissions(projects)
      ).slice(0, 3);

      // Build a wider pool because priority-task missions can carry task-shaped IDs.
      // We hydrate real project IDs, then store readiness under both ID keys and name keys.
      const missionPool = [
        ...visibleMissions,
        ...toMissions(projects),
        ...(Array.isArray(projects) ? projects : []),
      ].filter(Boolean);

      const missionLookupForReadiness = new Map();

      for (const item of missionPool) {
        const ids = getHomeProjectLookupKeys(item);
        const keys = getHomeMissionReadinessKeys(item);

        for (const id of ids) {
          if (!missionLookupForReadiness.has(id)) {
            missionLookupForReadiness.set(id, new Set());
          }

          keys.forEach((key) => missionLookupForReadiness.get(id).add(key));
        }
      }

      const projectIds = [
        ...new Set(
          missionPool
            .flatMap((mission) => getHomeProjectLookupKeys(mission))
            .filter(Boolean)
        ),
      ];'''

if old_block not in text:
    raise SystemExit("❌ Could not find loadMissionReadiness projectIds block. No changes written.")

text = text.replace(old_block, new_block, 1)
print("✅ loadMissionReadiness now builds ID + name key map.")


# 4) Replace previous return tuple with key-map return
old_return = r'''            return [projectId, readiness, getHomeProjectLookupKeys(
              visibleMissions.find((mission) => getHomeProjectLookupKeys(mission).includes(projectId)) || {}
            )];'''

new_return = r'''            return [
              projectId,
              readiness,
              Array.from(missionLookupForReadiness.get(projectId) || []),
            ];'''

if old_return not in text:
    raise SystemExit("❌ Could not find old readiness return tuple. No changes written.")

text = text.replace(old_return, new_return, 1)
print("✅ Readiness entries now return stored ID + name keys.")


# 5) Make sure storage block is the widened version
old_storage = r'''        entries.filter(Boolean).forEach(([projectId, readiness]) => {
          next[projectId] = readiness;
        });'''

new_storage = r'''        entries.filter(Boolean).forEach(([projectId, readiness, lookupKeys = []]) => {
          const keys = [...new Set([projectId, ...lookupKeys].filter(Boolean))];

          keys.forEach((key) => {
            next[key] = readiness;
          });
        });'''

if old_storage in text:
    text = text.replace(old_storage, new_storage, 1)
    print("✅ Upgraded readiness storage block.")
else:
    print("✅ Readiness storage block already widened.")

path.write_text(text)

print("")
print("✅ Home readiness now stores and reads by project ID AND project name.")
print("✅ This should fix ShareSync Core staying at 0 while Uno shows 85.")
print("")
print("Inspect with:")
print('rg -n "getHomeProjectNameKeys|getHomeMissionReadinessKeys|missionLookupForReadiness|applyReadinessToMission|entries.filter" src/hooks/useHomeRealtime.js -C 8')
