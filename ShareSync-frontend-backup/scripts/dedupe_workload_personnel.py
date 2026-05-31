from pathlib import Path
import re

path = Path("src/api/workloadIntelligence.js")

if not path.exists():
    raise SystemExit("❌ src/api/workloadIntelligence.js not found.")

text = path.read_text()

backup = path.with_suffix(".js.bak-before-dedupe-workload-personnel")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

helper = r'''
function normalizeWorkloadPersonNameKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getWorkloadPersonDedupeKey(person) {
  if (!person || typeof person !== "object") return "";

  const id =
    person.userId ||
    person.id ||
    person._id ||
    person.user?._id ||
    person.user?.id ||
    "";

  const normalizedId = String(id || "").trim();

  if (normalizedId && !normalizedId.startsWith("name:")) {
    return `id:${normalizedId}`;
  }

  const nameKey = normalizeWorkloadPersonNameKey(person.name);
  const emailKey = normalizeWorkloadPersonNameKey(person.email);

  if (emailKey) return `email:${emailKey}`;
  if (nameKey) return `name:${nameKey}`;

  return "";
}

function mergeWorkloadPeople(a = {}, b = {}) {
  const shipsCompleted =
    Number(a.shipsCompleted || 0) + Number(b.shipsCompleted || 0);

  const projectCount =
    Number(a.projectCount || 0) + Number(b.projectCount || 0);

  return {
    ...a,
    ...b,
    id: a.id || b.id,
    userId: a.userId || b.userId || a.id || b.id,
    name: a.name || b.name || "Unknown teammate",
    email: a.email || b.email || "",
    avatarUrl: a.avatarUrl || b.avatarUrl || "",
    isCurrentUser: Boolean(a.isCurrentUser || b.isCurrentUser),
    shipsCompleted,
    projectCount,
    loadPercent: 0,
  };
}

function dedupeWorkloadPersonnel(personnel = []) {
  const map = new Map();

  for (const person of Array.isArray(personnel) ? personnel : []) {
    const key = getWorkloadPersonDedupeKey(person);
    if (!key) continue;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, person);
      continue;
    }

    map.set(key, mergeWorkloadPeople(existing, person));
  }

  return Array.from(map.values());
}
'''

if "function dedupeWorkloadPersonnel(" not in text:
    # Insert before buildWorkloadFromProjects if available.
    marker = "function buildWorkloadFromProjects"
    if marker not in text:
        raise SystemExit("❌ Could not find buildWorkloadFromProjects insertion point.")
    text = text.replace(marker, helper + "\n" + marker, 1)
    print("✅ Added workload personnel dedupe helpers.")
else:
    print("✅ Dedupe helpers already exist.")

# Replace personnel initialization if it exists from the previous patch.
replacements = [
    (
        "let personnel = Array.from(people.values()).filter(isIdentifiableWorkloadPerson);",
        "let personnel = dedupeWorkloadPersonnel(Array.from(people.values()).filter(isIdentifiableWorkloadPerson));",
    ),
    (
        "let personnel = Array.from(people.values());",
        "let personnel = dedupeWorkloadPersonnel(Array.from(people.values()));",
    ),
]

changed = False
for old, new in replacements:
    if old in text:
        text = text.replace(old, new, 1)
        changed = True
        print("✅ Wired dedupeWorkloadPersonnel() into personnel creation.")
        break

if not changed:
    print("⚠️ Could not find the personnel creation line. Run this inspect command:")
    print('rg -n "let personnel = Array.from\\(people.values\\(\\)\\)" src/api/workloadIntelligence.js -C 5')

path.write_text(text)

print("")
print("✅ Workload personnel dedupe patch complete.")
print("")
print("Inspect:")
print('rg -n "dedupeWorkloadPersonnel|mergeWorkloadPeople|getWorkloadPersonDedupeKey|let personnel" src/api/workloadIntelligence.js -C 6')
print("npm run build")
