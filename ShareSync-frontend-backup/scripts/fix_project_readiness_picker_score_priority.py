from pathlib import Path
from datetime import datetime
import re

path = Path("src/api/projects.js")

if not path.exists():
    raise SystemExit("❌ src/api/projects.js not found.")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-readiness-picker-score-priority-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

pattern = re.compile(
    r"  const pickReadiness = \(payload\) => \{\n"
    r"    const data =\n"
    r"      payload\?\.data \|\|\n"
    r"      payload\?\.overview \|\|\n"
    r"      payload\?\.result \|\|\n"
    r"      payload;\n\n"
    r"    return \(\n"
    r"      data\?\.finishLine \|\|\n"
    r"      data\?\.closureReadiness \|\|\n"
    r"      data\?\.readiness \|\|\n"
    r"      data\?\.project\?\.finishLine \|\|\n"
    r"      data\?\.project\?\.closureReadiness \|\|\n"
    r"      payload\?\.finishLine \|\|\n"
    r"      payload\?\.closureReadiness \|\|\n"
    r"      payload\?\.readiness \|\|\n"
    r"      null\n"
    r"    \);\n"
    r"  \};",
    re.MULTILINE
)

replacement = '''  const pickReadiness = (payload) => {
    const data =
      payload?.data ||
      payload?.overview ||
      payload?.result ||
      payload;

    const candidates = [
      data?.closureReadiness,
      data?.finishLine,
      data?.readiness,
      data?.project?.closureReadiness,
      data?.project?.finishLine,
      data?.project?.readiness,
      payload?.closureReadiness,
      payload?.finishLine,
      payload?.readiness,
      data,
    ];

    const hasUsableScore = (item) => {
      if (!item || typeof item !== "object") return false;

      const raw =
        item.readinessScore ??
        item.score ??
        item.progress ??
        item.completionPercent;

      return Number.isFinite(Number(raw));
    };

    return candidates.find(hasUsableScore) || null;
  };'''

text, count = pattern.subn(replacement, text, count=1)

if count != 1:
    raise SystemExit("❌ Could not replace pickReadiness(). No changes written.")

path.write_text(text)

print("✅ Readiness picker now chooses the first object with an actual numeric score.")
print("✅ closureReadiness.readinessScore will win over an empty/malformed finishLine object.")
print("✅ ShareSync Core should now show 85% instead of 0%.")
print("")
print("Inspect with:")
print('rg -n "const pickReadiness|candidates|hasUsableScore|closureReadiness|finishLine" src/api/projects.js -C 8')
