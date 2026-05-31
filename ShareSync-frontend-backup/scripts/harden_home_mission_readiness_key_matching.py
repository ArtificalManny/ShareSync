from pathlib import Path
from datetime import datetime
import re

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-readiness-key-matching-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1) Add robust key helper after getHomeProjectId()
if "function getHomeProjectLookupKeys(" not in text:
    anchor = "function getProjectLogoFields(project) {"
    helper = r'''
function getHomeProjectLookupKeys(project) {
  const candidates = [
    getHomeProjectId(project),
    project?.projectId,
    project?._id,
    project?.id,
    project?.sourceProjectId,
    project?.parentProjectId,

    project?.project?._id,
    project?.project?.id,
    project?.project?.projectId,

    project?.raw?.project?._id,
    project?.raw?.project?.id,
    project?.raw?.projectId?._id,
    project?.raw?.projectId?.id,
    project?.raw?.projectId,

    project?.recommendedTask?.projectId?._id,
    project?.recommendedTask?.projectId?.id,
    project?.recommendedTask?.projectId,
    project?.task?.projectId?._id,
    project?.task?.projectId?.id,
    project?.task?.projectId,
  ];

  return [
    ...new Set(
      candidates
        .map((value) => {
          if (!value) return "";
          if (typeof value === "object") {
            return String(value._id || value.id || value.projectId || value.toString?.() || "");
          }
          return String(value);
        })
        .map((value) => value.trim())
        .filter(Boolean)
    ),
  ];
}

'''
    if anchor not in text:
        raise SystemExit("❌ Could not find insertion point before getProjectLogoFields(). No changes written.")
    text = text.replace(anchor, helper + anchor, 1)
    print("✅ Added getHomeProjectLookupKeys().")
else:
    print("✅ getHomeProjectLookupKeys() already exists.")

# 2) Replace applyReadinessToMission with robust lookup
pattern = re.compile(
    r"function applyReadinessToMission\(mission, readinessByProjectId = \{\}\) \{.*?\n\}",
    re.DOTALL
)

replacement = r'''function applyReadinessToMission(mission, readinessByProjectId = {}) {
  const lookupKeys = getHomeProjectLookupKeys(mission);
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

text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit("❌ Could not replace applyReadinessToMission(). No changes written.")
print("✅ Hardened applyReadinessToMission().")

# 3) Patch loadMissionReadiness to store readiness under every possible mission key
old = r'''        entries.filter(Boolean).forEach(([projectId, readiness]) => {
          next[projectId] = readiness;
        });'''

new = r'''        entries.filter(Boolean).forEach(([projectId, readiness, lookupKeys = []]) => {
          const keys = [...new Set([projectId, ...lookupKeys].filter(Boolean))];

          keys.forEach((key) => {
            next[key] = readiness;
          });
        });'''

if old not in text:
    raise SystemExit("❌ Could not find entries storage block. No changes written.")

text = text.replace(old, new, 1)
print("✅ Readiness state now stores under all lookup keys.")

# 4) Patch entries return to include lookup keys
old_return = r'''            return [projectId, readiness];'''

new_return = r'''            return [projectId, readiness, getHomeProjectLookupKeys(
              visibleMissions.find((mission) => getHomeProjectLookupKeys(mission).includes(projectId)) || {}
            )];'''

if old_return not in text:
    raise SystemExit("❌ Could not find readiness return tuple. No changes written.")

text = text.replace(old_return, new_return, 1)
print("✅ Readiness entries now carry lookup keys.")

path.write_text(text)

print("")
print("✅ Home mission readiness key matching hardened.")
print("✅ ShareSync Core should now receive the same 85 readiness value as ProjectHome.")
print("")
print("Inspect with:")
print('rg -n "getHomeProjectLookupKeys|applyReadinessToMission|entries.filter|return \\[projectId, readiness" src/hooks/useHomeRealtime.js -C 8')
