from pathlib import Path
from datetime import datetime
import re

path = Path("src/hooks/useHomeRealtime.js")
text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-restore-get-project-id-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

helper = """function getProjectId(project) {
  const raw =
    project?._id ||
    project?.id ||
    project?.projectId ||
    project?.project?._id ||
    project?.project?.id ||
    project?.project?.projectId ||
    "";

  return raw ? String(raw) : "";
}

"""

has_helper = (
    re.search(r"\\bfunction\\s+getProjectId\\s*\\(", text) or
    re.search(r"\\bconst\\s+getProjectId\\s*=", text)
)

if has_helper:
    print("✅ getProjectId already exists. No changes written.")
else:
    anchors = [
        "function toHomeDateKey",
        "function wasProjectShippedTodayForHome",
        "/**\n * Convert projects -> Home \"missions\" shape",
        "function toMissions",
    ]

    inserted = False

    for anchor in anchors:
        index = text.find(anchor)
        if index != -1:
            text = text[:index] + helper + text[index:]
            inserted = True
            print(f"✅ Inserted getProjectId before: {anchor}")
            break

    if not inserted:
        raise SystemExit("❌ Could not find a safe insertion point. No changes written.")

    path.write_text(text)

print("")
print("Inspect with:")
print("rg -n \"function getProjectId|getProjectId\\(\" src/hooks/useHomeRealtime.js -C 4")
