from pathlib import Path
from datetime import datetime

FILES = [
    Path("src/hooks/useHomeRealtime.js"),
    Path("src/pages/Home.jsx"),
]

HELPER = """function getProjectId(project) {
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

def has_get_project_id_declaration(text):
    return (
        "function getProjectId(" in text
        or "const getProjectId =" in text
        or "const getProjectId=" in text
    )

def insert_helper(path, text):
    anchors = [
        "function toHomeDateKey",
        "function wasProjectShippedTodayForHome",
        "function toMissions",
        "export default function Home",
        "function Home",
        "const Home",
        "export default function",
    ]

    for anchor in anchors:
        index = text.find(anchor)
        if index != -1:
            return text[:index] + HELPER + text[index:], anchor

    raise SystemExit(f"❌ Could not find a safe insertion point in {path}. No changes written.")

for path in FILES:
    if not path.exists():
        print(f"⚠️ Skipped missing file: {path}")
        continue

    text = path.read_text()

    backup = path.with_suffix(
        path.suffix + f".bak-before-restore-get-project-id-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(text)
    print(f"✅ Backup created: {backup}")

    if has_get_project_id_declaration(text):
        print(f"✅ {path}: getProjectId already exists. No changes written.")
        continue

    updated, anchor = insert_helper(path, text)
    path.write_text(updated)
    print(f"✅ {path}: inserted getProjectId before `{anchor}`")

print("")
print("Inspect with:")
print('rg -n "function getProjectId|getProjectId\\(" src/hooks/useHomeRealtime.js src/pages/Home.jsx -C 4')
