from pathlib import Path
import re
from datetime import datetime

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/pages/ProjectHome.jsx")

text = path.read_text()

backup = path.with_suffix(
    f".jsx.bak-before-who-owns-it-name-fix-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

helper = r'''
function isPopulatedUser(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function getUserFullName(user) {
  if (!isPopulatedUser(user)) return "";

  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    user.displayName ||
    user.name ||
    user.username ||
    user.email ||
    ""
  );
}

function getProjectOwnerDisplayName(project) {
  if (!project) return "Project Owner";

  // IMPORTANT:
  // Prefer populated owner objects first.
  // Raw project.owner / project.createdBy may only be Mongo string IDs.
  const candidates = [
    project.ownerId,
    project.createdById,
    project.ownerUser,
    project.createdByUser,
    project.owner,
    project.createdBy,
  ];

  for (const candidate of candidates) {
    const name = getUserFullName(candidate);
    if (name) return name;
  }

  return "Project Owner";
}
'''

if "function getProjectOwnerDisplayName" not in text:
    imports = list(re.finditer(r"^import .+?;\s*$", text, flags=re.MULTILINE))
    if not imports:
        raise SystemExit("❌ Could not find imports in ProjectHome.jsx")
    insert_at = imports[-1].end()
    text = text[:insert_at] + "\n" + helper + text[insert_at:]
    print("✅ Added owner display helper.")

label_index = text.find("WHO OWNS IT")
if label_index == -1:
    raise SystemExit(
        "❌ Could not find WHO OWNS IT in ProjectHome.jsx.\n"
        "Run:\n"
        "rg -n \"WHO OWNS IT|ownerId|createdById|createdBy|owner\" src/pages/ProjectHome.jsx -C 20"
    )

window_start = label_index
window_end = min(len(text), label_index + 1800)
window = text[window_start:window_end]

patterns = [
    # activeProject versions
    (r"\{activeProject\?\.owner\s*\|\|\s*activeProject\?\.ownerId\s*\|\|\s*activeProject\?\.createdBy\s*\}", "{getProjectOwnerDisplayName(activeProject)}"),
    (r"\{activeProject\?\.owner\s*\|\|\s*activeProject\?\.createdBy\s*\|\|\s*activeProject\?\.ownerId\s*\}", "{getProjectOwnerDisplayName(activeProject)}"),
    (r"\{activeProject\.owner\s*\|\|\s*activeProject\.ownerId\s*\|\|\s*activeProject\.createdBy\s*\}", "{getProjectOwnerDisplayName(activeProject)}"),

    # project versions
    (r"\{project\?\.owner\s*\|\|\s*project\?\.ownerId\s*\|\|\s*project\?\.createdBy\s*\}", "{getProjectOwnerDisplayName(project)}"),
    (r"\{project\?\.owner\s*\|\|\s*project\?\.createdBy\s*\|\|\s*project\?\.ownerId\s*\}", "{getProjectOwnerDisplayName(project)}"),
    (r"\{project\.owner\s*\|\|\s*project\.ownerId\s*\|\|\s*project\.createdBy\s*\}", "{getProjectOwnerDisplayName(project)}"),
]

changed = False

for pattern, replacement in patterns:
    match = re.search(pattern, window)
    if match:
        absolute_start = window_start + match.start()
        absolute_end = window_start + match.end()
        text = text[:absolute_start] + replacement + text[absolute_end:]
        changed = True
        print(f"✅ Replaced raw owner expression with: {replacement}")
        break

if not changed:
    # Fallback: replace first JSX expression near WHO OWNS IT that directly references owner/createdBy.
    fallback = re.search(
        r"\{[^{}\n]*(?:ownerId|createdById|owner|createdBy)[^{}\n]*\}",
        window,
    )

    if fallback:
        old_expr = fallback.group(0)

        if "activeProject" in old_expr:
            replacement = "{getProjectOwnerDisplayName(activeProject)}"
        else:
            replacement = "{getProjectOwnerDisplayName(project)}"

        absolute_start = window_start + fallback.start()
        absolute_end = window_start + fallback.end()
        text = text[:absolute_start] + replacement + text[absolute_end:]
        changed = True

        print("✅ Fallback replaced owner expression.")
        print("Old:", old_expr)
        print("New:", replacement)

if not changed:
    path.write_text(text)
    raise SystemExit(
        "⚠️ Helper was added, but the visible WHO OWNS IT expression was not replaced.\n"
        "Paste this output next:\n"
        "rg -n \"WHO OWNS IT|ownerId|createdById|createdBy|owner\" src/pages/ProjectHome.jsx -C 25"
    )

path.write_text(text)

print("")
print("✅ ProjectHome WHO OWNS IT display fixed.")
print("✅ Backup created:", backup)
print("")
print("Inspect:")
print('rg -n "WHO OWNS IT|getProjectOwnerDisplayName|ownerId|createdById|createdBy|owner" src/pages/ProjectHome.jsx -C 10')
