from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/pages/ProjectHome.jsx")

text = path.read_text()

backup = Path(f"{path}.bak-before-whats-next-icon-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1. Add Signpost import safely to lucide-react import block
import_match = re.search(
    r'import\s*\{(?P<body>[\s\S]*?)\}\s*from\s*["\']lucide-react["\'];',
    text,
)

if not import_match:
    raise SystemExit("❌ Could not find lucide-react import block.")

body = import_match.group("body")
existing_icons = set(re.findall(r"\b[A-Z][A-Za-z0-9]*\b", body))

if "Signpost" not in existing_icons:
    body = body.rstrip()
    if not body.rstrip().endswith(","):
        body += ","
    body += "\n  Signpost,"
    text = text[:import_match.start("body")] + body + "\n" + text[import_match.end("body"):]
    print("✅ Added Signpost import.")
else:
    print("ℹ️ Signpost already imported.")

# 2. Find the WHAT'S NEXT card area
label_patterns = [
    "WHAT’S NEXT",
    "WHAT'S NEXT",
    "What’s Next",
    "What's Next",
    "No priority surfaced yet",
    "priority surfaced",
]

label_pos = -1
label_used = None

for label in label_patterns:
    label_pos = text.find(label)
    if label_pos != -1:
        label_used = label
        break

if label_pos == -1:
    raise SystemExit(
        "❌ Could not find the What's Next block.\n"
        "Run:\n"
        "rg -n \"WHAT.?S NEXT|What's Next|What’s Next|No priority surfaced yet|priority surfaced\" src/pages/ProjectHome.jsx -C 25"
    )

# 3. Replace the nearest lucide icon AFTER/AROUND the label inside the card
window_start = max(0, label_pos - 1200)
window_end = min(len(text), label_pos + 2200)
window = text[window_start:window_end]

# Prefer replacing the icon in the right-side circle AFTER the label.
icon_pattern = re.compile(
    r"<([A-Z][A-Za-z0-9]*)\s+className=\"[^\"]*w-[0-9][^\"]*h-[0-9][^\"]*\"[^>]*/>"
)

matches = list(icon_pattern.finditer(window))

if not matches:
    raise SystemExit(
        "❌ Found the What's Next block, but could not find a nearby icon tag.\n"
        "Run:\n"
        "rg -n \"WHAT.?S NEXT|Target|Crosshair|CircleDot|Signpost|No priority surfaced\" src/pages/ProjectHome.jsx -C 30"
    )

# Pick icon closest to the label. This avoids touching unrelated cards.
relative_label_pos = label_pos - window_start
best = min(matches, key=lambda m: abs(m.start() - relative_label_pos))

old_tag = best.group(0)
old_icon_name = best.group(1)

new_tag = re.sub(r"<[A-Z][A-Za-z0-9]*", "<Signpost", old_tag, count=1)

absolute_start = window_start + best.start()
absolute_end = window_start + best.end()

text = text[:absolute_start] + new_tag + text[absolute_end:]

path.write_text(text)

print("")
print(f"✅ Replaced What's Next icon: {old_icon_name} → Signpost")
print(f"✅ Matched label: {label_used}")
print("")
print("Inspect:")
print('rg -n "WHAT.?S NEXT|What.?s Next|No priority surfaced|Signpost|Target|Crosshair|CircleDot" src/pages/ProjectHome.jsx -C 20')
