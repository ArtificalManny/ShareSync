from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/Home.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/pages/Home.jsx. No changes made.")

text = path.read_text()
original = text

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"src/pages/Home.jsx.bak-before-remove-daily-pulse-{stamp}")
backup.write_text(original)

print(f"✅ Backup created: {backup}")

# 1) Remove the PulseCheckPrompt import.
text, import_count = re.subn(
    r'^\s*import\s+PulseCheckPrompt\s+from\s+["\']\.\./components/pulse/PulseCheckPrompt["\'];\s*\n',
    "",
    text,
    flags=re.MULTILINE,
)

# 2) Remove the current conditional Home render block:
#    {hasSuggestedTask && (
#      <div className="col-span-12">
#        <PulseCheckPrompt ... />
#      </div>
#    )}
conditional_pattern = re.compile(
    r"""
\n[ \t]*\{hasSuggestedTask\s*&&\s*\(\s*
\n[ \t]*<div\s+className=["']col-span-12["']>\s*
\n[ \t]*<PulseCheckPrompt\s*
\n[ \t]*suggestedTask=\{missions\?\.\[0\]\?\.title\s*\|\|\s*null\}\s*
\n[ \t]*className=["']home-pulse-shell\s+mb-0["']\s*
\n[ \t]*/>\s*
\n[ \t]*</div>\s*
\n[ \t]*\)\}\s*
""",
    re.VERBOSE,
)

text, conditional_count = conditional_pattern.subn("\n", text, count=1)

# 3) Also remove the older standalone version if it exists in this file:
#    <PulseCheckPrompt suggestedTask={...} className="mb-6" />
standalone_pattern = re.compile(
    r"""
\n[ \t]*\{/\*\s*═+[\s\S]*?DAILY\s+PULSE\s+CHECK\s+PROMPT[\s\S]*?═+\s*\*/\}\s*
\n[ \t]*<PulseCheckPrompt\s*
\n[ \t]*suggestedTask=\{missions\?\.\[0\]\?\.title\s*\|\|\s*null\}\s*
\n[ \t]*className=["']mb-6["']\s*
\n[ \t]*/>\s*
""",
    re.VERBOSE,
)

text, standalone_count = standalone_pattern.subn("\n", text, count=1)

# Safety checks.
if text == original:
    raise SystemExit("❌ No Daily Pulse Home block was removed. Backup exists, but Home.jsx was not changed.")

if "PulseCheckPrompt" in text:
    raise SystemExit(
        "❌ Safety check failed: PulseCheckPrompt still appears in Home.jsx. "
        "No changes written. Restore from backup if needed."
    )

if text.count("export default function Home") != 1:
    raise SystemExit("❌ Safety check failed: Home export count changed. No changes written.")

path.write_text(text)

print("✅ Removed PulseCheckPrompt import from Home.jsx:", import_count)
print("✅ Removed current conditional Daily Pulse block:", conditional_count)
print("✅ Removed older standalone Daily Pulse block if present:", standalone_count)
print("✅ Backend untouched.")
print("✅ Home.jsx should no longer show: Take 30 seconds for your daily pulse.")
print("")
print("Next checks:")
print('rg -n "Daily Pulse|daily pulse|Take 30 seconds|PulseCheckPrompt|home-pulse-shell" src/pages/Home.jsx -C 4')
