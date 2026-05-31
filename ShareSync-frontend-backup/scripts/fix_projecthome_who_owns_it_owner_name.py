from pathlib import Path

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

helper = r'''
function isLikelyMongoId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value.trim());
}

function getCleanUserName(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || isLikelyMongoId(trimmed)) return "";
    return trimmed;
  }

  if (typeof value !== "object" || Array.isArray(value)) return "";

  const fullName = [value.firstName, value.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    value.displayName ||
    value.name ||
    value.username ||
    value.email ||
    ""
  );
}

function getProjectOwnerDisplayName(project, summary) {
  const ownerSummary = summary?.ownerSummary || {};

  const candidates = [
    project?.ownerId,
    project?.createdById,
    project?.ownerUser,
    project?.createdByUser,
    project?.owner,
    project?.createdBy,
    ownerSummary?.primaryOwner,
    ownerSummary?.owner,
    ownerSummary?.user,
    ownerSummary?.primaryOwnerName,
  ];

  for (const candidate of candidates) {
    const name = getCleanUserName(candidate);
    if (name) return name;
  }

  return "Owner not set";
}
'''

if "function getProjectOwnerDisplayName" not in text:
    marker = "function getProjectMemberIds(project) {"
    if marker not in text:
        raise SystemExit("❌ Could not find insertion point near getProjectMemberIds.")
    text = text.replace(marker, helper + "\n" + marker, 1)
    print("✅ Added owner display helpers.")
else:
    print("ℹ️ Owner display helper already exists.")

old = '''  const ownerName =
    summary?.ownerSummary?.primaryOwnerName ||
    "Owner not set";'''

new = '''  const ownerName = getProjectOwnerDisplayName(
    (typeof project !== "undefined" && project) ||
      (typeof activeProject !== "undefined" && activeProject) ||
      (typeof currentProject !== "undefined" && currentProject) ||
      overview?.project ||
      overview?.rawProject ||
      null,
    summary
  );'''

if old not in text:
    raise SystemExit("""❌ Could not find the old ownerName block.

Run this and paste the output:
rg -n "const ownerName|primaryOwnerName|label=\\"Who owns it\\"|value=\\{ownerName\\}" src/pages/ProjectHome.jsx -C 12
""")

text = text.replace(old, new, 1)

path.write_text(text)

print("✅ Fixed ProjectHome ownerName source.")
print("✅ The overview card now prefers populated owner objects and ignores raw Mongo IDs.")
print("")
print("Inspect:")
print('rg -n "getProjectOwnerDisplayName|const ownerName|primaryOwnerName|label=\\"Who owns it\\"|value=\\{ownerName\\}" src/pages/ProjectHome.jsx -C 10')
