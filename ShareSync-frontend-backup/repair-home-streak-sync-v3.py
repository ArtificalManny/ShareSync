from pathlib import Path
from datetime import datetime
import shutil
import re

path = Path("src/pages/Home.jsx")

if not path.exists():
    raise FileNotFoundError("Could not find src/pages/Home.jsx")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-streak-sync-v3-{stamp}")
shutil.copy2(path, backup)

text = path.read_text()

# Correctly detect ONLY malformed handlers like:
# onClick={() = something}
# but NOT valid handlers like:
# onClick={() => something}
bad_arrow_regex = re.compile(r"onClick=\{\(\)\s*=(?!>)")
bad_arrow_count = len(bad_arrow_regex.findall(text))

if bad_arrow_count:
    text = bad_arrow_regex.sub("onClick={() =>", text)

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

# Real safety checks only.
unsafe_regexes = [
    (r"onClick=\{\(\)\s*=(?!>)", "malformed onClick arrow"),
    (r"onClick=\{\(\)\s*=>\s*>", "double-arrow typo onClick={() =>>"),
    (r"className=\{className=\{", "double className corruption"),
]

for pattern, label in unsafe_regexes:
    if re.search(pattern, text):
        shutil.copy2(backup, path)
        raise RuntimeError(f"Unsafe pattern detected after patch: {label}. Original restored.")

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

print("Home streak sync v3 applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print(f"Actually malformed onClick handlers repaired: {bad_arrow_count}")
print("")
print("Changed only:")
print("- Your Streak now prioritizes summary.streakDays/currentStreak")
print("- Falls back to streakComparison.userStreakDays only if needed")
print("- Fixed the false unsafe-check problem from the previous script")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No styling changed.")
