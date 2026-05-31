from pathlib import Path
from datetime import datetime

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-clean-apply-readiness-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

start_marker = "function applyReadinessToMission("
end_marker = "function toPriorityMissions("

start = text.find(start_marker)
end = text.find(end_marker)

if start == -1:
    raise SystemExit("❌ Could not find applyReadinessToMission(). No changes written.")

if end == -1:
    raise SystemExit("❌ Could not find toPriorityMissions(). No changes written.")

if end <= start:
    raise SystemExit("❌ Function order looks wrong. No changes written.")

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
    warnings: Array.isArray(readiness.warnings) ? readiness.warnings : [],
    closureReadiness: readiness.closureReadiness || readiness,
  };
}

'''

updated = text[:start] + clean_block + text[end:]

# Safety checks
if updated.count("function applyReadinessToMission(") != 1:
    raise SystemExit("❌ Safety failed: applyReadinessToMission count is not 1.")

if updated.count("function toPriorityMissions(") != 1:
    raise SystemExit("❌ Safety failed: toPriorityMissions count is not 1.")

if "}) {" in updated[start:updated.find(end_marker)]:
    raise SystemExit("❌ Safety failed: leftover `}) {` still exists near applyReadinessToMission.")

if "closureReadiness: readiness.closureReadiness || readiness,\n\nfunction toPriorityMissions" in updated:
    raise SystemExit("❌ Safety failed: object/function boundary is still broken.")

path.write_text(updated)

print("✅ applyReadinessToMission() replaced cleanly.")
print("✅ Broken duplicate function body removed.")
print("")
print("Inspect with:")
print("nl -ba src/hooks/useHomeRealtime.js | sed -n '610,670p'")
print("node --check src/hooks/useHomeRealtime.js")
