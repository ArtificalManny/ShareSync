from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/focus/YourMovesToday.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/focus/YourMovesToday.jsx. No changes made.")

text = path.read_text()
original = text

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"src/components/focus/YourMovesToday.jsx.bak-before-icon-polish-{stamp}")
backup.write_text(original)

print(f"✅ Backup created: {backup}")

# ─────────────────────────────────────────────────────────────────────────────
# 1) Safely add Compass + ListChecks to lucide-react import.
# ─────────────────────────────────────────────────────────────────────────────

import_pattern = re.compile(
    r"import\s*\{(?P<body>[\s\S]*?)\}\s*from\s*'lucide-react';",
    re.MULTILINE,
)

match = import_pattern.search(text)

if not match:
    raise SystemExit("❌ Could not find lucide-react import block. No changes written.")

import_body = match.group("body")

def has_icon(body, icon):
    return re.search(rf"\b{re.escape(icon)}\b", body) is not None

missing_icons = []
for icon in ["Compass", "ListChecks"]:
    if not has_icon(import_body, icon):
        missing_icons.append(icon)

if missing_icons:
    if not has_icon(import_body, "Target"):
        raise SystemExit("❌ Could not find Target import to insert new icons near it. No changes written.")

    replacement = "Target, " + ", ".join(missing_icons)
    new_import_body = re.sub(r"\bTarget\b", replacement, import_body, count=1)

    text = (
        text[:match.start("body")]
        + new_import_body
        + text[match.end("body"):]
    )

# ─────────────────────────────────────────────────────────────────────────────
# 2) Replace the main header icon for "Your 3 Moves Today".
#    This keeps AlertCircle for urgent state and only changes the normal state.
# ─────────────────────────────────────────────────────────────────────────────

title_token = "Your 3 Moves Today"
title_index = text.find(title_token)

if title_index == -1:
    raise SystemExit("❌ Could not find `Your 3 Moves Today` heading. No changes written.")

header_start = text.rfind("{showHeader", 0, title_index)

if header_start == -1:
    raise SystemExit("❌ Could not find showHeader block before heading. No changes written.")

header_slice = text[header_start:title_index]
header_targets = list(re.finditer(r"<Target\b", header_slice))

if len(header_targets) != 1:
    print("Header slice preview:")
    print(header_slice[-900:])
    raise SystemExit(
        f"❌ Expected exactly 1 Target icon in Your 3 Moves Today header, found {len(header_targets)}. No changes written."
    )

header_target_global = header_start + header_targets[0].start()
text = text[:header_target_global] + "<Compass" + text[header_target_global + len("<Target"):]

# ─────────────────────────────────────────────────────────────────────────────
# 3) Replace the "Moves" metric icon inside DailyFocusIntroPanel.
#    This should be the small stat card that says MOVES / 3.
# ─────────────────────────────────────────────────────────────────────────────

panel_token = "function DailyFocusIntroPanel"
panel_index = text.find(panel_token)

if panel_index == -1:
    raise SystemExit("❌ Could not find DailyFocusIntroPanel. No changes written.")

panel_text = text[panel_index:]

moves_label_match = re.search(r">\s*Moves\s*</p>", panel_text, re.IGNORECASE)

if not moves_label_match:
    print("DailyFocusIntroPanel preview:")
    print(panel_text[:1800])
    raise SystemExit("❌ Could not find the Moves metric label. No changes written.")

moves_label_global = panel_index + moves_label_match.start()

moves_stat_window = text[moves_label_global:moves_label_global + 900]
moves_stat_target = re.search(r"<Target\b", moves_stat_window)

if not moves_stat_target:
    print("Moves stat window preview:")
    print(moves_stat_window)
    raise SystemExit("❌ Could not find Target icon inside the Moves stat card. No changes written.")

moves_target_global = moves_label_global + moves_stat_target.start()
text = text[:moves_target_global] + "<ListChecks" + text[moves_target_global + len("<Target"):]

# ─────────────────────────────────────────────────────────────────────────────
# 4) Safety checks.
# ─────────────────────────────────────────────────────────────────────────────

required = [
    "Compass",
    "ListChecks",
    "<Compass className",
    "<ListChecks className",
    "Your 3 Moves Today",
    "function DailyFocusIntroPanel",
]

for item in required:
    if item not in text:
        raise SystemExit(f"❌ Safety check failed: missing `{item}`. No changes written.")

if text.count("export default function YourMovesToday") != 1:
    raise SystemExit("❌ Safety check failed: YourMovesToday export count changed. No changes written.")

if text.count("export function YourMovesWidget") != 1:
    raise SystemExit("❌ Safety check failed: YourMovesWidget export count changed. No changes written.")

if text.count("export function FocusBanner") != 1:
    raise SystemExit("❌ Safety check failed: FocusBanner export count changed. No changes written.")

path.write_text(text)

print("✅ YourMovesToday.jsx icon polish complete.")
print("✅ Header icon changed from Target → Compass.")
print("✅ Moves metric icon changed from Target → ListChecks.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print('rg -n "Compass|ListChecks|Your 3 Moves Today|Moves" src/components/focus/YourMovesToday.jsx -C 4')
