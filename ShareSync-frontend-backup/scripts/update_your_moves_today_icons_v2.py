from pathlib import Path
from datetime import datetime
import re

path = Path("src/components/focus/YourMovesToday.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/focus/YourMovesToday.jsx. No changes made.")

text = path.read_text()
original = text

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"src/components/focus/YourMovesToday.jsx.bak-before-icon-polish-v2-{stamp}")
backup.write_text(original)

print(f"✅ Backup created: {backup}")

# ─────────────────────────────────────────────────────────────────────────────
# 1) Add Compass + ListChecks to lucide-react imports.
# ─────────────────────────────────────────────────────────────────────────────

import_match = re.search(
    r"import\s*\{(?P<body>[\s\S]*?)\}\s*from\s*'lucide-react';",
    text,
)

if not import_match:
    raise SystemExit("❌ Could not find lucide-react import block. No changes written.")

import_body = import_match.group("body")

icons_to_add = []

if not re.search(r"\bCompass\b", import_body):
    icons_to_add.append("Compass")

if not re.search(r"\bListChecks\b", import_body):
    icons_to_add.append("ListChecks")

if icons_to_add:
    if not re.search(r"\bTarget\b", import_body):
        raise SystemExit("❌ Could not find Target import to insert Compass/ListChecks beside it. No changes written.")

    updated_import_body = re.sub(
        r"\bTarget\b",
        "Target, " + ", ".join(icons_to_add),
        import_body,
        count=1,
    )

    text = (
        text[:import_match.start("body")]
        + updated_import_body
        + text[import_match.end("body"):]
    )

# ─────────────────────────────────────────────────────────────────────────────
# 2) Change the main "Your 3 Moves Today" normal-state icon:
#    Target → Compass.
#    Keep AlertCircle for urgent state.
# ─────────────────────────────────────────────────────────────────────────────

old_header_icon = """              ) : (
                <Target className="w-5 h-5 text-[var(--theme-accent-primary)]" />
              )}"""

new_header_icon = """              ) : (
                <Compass className="w-5 h-5 text-[var(--theme-accent-primary)]" />
              )}"""

if old_header_icon not in text:
    raise SystemExit("❌ Could not find the exact Your 3 Moves Today header Target icon block. No changes written.")

text = text.replace(old_header_icon, new_header_icon, 1)

# ─────────────────────────────────────────────────────────────────────────────
# 3) Change the "Moves" stat card icon:
#    Target → ListChecks.
# ─────────────────────────────────────────────────────────────────────────────

old_moves_icon = """                <Target className="h-4 w-4 text-[var(--theme-accent-primary)]" />
                {totalMoves}"""

new_moves_icon = """                <ListChecks className="h-4 w-4 text-[var(--theme-accent-primary)]" />
                {totalMoves}"""

if old_moves_icon not in text:
    raise SystemExit("❌ Could not find the exact Moves stat Target icon block. No changes written.")

text = text.replace(old_moves_icon, new_moves_icon, 1)

# ─────────────────────────────────────────────────────────────────────────────
# 4) Safety checks.
# ─────────────────────────────────────────────────────────────────────────────

required = [
    "Compass",
    "ListChecks",
    "<Compass className=\"w-5 h-5 text-[var(--theme-accent-primary)]\" />",
    "<ListChecks className=\"h-4 w-4 text-[var(--theme-accent-primary)]\" />",
    "Your 3 Moves Today",
    "function DailyFocusIntroPanel",
    "export default function YourMovesToday",
    "export function YourMovesWidget",
    "export function FocusBanner",
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
print("✅ FocusBanner Target icon preserved.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print('rg -n "Compass|ListChecks|Your 3 Moves Today|Moves|<Target" src/components/focus/YourMovesToday.jsx -C 4')
