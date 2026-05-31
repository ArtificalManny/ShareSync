from pathlib import Path
import re

path = Path("src/api/workloadIntelligence.js")

if not path.exists():
    raise SystemExit("❌ src/api/workloadIntelligence.js not found.")

text = path.read_text()

backup = path.with_suffix(".js.bak-before-wrap-workload-finalizer")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

if "function finalizeWorkloadSignal(" not in text:
    raise SystemExit("❌ finalizeWorkloadSignal() does not exist yet. No changes written.")

if "return finalizeWorkloadSignal(buildWorkloadFromProjects({" in text:
    print("✅ buildWorkloadFromProjects() is already wrapped. No changes written.")
    raise SystemExit(0)

pattern = re.compile(
    r"return\s+buildWorkloadFromProjects\(\s*\{([\s\S]*?)\n\s*\}\s*\);",
    re.MULTILINE,
)

def replacement(match):
    body = match.group(1)
    return f"return finalizeWorkloadSignal(buildWorkloadFromProjects({{{body}\n  }}));"

updated, count = pattern.subn(replacement, text, count=1)

if count != 1:
    print("❌ Could not auto-wrap buildWorkloadFromProjects().")
    print("")
    print("Run this inspection and paste the output:")
    print('rg -n "buildWorkloadFromProjects|return buildWorkloadFromProjects|finalizeWorkloadSignal" src/api/workloadIntelligence.js -C 12')
    raise SystemExit(1)

path.write_text(updated)

print("✅ Wrapped buildWorkloadFromProjects() with finalizeWorkloadSignal().")
print("")
print("Inspect:")
print('rg -n "return finalizeWorkloadSignal\\(buildWorkloadFromProjects|buildWorkloadFromProjects|finalizeWorkloadSignal" src/api/workloadIntelligence.js -C 8')
