from pathlib import Path
import re
import shutil
import time

path = Path("src/components/project/pulse/card/ForesightCard.jsx")
TARGET_ICON = "Radar"

if not path.exists():
    raise SystemExit(f"❌ Could not find {path}")

text = path.read_text()

timestamp = time.strftime("%Y%m%d-%H%M%S")
backup = path.with_name(f"{path.name}.bak-before-foresight-radar-icon-{timestamp}")
shutil.copy2(path, backup)
print(f"✅ Backup created: {backup}")

# Add Radar to lucide-react import if missing.
if TARGET_ICON not in text:
    import_pattern = re.compile(
        r'import\s*\{(?P<body>.*?)\}\s*from\s*["\']lucide-react["\'];',
        re.DOTALL,
    )
    match = import_pattern.search(text)

    if not match:
        raise SystemExit("❌ Could not find lucide-react import block in ForesightCard.jsx")

    body = match.group("body")
    icons = [icon.strip() for icon in body.replace("\n", " ").split(",") if icon.strip()]

    if TARGET_ICON not in icons:
        icons.append(TARGET_ICON)

    # Keep imports clean and stable.
    new_import = "import {\n  " + ",\n  ".join(sorted(set(icons))) + '\n} from "lucide-react";'
    text = text[:match.start()] + new_import + text[match.end():]
    print(f"✅ Added {TARGET_ICON} import.")

# Find the visible Foresight label.
label_match = re.search(r'>\s*Foresight\s*<|["\']Foresight["\']', text)

if not label_match:
    raise SystemExit(
        "❌ Could not find the visible Foresight label.\n"
        "Run this and paste the output:\n"
        "rg -n \"Foresight|Sparkles|Gauge|Radar|Activity|Brain|Target\" src/components/project/pulse/card/ForesightCard.jsx -C 16"
    )

label_index = label_match.start()

# Search just before the Foresight label for the icon component.
window_start = max(0, label_index - 1600)
window = text[window_start:label_index]

icon_pattern = re.compile(
    r'<(?P<name>[A-Z][A-Za-z0-9]*)(?P<attrs>[^<>]*className=(?:"[^"]*"|\'[^\']*\'|\{[^}]*\})[^<>]*)\/?>',
    re.DOTALL,
)

matches = list(icon_pattern.finditer(window))

if not matches:
    raise SystemExit(
        "❌ Could not find an icon component before the Foresight label.\n"
        "Run this and paste the output:\n"
        "rg -n \"Foresight|Sparkles|Gauge|Radar|Activity|Brain|Target\" src/components/project/pulse/card/ForesightCard.jsx -C 16"
    )

last = matches[-1]
old_name = last.group("name")
old_tag = last.group(0)

if old_name == TARGET_ICON:
    print("✅ Foresight already uses Radar. No JSX replacement needed.")
else:
    new_tag = old_tag.replace(f"<{old_name}", f"<{TARGET_ICON}", 1)

    absolute_start = window_start + last.start()
    absolute_end = window_start + last.end()

    text = text[:absolute_start] + new_tag + text[absolute_end:]

    print(f"✅ Replaced Foresight icon: {old_name} → {TARGET_ICON}")
    print("")
    print("Old tag:")
    print(old_tag)
    print("")
    print("New tag:")
    print(new_tag)

path.write_text(text)

print("")
print("Inspect:")
print('rg -n "Foresight|Radar|Sparkles|Gauge|Activity|Brain|Target" src/components/project/pulse/card/ForesightCard.jsx -C 12')
