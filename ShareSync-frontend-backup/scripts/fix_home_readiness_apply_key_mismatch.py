from pathlib import Path
from datetime import datetime

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-fix-readiness-apply-key-mismatch-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

if "function getHomeProjectLookupKeys(project)" not in text:
    raise SystemExit("❌ getHomeProjectLookupKeys(project) was not found. No changes written.")

# 1. Force the older mission-key helper to use the newer, stronger lookup helper.
mission_key_start = text.find("function getHomeMissionReadinessKeys(")

if mission_key_start != -1:
    mission_key_end = text.find("\nfunction ", mission_key_start + 1)
    if mission_key_end == -1:
        raise SystemExit("❌ Could not find end of getHomeMissionReadinessKeys(). No changes written.")

    new_mission_key_helper = '''function getHomeMissionReadinessKeys(project) {
  return getHomeProjectLookupKeys(project);
}

'''
    text = text[:mission_key_start] + new_mission_key_helper + text[mission_key_end:]
    print("✅ getHomeMissionReadinessKeys() now delegates to getHomeProjectLookupKeys().")
else:
    insert_after = text.find("function getHomeProjectLookupKeys(project)")
    next_function = text.find("\nfunction ", insert_after + 1)

    if next_function == -1:
        raise SystemExit("❌ Could not insert getHomeMissionReadinessKeys(). No changes written.")

    new_mission_key_helper = '''
function getHomeMissionReadinessKeys(project) {
  return getHomeProjectLookupKeys(project);
}

'''
    text = text[:next_function] + new_mission_key_helper + text[next_function:]
    print("✅ getHomeMissionReadinessKeys() inserted.")

# 2. Replace applyReadinessToMission cleanly so it uses the stronger key helper directly.
apply_start = text.find("function applyReadinessToMission(")
if apply_start == -1:
    raise SystemExit("❌ Could not find applyReadinessToMission(). No changes written.")

apply_end = text.find("\nfunction toPriorityMissions(", apply_start)
if apply_end == -1:
    raise SystemExit("❌ Could not find function toPriorityMissions() after applyReadinessToMission(). No changes written.")

new_apply = '''function applyReadinessToMission(mission, readinessByProjectId = {}) {
  const lookupKeys = getHomeProjectLookupKeys(mission);

  const readiness =
    lookupKeys
      .map((key) => readinessByProjectId[key])
      .find(Boolean) || null;

  if (!readiness) return mission;

  const rawScore =
    readiness.readinessScore ??
    readiness.score ??
    readiness.progress ??
    readiness.completionPercent ??
    0;

  const readinessScore = Math.max(
    0,
    Math.min(100, Math.round(Number(rawScore) || 0))
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
    closureReadiness: {
      ...readiness,
      readinessScore,
    },
  };
}

'''

text = text[:apply_start] + new_apply + text[apply_end + 1:]

if text.count("function getHomeProjectLookupKeys(") != 1:
    raise SystemExit("❌ Safety failed: getHomeProjectLookupKeys count is not 1.")

if text.count("function getHomeMissionReadinessKeys(") != 1:
    raise SystemExit("❌ Safety failed: getHomeMissionReadinessKeys count is not 1.")

if text.count("function applyReadinessToMission(") != 1:
    raise SystemExit("❌ Safety failed: applyReadinessToMission count is not 1.")

if "}) {" in text[text.find("function applyReadinessToMission("):text.find("function toPriorityMissions(")]:
    raise SystemExit("❌ Safety failed: leftover corrupted `}) {` still exists in applyReadinessToMission block.")

path.write_text(text)

print("")
print("✅ Final readiness apply mismatch fixed.")
print("✅ ShareSync Core should now receive the same 85 readiness value as ProjectHome.")
print("")
print("Inspect with:")
print('rg -n "function getHomeMissionReadinessKeys|function getHomeProjectLookupKeys|function applyReadinessToMission|mission readiness hydrated" src/hooks/useHomeRealtime.js -C 6')
print("node --check src/hooks/useHomeRealtime.js")
