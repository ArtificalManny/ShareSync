from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/pages/Home.jsx")

if not path.exists():
    raise FileNotFoundError("Could not find src/pages/Home.jsx")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-streak-sync-v2-{stamp}")
shutil.copy2(path, backup)

text = path.read_text()

# 1) Repair existing malformed arrow function typo if present.
bad_click = "onClick={() ="
good_click = "onClick={() =>"

bad_click_count = text.count(bad_click)
if bad_click_count:
    text = text.replace(bad_click, good_click)

# 2) Sync Your Streak with the same summary source used by Velocity Metrics.
old = '''              <StreakComparison
                variant="compact"
                showChart={false}
                showLeader={true}
                showRank={true}
                userStreakDays={streakComparison.userStreakDays}
                teamAvgDays={streakComparison.teamAvgDays}
                rankText={streakComparison.rankText}
              />'''

new = '''              <StreakComparison
                variant="compact"
                showChart={false}
                showLeader={true}
                showRank={true}
                userStreakDays={
                  Number(
                    summary?.streakDays ??
                      summary?.currentStreak ??
                      streakComparison?.userStreakDays ??
                      0
                  ) || 0
                }
                teamAvgDays={
                  Number(
                    streakComparison?.teamAvgDays ??
                      summary?.teamAvgDays ??
                      summary?.teamAverageStreak ??
                      0
                  ) || 0
                }
                rankText={streakComparison?.rankText || "Top 3"}
              />'''

if old not in text:
    shutil.copy2(backup, path)
    raise RuntimeError(
        "Could not find the exact StreakComparison block. Original restored.\\n"
        "Run this and paste the output:\\n"
        "grep -n -B 25 -A 35 \"<StreakComparison\" src/pages/Home.jsx"
    )

text = text.replace(old, new, 1)

# Final safety checks.
unsafe_patterns = [
    "onClick={() =",
    "className={className={",
    "undefined undefined",
]

for bad in unsafe_patterns:
    if bad in text:
        shutil.copy2(backup, path)
        raise RuntimeError(f"Unsafe pattern still exists after repair: {bad}. Original restored.")

required = [
    "summary?.streakDays",
    "summary?.currentStreak",
    "streakComparison?.userStreakDays",
]

missing = [item for item in required if item not in text]
if missing:
    shutil.copy2(backup, path)
    raise RuntimeError(f"Patch incomplete. Missing: {missing}. Original restored.")

path.write_text(text)

print("Home streak sync v2 applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print(f"Repaired malformed onClick arrow patterns: {bad_click_count}")
print("")
print("Changed only:")
print("- Repaired existing onClick={() = typo if present")
print("- Your Streak now prioritizes summary.streakDays/currentStreak")
print("- Falls back to streakComparison.userStreakDays only if needed")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No styling changed.")
