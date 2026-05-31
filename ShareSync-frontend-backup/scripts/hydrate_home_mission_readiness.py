from pathlib import Path
from datetime import datetime
import re

path = Path("src/hooks/useHomeRealtime.js")

if not path.exists():
    raise SystemExit(f"❌ Missing file: {path}")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-hydrate-home-mission-readiness-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1) Add API import if missing.
if "getProjectClosureReadiness" not in text:
    # Try adding to existing api/projects import.
    import_match = re.search(r'import\s*\{([^}]+)\}\s*from\s*["\']../api/projects["\'];', text, re.S)

    if import_match:
        inside = import_match.group(1)
        new_inside = inside.rstrip()
        if not new_inside.strip().endswith(","):
            new_inside += ","
        new_inside += "\n  getProjectClosureReadiness,"
        text = text[:import_match.start(1)] + new_inside + text[import_match.end(1):]
    else:
        # Add standalone import after existing imports.
        lines = text.splitlines()
        insert_at = 0
        for i, line in enumerate(lines):
            if line.startswith("import "):
                insert_at = i + 1
        lines.insert(insert_at, 'import { getProjectClosureReadiness } from "../api/projects";')
        text = "\n".join(lines) + "\n"

# 2) Add helper to safely read readiness response.
helper = r'''
function normalizeHomeMissionReadinessPayload(payload) {
  const data =
    payload?.data ||
    payload?.readiness ||
    payload?.closureReadiness ||
    payload?.result ||
    payload ||
    {};

  const readiness =
    data?.closureReadiness ||
    data?.readiness ||
    data;

  const score = Number(
    readiness?.readinessScore ??
      readiness?.score ??
      data?.readinessScore ??
      data?.score ??
      0
  );

  return {
    readinessScore: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0,
    isReadyToClose: Boolean(readiness?.isReadyToClose ?? data?.isReadyToClose),
    blockingReasons: Array.isArray(readiness?.blockingReasons) ? readiness.blockingReasons : [],
    warnings: Array.isArray(readiness?.warnings) ? readiness.warnings : [],
    closureReadiness: readiness,
  };
}

async function hydrateMissionReadiness(missions = []) {
  const safeMissions = Array.isArray(missions) ? missions : [];

  const hydrated = await Promise.all(
    safeMissions.map(async (mission) => {
      const projectId =
        mission?._id ||
        mission?.id ||
        mission?.projectId ||
        mission?.project?._id ||
        mission?.project?.id;

      if (!projectId) return mission;

      try {
        const readinessPayload = await getProjectClosureReadiness(projectId);
        const readiness = normalizeHomeMissionReadinessPayload(readinessPayload);

        return {
          ...mission,
          progress: readiness.readinessScore,
          readinessScore: readiness.readinessScore,
          isReadyToClose: readiness.isReadyToClose,
          blockingReasons: readiness.blockingReasons,
          warnings: readiness.warnings,
          closureReadiness: readiness.closureReadiness,
        };
      } catch (error) {
        console.warn("[useHomeRealtime] Failed to hydrate mission readiness:", {
          projectId,
          message: error?.message || error,
        });

        return mission;
      }
    })
  );

  return hydrated;
}
'''

if "function hydrateMissionReadiness(" not in text:
    # Insert after getMissionReadinessScore if present, otherwise before toMissions.
    marker = "function toMissions(projects)"
    idx = text.find(marker)

    if idx == -1:
        raise SystemExit("❌ Could not find function toMissions(projects). No changes written.")

    text = text[:idx] + helper + "\n" + text[idx:]

# 3) Patch assignment where missions are set.
# We look for setMissions(toMissions(projects)) or equivalent.
patterns = [
    (
        r"setMissions\(\s*toMissions\(([^)]+)\)\s*\);",
        r"setMissions(await hydrateMissionReadiness(toMissions(\1)));"
    ),
    (
        r"const\s+nextMissions\s*=\s*toMissions\(([^)]+)\);\s*setMissions\(nextMissions\);",
        r"const nextMissions = await hydrateMissionReadiness(toMissions(\1));\n      setMissions(nextMissions);"
    ),
]

patched = False
for pattern, replacement in patterns:
    text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count:
        patched = True
        break

if not patched:
    print("⚠️ Could not automatically patch setMissions(...).")
    print("Manual change needed inside the project fetch/refresh function:")
    print("")
    print("Replace:")
    print("  setMissions(toMissions(projects));")
    print("")
    print("With:")
    print("  setMissions(await hydrateMissionReadiness(toMissions(projects)));")
    print("")
else:
    print("✅ Mission readiness hydration wired into setMissions().")

path.write_text(text)

print("✅ Home mission readiness helper added.")
print("✅ Suggested Projects & Missions can now use the same readiness score as Finish Line.")
print("")
print("Inspect with:")
print('rg -n "getProjectClosureReadiness|hydrateMissionReadiness|normalizeHomeMissionReadinessPayload|setMissions" src/hooks/useHomeRealtime.js -C 6')
