from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/pages/ProjectHome.jsx")

text = path.read_text()

backup = Path(f"{path}.bak-before-real-whats-next-overview-icon-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1. Add Milestone import if missing
import_match = re.search(
    r'import\s*\{(?P<body>[\s\S]*?)\}\s*from\s*["\']lucide-react["\'];',
    text,
)

if not import_match:
    raise SystemExit("❌ Could not find lucide-react import block.")

body = import_match.group("body")

if "Milestone" not in body:
    body = body.rstrip()
    if not body.rstrip().endswith(","):
        body += ","
    body += "\n  Milestone,"
    text = text[:import_match.start("body")] + body + "\n" + text[import_match.end("body"):]
    print("✅ Added Milestone import.")
else:
    print("ℹ️ Milestone already imported.")

# 2. Replace the icon prop ONLY inside the OverviewSignalCard with label What’s next
pattern = re.compile(
    r'(<OverviewSignalCard\s+)(?P<body>[\s\S]*?label=["\']What[’\']s next["\'][\s\S]*?)(/>)',
    re.MULTILINE,
)

matches = list(pattern.finditer(text))

if not matches:
    raise SystemExit(
        "❌ Could not find the What’s Next OverviewSignalCard.\n"
        "Run:\n"
        "rg -n \"OverviewSignalCard|What.?s next|icon=\\{\" src/pages/ProjectHome.jsx -C 20"
    )

match = matches[0]
block = match.group(0)

old_block = block
new_block = re.sub(r'icon=\{[A-Za-z0-9_]+\}', 'icon={Milestone}', block, count=1)

if old_block == new_block:
    raise SystemExit(
        "❌ Found the What’s Next card, but could not replace its icon prop.\n"
        "Run:\n"
        "rg -n \"OverviewSignalCard|What.?s next|icon=\\{\" src/pages/ProjectHome.jsx -C 25"
    )

text = text[:match.start()] + new_block + text[match.end():]

path.write_text(text)

print("")
print("✅ What’s Next overview icon changed to Milestone.")
print("✅ This targets the actual top overview card, not Priority Stack.")
print("")
print("Inspect:")
print('rg -n "Milestone|OverviewSignalCard|What.?s next|icon=\\{" src/pages/ProjectHome.jsx -C 18')
