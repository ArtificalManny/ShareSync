from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/home/MissionCard.jsx")

if not path.exists():
    raise SystemExit(f"❌ Missing file: {path}")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-prefer-readiness-score-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

pattern = re.compile(
    r"function getProgressValue\(project\) \{\s*return clampPercent\([\s\S]*?\);\s*\}",
    re.M
)

replacement = '''function getProgressValue(project) {
  return clampPercent(
    project?.readinessScore ??
      project?.closureReadiness?.readinessScore ??
      project?.finishLine?.readinessScore ??
      project?.readiness?.readinessScore ??
      project?.progress ??
      project?.completion ??
      project?.completionPercent ??
      project?.percentComplete ??
      project?.metrics?.readinessScore ??
      project?.metrics?.progress ??
      project?.metrics?.completion ??
      project?.metrics?.completionPercent ??
      project?.metrics?.health ??
      project?.velocity ??
      project?.health ??
      0
  );
}'''

text, count = pattern.subn(replacement, text, count=1)

if count != 1:
    raise SystemExit("❌ Could not replace getProgressValue(). No changes written.")

path.write_text(text)

print("✅ MissionCard now prefers readinessScore / closureReadiness before generic progress.")
print("")
print("Inspect with:")
print('rg -n "function getProgressValue|readinessScore|closureReadiness|progressValue" src/components/home/MissionCard.jsx -C 6')
