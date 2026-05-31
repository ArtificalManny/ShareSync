from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/pages/Home.jsx")

if not path.exists():
    raise FileNotFoundError("Could not find src/pages/Home.jsx")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-streak-sync-{stamp}")
shutil.copy2(path, backup)

text = path.read_text()

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
    raise RuntimeError(
        "Could not find the exact StreakComparison block. No changes written.\\n"
        "Run this and paste the output:\\n"
        "grep -n -B 20 -A 30 \"<StreakComparison\" src/pages/Home.jsx"
    )

text = text.replace(old, new, 1)

bad_patterns = [
    "onClick={() =",
    "className={className={",
    "undefined undefined",
]

for bad in bad_patterns:
    if bad in text:
        shutil.copy2(backup, path)
        raise RuntimeError(f"Unsafe pattern detected: {bad}. Original restored.")

path.write_text(text)

print("Home streak comparison sync applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Your Streak now prioritizes summary.streakDays/currentStreak")
print("- Falls back to streakComparison.userStreakDays only if needed")
print("- Keeps team average and rank fallback safe")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No styling changed.")
