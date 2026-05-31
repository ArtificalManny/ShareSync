from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/focus/YourMovesToday.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/focus/YourMovesToday.jsx")

text = path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".bak-before-today-plan-locked-icon-{stamp}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1) Add ShieldCheck to lucide import.
import_pattern = re.compile(r"import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react['\"];")

match = import_pattern.search(text)
if not match:
    raise SystemExit("❌ Could not find lucide-react import.")

icons = [x.strip() for x in match.group(1).split(",")]
if "ShieldCheck" not in icons:
    icons.append("ShieldCheck")
    icons = sorted(set(icons))
    new_import = "import { " + ", ".join(icons) + " } from 'lucide-react';"
    text = text[:match.start()] + new_import + text[match.end():]
    print("✅ Added ShieldCheck import.")
else:
    print("✅ ShieldCheck already imported.")

# 2) Find the visible Today's Plan Locked block and replace the icon immediately before it.
markers = [
    "TODAY'S PLAN LOCKED",
    "TODAY’S PLAN LOCKED",
    "Today's Plan Locked",
    "Today’s Plan Locked",
    "today's plan locked",
    "today’s plan locked",
]

marker_index = -1
for marker in markers:
    marker_index = text.find(marker)
    if marker_index != -1:
        print(f"✅ Found marker: {marker}")
        break

if marker_index == -1:
    raise SystemExit(
        "❌ Could not find Today's Plan Locked text. Run this to inspect:\n"
        "rg -n \"TODAY|Today|locked|Locked|Sparkles|Target|Zap|ShieldCheck\" src/components/focus/YourMovesToday.jsx -C 8"
    )

window_start = max(0, marker_index - 1200)
window = text[window_start:marker_index]

# Match the last Lucide icon before the marker.
icon_pattern = re.compile(
    r"<([A-Z][A-Za-z0-9]*)\s+className=(['\"])([^'\"]*?w-[^'\"]*?h-[^'\"]*?)\2\s*/>"
)

matches = list(icon_pattern.finditer(window))
if not matches:
    raise SystemExit("❌ Could not find an icon immediately before Today's Plan Locked.")

last = matches[-1]
old_icon_tag = last.group(0)
old_icon_name = last.group(1)

new_icon_tag = '<ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />'

absolute_start = window_start + last.start()
absolute_end = window_start + last.end()

text = text[:absolute_start] + new_icon_tag + text[absolute_end:]

path.write_text(text)

print(f"✅ Replaced {old_icon_name} icon with ShieldCheck.")
print("")
print("Inspect:")
print('rg -n "TODAY|Today|locked|Locked|ShieldCheck|Sparkles|Target|Zap" src/components/focus/YourMovesToday.jsx -C 8')
