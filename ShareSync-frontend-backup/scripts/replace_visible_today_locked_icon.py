from pathlib import Path
import re
import time

path = Path("src/components/focus/YourMovesToday.jsx")

if not path.exists():
    raise SystemExit(f"❌ File not found: {path}")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-visible-today-locked-icon-{time.strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# Make sure ListChecks is imported.
import_pattern = re.compile(r"import\s*\{([^}]+)\}\s*from\s*['\"]lucide-react['\"];?", re.DOTALL)
match = import_pattern.search(text)

if not match:
    raise SystemExit("❌ Could not find lucide-react import.")

imports_raw = match.group(1)
imports = [item.strip() for item in imports_raw.replace("\n", " ").split(",") if item.strip()]

if "ListChecks" not in imports:
    imports.append("ListChecks")
    imports = sorted(set(imports))
    new_import = "import { " + ", ".join(imports) + " } from 'lucide-react';"
    text = text[:match.start()] + new_import + text[match.end():]
    print("✅ Added ListChecks import.")
else:
    print("✅ ListChecks already imported.")

# Re-read target index after possible import edit.
label_candidates = [
    "TODAY'S PLAN LOCKED",
    "TODAY’S PLAN LOCKED",
    "Today’s Plan Locked",
    "Today's Plan Locked",
    "LOCKED FOR TODAY",
    "These are the moves you chose",
]

lower = text.lower()
label_index = -1
label_used = None

for label in label_candidates:
    idx = lower.find(label.lower())
    if idx != -1:
        label_index = idx
        label_used = label
        break

if label_index == -1:
    raise SystemExit(
        "❌ Could not find the locked-plan label. Run:\n"
        "rg -n \"TODAY|LOCKED|moves you chose|Sparkles|ClipboardCheck|ListChecks\" "
        "src/components/focus/YourMovesToday.jsx -C 20"
    )

# Only search BEFORE the label so we don't accidentally replace the check icon in the badge.
window_start = max(0, label_index - 2500)
window = text[window_start:label_index]

icon_pattern = re.compile(
    r"<(?P<name>Sparkles|ClipboardCheck|Target|Zap|Compass|CheckCircle2|ShieldCheck|ListChecks)\b(?P<attrs>[^>]*)/>",
    re.DOTALL,
)

matches = list(icon_pattern.finditer(window))

if not matches:
    raise SystemExit(
        f"❌ Found '{label_used}', but no nearby icon before it. Inspect manually:\n"
        "rg -n \"TODAY|LOCKED|moves you chose|Sparkles|ClipboardCheck|ListChecks|Target|Zap\" "
        "src/components/focus/YourMovesToday.jsx -C 30"
    )

target = matches[-1]
old_name = target.group("name")
old_attrs = target.group("attrs")

new_tag = f"<ListChecks{old_attrs}/>"
absolute_start = window_start + target.start()
absolute_end = window_start + target.end()

text = text[:absolute_start] + new_tag + text[absolute_end:]

path.write_text(text)

print("")
print(f"✅ Replaced visible locked-plan icon: {old_name} → ListChecks")
print(f"✅ Matched label: {label_used}")
print("")
print("Inspect:")
print("rg -n \"TODAY|LOCKED|moves you chose|Sparkles|ClipboardCheck|ListChecks\" src/components/focus/YourMovesToday.jsx -C 24")
