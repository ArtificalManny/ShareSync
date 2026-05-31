from pathlib import Path
from datetime import datetime
import re

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-slow-visible-readiness-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# Add sleep helper once.
if "function sleepHomeRealtime(" not in text:
    anchor = "function extractArray"
    idx = text.find(anchor)
    if idx == -1:
        raise SystemExit("❌ Could not find extractArray anchor.")
    helper = """
function sleepHomeRealtime(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

"""
    text = text[:idx] + helper + text[idx:]
    print("✅ Added sleepHomeRealtime().")

# Replace loadMissionReadiness effect/function body by locating it.
start = text.find("async function loadMissionReadiness()")
if start == -1:
    raise SystemExit("❌ Could not find async function loadMissionReadiness().")

# Find the closing brace of the function by brace counting.
brace_start = text.find("{", start)
if brace_start == -1:
    raise SystemExit("❌ Could not find loadMissionReadiness opening brace.")

depth = 0
end = None
for i in range(brace_start, len(text)):
    if text[i] == "{":
        depth += 1
    elif text[i] == "}":
        depth -= 1
        if depth == 0:
            end = i + 1
            break

if end is None:
    raise SystemExit("❌ Could not find loadMissionReadiness closing brace.")

replacement = r'''async function loadMissionReadiness() {
      const baseMissions = toMissions(projects).slice(0, 3);

      const visibleProjectIds = [
        ...new Set(
          baseMissions
            .map((mission) => getHomeProjectId(mission))
            .filter(Boolean)
        ),
      ];

      if (visibleProjectIds.length === 0) return;

      const nextReadiness = {};

      for (const projectId of visibleProjectIds) {
        if (cancelled) return;

        try {
          const readinessPayload = await getProjectClosureReadiness(projectId);
          const readiness = normalizeHomeMissionReadinessPayload(readinessPayload);

          if (readiness) {
            nextReadiness[projectId] = readiness;
          }

          // Prevent local backend/API rate-limit bursts.
          await sleepHomeRealtime(350);
        } catch (error) {
          console.warn("[useHomeRealtime] Mission readiness hydration failed:", {
            projectId,
            message: error?.message || error,
            status: error?.status,
          });
        }
      }

      if (cancelled) return;

      setMissionReadinessByProjectId((previous) => ({
        ...previous,
        ...nextReadiness,
      }));

      console.debug("[useHomeRealtime] Mission readiness hydration applied:", nextReadiness);
    }'''

text = text[:start] + replacement + text[end:]
print("✅ Replaced loadMissionReadiness() with slow visible-mission hydration.")

# Replace applyReadinessToMission with a strict, simple version.
start = text.find("function applyReadinessToMission(")
if start == -1:
    raise SystemExit("❌ Could not find applyReadinessToMission().")

next_fn = text.find("\nfunction toPriorityMissions", start)
if next_fn == -1:
    raise SystemExit("❌ Could not find toPriorityMissions after applyReadinessToMission().")

replacement_apply = r'''function applyReadinessToMission(mission, readinessByProjectId = {}) {
  const projectId = getHomeProjectId(mission);
  const readiness = readinessByProjectId[projectId];

  if (!readiness) return mission;

  const readinessScore = Math.max(
    0,
    Math.min(100, Math.round(Number(readiness.readinessScore ?? 0)))
  );

  return {
    ...mission,
    progress: readinessScore,
    readinessScore,
    closureReadiness: {
      ...readiness,
      readinessScore,
    },
    readiness: {
      ...readiness,
      readinessScore,
    },
    finishLine: {
      ...(mission?.finishLine || {}),
      readinessScore,
    },
  };
}

'''

text = text[:start] + replacement_apply + text[next_fn + 1:]
print("✅ Replaced applyReadinessToMission() with strict projectId matching.")

path.write_text(text)

print("")
print("✅ useHomeRealtime readiness hydration hardened.")
print("")
print("Inspect:")
print('rg -n "sleepHomeRealtime|loadMissionReadiness|Mission readiness hydration applied|applyReadinessToMission|const missions = useMemo" src/hooks/useHomeRealtime.js -C 8')
print("node --check src/hooks/useHomeRealtime.js")
