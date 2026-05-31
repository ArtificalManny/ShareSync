from pathlib import Path
from datetime import datetime
import re
import sys

TARGET_ICON = "ListChecks"

ROOT = Path("src")

LABEL_PATTERNS = [
    "TODAY'S PLAN LOCKED",
    "TODAY’S PLAN LOCKED",
    "Today's Plan Locked",
    "Today’s Plan Locked",
]

def is_source_file(path):
    if path.suffix not in [".jsx", ".tsx", ".js", ".ts"]:
        return False

    name = path.name.lower()
    full = str(path).lower()

    if ".bak" in name or ".backup" in name:
        return False

    if "/node_modules/" in full:
        return False

    return True

def add_lucide_import(text):
    lucide_import = re.search(
        r"import\s+\{(?P<icons>[^}]+)\}\s+from\s+['\"]lucide-react['\"];",
        text,
        flags=re.DOTALL,
    )

    if not lucide_import:
        first_import = re.search(r"import .*?;\s*", text)
        insert_at = first_import.end() if first_import else 0
        return text[:insert_at] + f"\nimport {{ {TARGET_ICON} }} from 'lucide-react';\n" + text[insert_at:]

    icons_raw = lucide_import.group("icons")
    icons = [i.strip() for i in icons_raw.replace("\n", " ").split(",") if i.strip()]

    if TARGET_ICON not in icons:
        icons.append(TARGET_ICON)

    new_import = "import { " + ", ".join(sorted(set(icons))) + " } from 'lucide-react';"

    return text[:lucide_import.start()] + new_import + text[lucide_import.end():]

matches = []

for path in ROOT.rglob("*"):
    if not is_source_file(path):
        continue

    text = path.read_text(errors="ignore")

    for label in LABEL_PATTERNS:
        idx = text.find(label)
        if idx != -1:
            matches.append((path, text, idx, label))
            break

if not matches:
    print("❌ Could not find the live Today's Plan Locked text in non-backup src files.")
    print("")
    print("Run this and paste the output:")
    print("""rg -n "TODAY|Today|PLAN LOCKED|Plan Locked|LOCKED FOR TODAY|These are the moves you chose" src --glob '!**/*.bak*' -C 20""")
    sys.exit(1)

path, text, idx, label = matches[0]

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".bak-before-force-today-plan-icon-{stamp}")
backup.write_text(text)

print(f"✅ Found live label in: {path}")
print(f"✅ Label matched: {label}")
print(f"✅ Backup created: {backup}")

text = add_lucide_import(text)

# Recalculate because import may shift indexes.
idx = text.find(label)

# The visible left icon should be shortly BEFORE the label.
window_start = max(0, idx - 1800)
window_end = idx
window = text[window_start:window_end]

# Grab the last self-closing uppercase JSX tag before the label.
# This catches <Sparkles ... />, <WandSparkles ... />, <Icon ... />, etc.
icon_matches = list(re.finditer(
    r"<(?P<name>[A-Z][A-Za-z0-9_]*)\b(?P<attrs>[^<>]*?)\/>",
    window,
    flags=re.DOTALL,
))

if not icon_matches:
    print("❌ Found the label, but could not find a self-closing icon before it.")
    print("")
    print("Inspect manually:")
    print(f"""rg -n "{label}|Sparkles|WandSparkles|ClipboardCheck|ListChecks|Target|Zap" {path} -C 24""")
    sys.exit(1)

old = icon_matches[-1]
old_tag = old.group(0)
old_name = old.group("name")

abs_start = window_start + old.start()
abs_end = window_start + old.end()

new_tag = f'<{TARGET_ICON} className="w-5 h-5 text-slate-800 dark:text-zinc-100" />'

text = text[:abs_start] + new_tag + text[abs_end:]
path.write_text(text)

print("")
print(f"✅ Replaced nearest icon before '{label}': {old_name} → {TARGET_ICON}")
print("")
print("Old tag:")
print(old_tag)
print("")
print("New tag:")
print(new_tag)
print("")
print("Inspect:")
print(f"""rg -n "{label}|ListChecks|Sparkles|WandSparkles|ClipboardCheck|Target|Zap" {path} -C 18""")
