from pathlib import Path
from datetime import datetime

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-force-apply-readiness-clean-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

start_marker = "function applyReadinessToMission("
end_marker = "function toPriorityMissions("

start = text.find(start_marker)
if start == -1:
    raise SystemExit("❌ Could not find function applyReadinessToMission(). No changes written.")

end = text.find(end_marker, start)
if end == -1:
    raise SystemExit("❌ Could not find function toPriorityMissions() after applyReadinessToMission(). No changes written.")

clean_block = '''function applyReadinessToMission(mission, readinessByProjectId = {}) {
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
    blockingReasons: Array.isArray(readiness.blockingReasons)
      ? readiness.blockingReasons
      : [],
    warnings: Array.isArray(readiness.warnings)
      ? readiness.warnings
      : [],
    closureReadiness: readiness.closureReadiness || readiness,
  };
}

'''

updated = text[:start] + clean_block + text[end:]

if updated.count("function applyReadinessToMission(") != 1:
    raise SystemExit("❌ Safety failed: applyReadinessToMission count is not exactly 1.")

if updated.count("function toPriorityMissions(") != 1:
    raise SystemExit("❌ Safety failed: toPriorityMissions count is not exactly 1.")

path.write_text(updated)

print("✅ Corrupted applyReadinessToMission block replaced.")
print("✅ Removed orphan `}) {` duplicate body.")
print("")
print("Inspect with:")
print("nl -ba src/hooks/useHomeRealtime.js | sed -n '610,670p'")
print("node --check src/hooks/useHomeRealtime.js")
