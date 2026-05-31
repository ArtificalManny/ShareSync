from pathlib import Path
import shutil
import time
import re

path = Path("src/components/focus/YourMovesToday.jsx")

if not path.exists():
    raise SystemExit(f"❌ Could not find {path}")

text = path.read_text()

timestamp = time.strftime("%Y%m%d-%H%M%S")
backup = path.with_name(f"{path.name}.bak-before-professional-daily-plan-icons-{timestamp}")
shutil.copy2(path, backup)
print(f"✅ Backup created: {backup}")

# Ensure imports exist.
import_match = re.search(
    r'import\s*\{(?P<body>.*?)\}\s*from\s*["\']lucide-react["\'];',
    text,
    re.DOTALL,
)

if not import_match:
    raise SystemExit("❌ Could not find lucide-react import block.")

body = import_match.group("body")
icons = [x.strip() for x in body.replace("\n", " ").split(",") if x.strip()]

for icon in ["Target", "ClipboardCheck"]:
    if icon not in icons:
        icons.append(icon)
        print(f"✅ Added {icon} import.")

new_import = "import {\n  " + ",\n  ".join(sorted(set(icons))) + '\n} from "lucide-react";'
text = text[:import_match.start()] + new_import + text[import_match.end():]

# Replace the conditional icon logic if it exists.
patterns = [
    (
        r'\{\s*hasAcceptedDailyPlan\s*\?\s*<ClipboardCheck([^>]*)/>\s*:\s*<Sparkles([^>]*)/>\s*\}',
        r'{hasAcceptedDailyPlan ? <ClipboardCheck\1/> : <Target\2/>}',
    ),
    (
        r'\{\s*hasAcceptedDailyPlan\s*\?\s*<ListChecks([^>]*)/>\s*:\s*<Sparkles([^>]*)/>\s*\}',
        r'{hasAcceptedDailyPlan ? <ClipboardCheck\1/> : <Target\2/>}',
    ),
    (
        r'\{\s*hasAcceptedDailyPlan\s*\?\s*<ClipboardCheck([^>]*)/>\s*:\s*<WandSparkles([^>]*)/>\s*\}',
        r'{hasAcceptedDailyPlan ? <ClipboardCheck\1/> : <Target\2/>}',
    ),
]

changed = 0

for pattern, replacement in patterns:
    text, count = re.subn(pattern, replacement, text, count=1, flags=re.DOTALL)
    changed += count

if changed == 0:
    # Fallback: replace the first Sparkles icon near the recommended label only.
    label_match = re.search(
        r"RECOMMENDED FROM YOUR ACTIVE PROJECTS|TODAY'S PLAN LOCKED|TODAY’S PLAN LOCKED",
        text,
    )

    if not label_match:
        raise SystemExit(
            "❌ Could not find the daily plan header labels.\n"
            "Run:\n"
            "rg -n \"RECOMMENDED|TODAY|Sparkles|ClipboardCheck|Target|hasAcceptedDailyPlan\" src/components/focus/YourMovesToday.jsx -C 12"
        )

    search_start = max(0, label_match.start() - 1200)
    search_end = min(len(text), label_match.end() + 1200)
    window = text[search_start:search_end]

    sparkles_match = re.search(r"<Sparkles(?P<attrs>[^>]*)/>", window, re.DOTALL)

    if not sparkles_match:
        raise SystemExit(
            "❌ Could not find <Sparkles /> near the daily plan card.\n"
            "Run:\n"
            "rg -n \"RECOMMENDED|TODAY|Sparkles|ClipboardCheck|Target|hasAcceptedDailyPlan\" src/components/focus/YourMovesToday.jsx -C 16"
        )

    absolute_start = search_start + sparkles_match.start()
    absolute_end = search_start + sparkles_match.end()
    new_tag = "<Target" + sparkles_match.group("attrs") + "/>"

    text = text[:absolute_start] + new_tag + text[absolute_end:]
    changed = 1
    print("✅ Fallback replaced nearby Sparkles icon with Target.")

path.write_text(text)

print("")
print(f"✅ Daily plan icon polish complete. Replacements: {changed}")
print("")
print("Inspect:")
print('rg -n "RECOMMENDED|TODAY|Sparkles|ClipboardCheck|Target|hasAcceptedDailyPlan" src/components/focus/YourMovesToday.jsx -C 12')
