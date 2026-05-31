from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path("src")
TARGET_ICON = "ClipboardCheck"

MARKERS = [
    r"TODAY[’']S\s+PLAN\s+LOCKED",
    r"TODAY.?S\s+PLAN\s+LOCKED",
    r"LOCKED\s+FOR\s+TODAY",
    r"These are the moves you chose for today",
    r"Complete them to turn the day into momentum",
]

KNOWN_ICON_NAMES = [
    "Sparkles",
    "Sparkle",
    "Target",
    "Crosshair",
    "Zap",
    "Compass",
    "BadgeCheck",
    "CheckCircle",
    "CheckCircle2",
    "CircleCheck",
    "Lock",
    "LockKeyhole",
    "Shield",
    "ShieldCheck",
    "ClipboardCheck",
    "ListChecks",
]

def read_text(path):
    try:
        return path.read_text()
    except UnicodeDecodeError:
        return path.read_text(errors="ignore")

def line_number(text, index):
    return text[:index].count("\n") + 1

candidates = []

for path in ROOT.rglob("*"):
    if path.suffix not in {".jsx", ".tsx", ".js", ".ts"}:
        continue

    text = read_text(path)

    for marker in MARKERS:
        match = re.search(marker, text, flags=re.IGNORECASE)
        if match:
            candidates.append((path, match.start(), marker))
            break

if not candidates:
    print("❌ Could not find the Today's Plan Locked component.")
    print("")
    print("Run this and paste the output:")
    print('rg -n "TODAY|Today|LOCKED|Locked|moves you chose|turn the day into momentum" src -S -C 8')
    sys.exit(1)

# Prefer files with the exact visual sentence from the screenshot.
candidates.sort(
    key=lambda item: (
        0 if "moves you chose" in read_text(item[0]).lower() else 1,
        str(item[0]),
    )
)

path, marker_index, marker = candidates[0]
text = read_text(path)

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".bak-before-today-plan-icon-{stamp}")
backup.write_text(text)

print(f"✅ Found target file: {path}")
print(f"✅ Matched marker near line {line_number(text, marker_index)}")
print(f"✅ Backup created: {backup}")

# Add ClipboardCheck to lucide-react import.
lucide_import = re.search(
    r"import\s+\{(?P<icons>[^}]+)\}\s+from\s+['\"]lucide-react['\"];",
    text,
    flags=re.DOTALL,
)

if lucide_import:
    raw_icons = lucide_import.group("icons")
    icons = [icon.strip() for icon in raw_icons.replace("\n", " ").split(",") if icon.strip()]

    if TARGET_ICON not in icons:
        icons.append(TARGET_ICON)

    icons = sorted(set(icons))
    new_import = "import { " + ", ".join(icons) + " } from 'lucide-react';"
    text = text[:lucide_import.start()] + new_import + text[lucide_import.end():]
    shift = len(new_import) - (lucide_import.end() - lucide_import.start())
    marker_index += shift
    print(f"✅ Added/imported {TARGET_ICON} from lucide-react.")
else:
    react_import = re.search(r"import\s+React[^;]*;\s*", text)
    insert_at = react_import.end() if react_import else 0
    new_import = f"\nimport {{ {TARGET_ICON} }} from 'lucide-react';\n"
    text = text[:insert_at] + new_import + text[insert_at:]
    marker_index += len(new_import)
    print(f"✅ Created lucide-react import for {TARGET_ICON}.")

# Search shortly before the marker for the icon inside the same card/header area.
window_start = max(0, marker_index - 2500)
window = text[window_start:marker_index]

icon_regex = re.compile(
    r"<(?P<name>" + "|".join(KNOWN_ICON_NAMES) + r")\b[^>]*?/>",
    flags=re.DOTALL,
)

matches = list(icon_regex.finditer(window))

if not matches:
    print("❌ Found the text, but could not locate the icon before it.")
    print("")
    print("Inspect this area:")
    print(f"sed -n '{max(1, line_number(text, marker_index)-35)},{line_number(text, marker_index)+20}p' {path}")
    sys.exit(1)

last = matches[-1]
old_icon_name = last.group("name")
absolute_start = window_start + last.start()
absolute_end = window_start + last.end()

new_icon_tag = f'<{TARGET_ICON} className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />'

text = text[:absolute_start] + new_icon_tag + text[absolute_end:]
path.write_text(text)

print(f"✅ Replaced {old_icon_name} with {TARGET_ICON}.")
print("")
print("Inspect:")
print(f'rg -n "TODAY|Today|LOCKED|Locked|moves you chose|{TARGET_ICON}|{old_icon_name}" {path} -C 8')
