from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path("src")
TARGET_ICON = "ClipboardCheck"

MARKERS = [
    "TODAY'S PLAN LOCKED",
    "TODAY’S PLAN LOCKED",
    "LOCKED FOR TODAY",
    "Locked for today",
    "These are the moves you chose",
    "Complete them to turn the day into momentum",
    "Add your own move",
    "PLAN STATE",
]

def read(path):
    return path.read_text(errors="ignore")

def add_lucide_import(text):
    lucide = re.search(
        r"import\s+\{(?P<icons>[^}]+)\}\s+from\s+['\"]lucide-react['\"];",
        text,
        flags=re.DOTALL,
    )

    if lucide:
        icons = [
            i.strip()
            for i in lucide.group("icons").replace("\n", " ").split(",")
            if i.strip()
        ]
        if TARGET_ICON not in icons:
            icons.append(TARGET_ICON)

        new_import = "import { " + ", ".join(sorted(set(icons))) + " } from 'lucide-react';"
        return text[:lucide.start()] + new_import + text[lucide.end():], True

    first_import = re.search(r"import .*?;\s*", text)
    insert_at = first_import.end() if first_import else 0
    return text[:insert_at] + f"\nimport {{ {TARGET_ICON} }} from 'lucide-react';\n" + text[insert_at:], True

candidates = []

for path in ROOT.rglob("*"):
    if path.suffix not in [".jsx", ".tsx", ".js", ".ts"]:
        continue

    text = read(path)
    score = 0

    for marker in MARKERS:
        if marker.lower() in text.lower():
            score += 10

    if "Sparkles" in text:
        score += 8

    if "Your 3 Moves" in text or "YOUR 3 MOVES" in text:
        score += 20

    if score >= 18:
        candidates.append((score, path, text))

if not candidates:
    print("❌ Could not find the component.")
    print("")
    print("Run this and paste the output:")
    print('rg -n "TODAY|LOCKED|Add your own move|PLAN STATE|Sparkles" src -S -C 10')
    sys.exit(1)

candidates.sort(reverse=True, key=lambda x: x[0])

for score, path, text in candidates[:8]:
    print(f"Candidate score {score}: {path}")

score, path, text = candidates[0]

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".bak-before-real-today-locked-icon-{stamp}")
backup.write_text(text)

print("")
print(f"✅ Editing best match: {path}")
print(f"✅ Backup created: {backup}")

text, _ = add_lucide_import(text)

# Find the most likely card area.
lower = text.lower()
marker_positions = []

for marker in MARKERS:
    pos = lower.find(marker.lower())
    if pos != -1:
        marker_positions.append(pos)

if marker_positions:
    anchor = min(marker_positions)
else:
    anchor = lower.find("sparkles")

window_start = max(0, anchor - 3500)
window_end = min(len(text), anchor + 3500)
window = text[window_start:window_end]

# Prefer replacing Sparkles specifically.
sparkles_match = re.search(r"<Sparkles\b[^>]*?/>", window, flags=re.DOTALL)

if sparkles_match:
    abs_start = window_start + sparkles_match.start()
    abs_end = window_start + sparkles_match.end()

    replacement = f'<{TARGET_ICON} className="w-5 h-5 text-slate-800 dark:text-zinc-100" />'
    text = text[:abs_start] + replacement + text[abs_end:]

    path.write_text(text)

    print("✅ Replaced visible Sparkles icon with ClipboardCheck.")
    print("")
    print("Inspect:")
    print(f'rg -n "TODAY|Today|LOCKED|Locked|Add your own move|Sparkles|ClipboardCheck" {path} -C 10')
    sys.exit(0)

# Fallback: replace config-based icon reference.
config_match = re.search(r"icon\s*:\s*Sparkles", window)

if config_match:
    abs_start = window_start + config_match.start()
    abs_end = window_start + config_match.end()

    text = text[:abs_start] + "icon: ClipboardCheck" + text[abs_end:]
    path.write_text(text)

    print("✅ Replaced config icon: Sparkles → ClipboardCheck.")
    print("")
    print("Inspect:")
    print(f'rg -n "TODAY|Today|LOCKED|Locked|Add your own move|Sparkles|ClipboardCheck|icon:" {path} -C 10')
    sys.exit(0)

print("❌ Found the likely component, but could not find <Sparkles /> near the card.")
print("")
print("Inspect manually:")
print(f'rg -n "TODAY|Today|LOCKED|Locked|Add your own move|Sparkles|ClipboardCheck|PLAN STATE|accepted" {path} -C 16')
