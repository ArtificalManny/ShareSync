from pathlib import Path
import re

path = Path("src/api/workloadIntelligence.js")

if not path.exists():
    raise SystemExit("❌ src/api/workloadIntelligence.js not found.")

text = path.read_text()

backup = path.with_suffix(".js.bak-before-clean-generic-workload-people")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1. Insert helper functions after normalizeAvatar().
anchor = """function normalizeAvatar(value) {
  if (!value || typeof value !== "object") return "";

  const nested =
    value?.user ||
    value?.userId ||
    value?.member ||
    value?.profile ||
    value?.owner ||
    null;

  return (
    value?.avatarUrl ||
    value?.profilePicture ||
    value?.photoUrl ||
    value?.avatar ||
    nested?.avatarUrl ||
    nested?.profilePicture ||
    nested?.photoUrl ||
    nested?.avatar ||
    ""
  );
}
"""

helpers = anchor + """

function hasRealDisplayIdentity(value) {
  if (!value || typeof value !== "object") return false;

  const nested =
    value?.user ||
    value?.userId ||
    value?.member ||
    value?.profile ||
    value?.owner ||
    value?.createdBy ||
    null;

  const candidates = [
    value?.name,
    value?.fullName,
    value?.displayName,
    value?.username,
    value?.email,
    value?.firstName,
    value?.lastName,
    nested?.name,
    nested?.fullName,
    nested?.displayName,
    nested?.username,
    nested?.email,
    nested?.firstName,
    nested?.lastName,
  ];

  return candidates.some((candidate) => String(candidate || "").trim().length > 0);
}

function isGenericWorkloadName(name) {
  const value = String(name || "").trim().toLowerCase();

  return (
    value === "project owner" ||
    value === "project member" ||
    value === "project teammate" ||
    value === "team member" ||
    value === "unknown teammate" ||
    value === "unknown user"
  );
}

function isIdentifiableWorkloadPerson(person) {
  if (!person || typeof person !== "object") return false;
  if (person.isCurrentUser) return true;
  if (person.avatarUrl) return true;
  if (!isGenericWorkloadName(person.name)) return true;
  return false;
}
"""

if "function hasRealDisplayIdentity(" not in text:
    if anchor not in text:
        raise SystemExit("❌ Could not find normalizeAvatar() anchor. No changes written.")
    text = text.replace(anchor, helpers, 1)
    print("✅ Added real identity helpers.")
else:
    print("✅ Real identity helpers already exist.")

# 2. Replace getTaskActor so unowned/completed tasks do NOT fall back to project owner.
pattern = re.compile(
    r"function getTaskActor\(task, project, currentUser\) \{.*?\n\}",
    re.DOTALL,
)

replacement = """function getTaskActor(task, project, currentUser) {
  // Only return a real actor field. Do NOT fall back to project.owner.
  // Falling back to project.owner creates misleading rows like "Project owner".
  return (
    task?.completedBy ||
    task?.completedById ||
    task?.completedByUser ||
    task?.assignee ||
    task?.assigneeId ||
    task?.assignedTo ||
    task?.assignedToId ||
    task?.owner ||
    task?.ownerId ||
    task?.createdBy ||
    task?.createdById ||
    null
  );
}"""

text, count = pattern.subn(replacement, text, count=1)

if count == 1:
    print("✅ getTaskActor() no longer falls back to project.owner/currentUser.")
else:
    print("⚠️ Could not replace getTaskActor(); check manually.")

# 3. Replace addOrMergePerson with a stricter version.
pattern = re.compile(
    r"function addOrMergePerson\(map, person, options = \{\}\) \{.*?\n\}",
    re.DOTALL,
)

replacement = """function addOrMergePerson(map, person, options = {}) {
  const {
    fallbackName = "Unknown teammate",
    isCurrentUser = false,
    shipsToAdd = 0,
    projectsToAdd = 0,
    allowGeneric = false,
  } = options;

  const id = normalizeUserId(person) || normalizeId(person);
  const hasRealIdentity = hasRealDisplayIdentity(person);
  const name = normalizeName(person, fallbackName);
  const avatarUrl = normalizeAvatar(person);

  // Important:
  // Do not create visible people from bare ObjectIds or generic roles.
  // This prevents "Project owner" and "Project member" from showing up
  // as if they were actual users.
  if (!isCurrentUser && !hasRealIdentity && !allowGeneric) {
    return null;
  }

  if (!isCurrentUser && isGenericWorkloadName(name) && !allowGeneric) {
    return null;
  }

  const key = id || `name:${String(name || fallbackName).toLowerCase()}`;

  if (!key) return null;

  const existing = map.get(key) || {
    id: key,
    userId: id || key,
    name,
    avatarUrl,
    shipsCompleted: 0,
    projectCount: 0,
    isCurrentUser: false,
    loadPercent: 0,
    status: "Available",
  };

  existing.name = existing.name || name;
  existing.avatarUrl = existing.avatarUrl || avatarUrl;
  existing.isCurrentUser = Boolean(existing.isCurrentUser || isCurrentUser);
  existing.shipsCompleted += safeNumber(shipsToAdd, 0);
  existing.projectCount += safeNumber(projectsToAdd, 0);

  map.set(key, existing);
  return existing;
}"""

text, count = pattern.subn(replacement, text, count=1)

if count == 1:
    print("✅ addOrMergePerson() now blocks generic fallback users.")
else:
    print("⚠️ Could not replace addOrMergePerson(); check manually.")

# 4. Replace project-level metric fallback so it does not assign anonymous metric ships to project owner.
old = """    if (countedTaskShipsForProject === 0 && metricShips > 0) {
      const actor =
        project?.lastShipBy ||
        project?.completedBy ||
        project?.owner ||
        project?.ownerId ||
        currentUser;

      incrementPersonShips(people, actor, metricShips, "Project member", currentUser);
      totalShips += metricShips;
    }"""

new = """    if (countedTaskShipsForProject === 0 && metricShips > 0) {
      const actor =
        project?.lastShipBy ||
        project?.lastShipById ||
        project?.completedBy ||
        project?.completedById ||
        null;

      // Only attribute project-level ship metrics when the backend gives us
      // a real actor. Do not guess "project owner".
      if (actor) {
        incrementPersonShips(people, actor, metricShips, "Unknown teammate", currentUser);
        totalShips += metricShips;
      }
    }"""

if old in text:
    text = text.replace(old, new, 1)
    print("✅ Project-level ships no longer fall back to project.owner.")
else:
    print("⚠️ Could not find project-level metric fallback block; check manually.")

# 5. Filter personnel so generic placeholders cannot render.
old = """  let personnel = Array.from(people.values());"""

new = """  let personnel = Array.from(people.values()).filter(isIdentifiableWorkloadPerson);"""

if old in text:
    text = text.replace(old, new, 1)
    print("✅ Personnel list now filters generic placeholder rows.")
else:
    print("⚠️ Could not find personnel initialization line; check manually.")

# 6. Make member seeding stricter.
text = text.replace(
    'fallbackName: "Project owner",',
    'fallbackName: "Unknown teammate",'
)

text = text.replace(
    'fallbackName: "Project member",',
    'fallbackName: "Unknown teammate",'
)

path.write_text(text)

print("")
print("✅ Workload identity cleanup complete.")
print("")
print("Inspect:")
print('rg -n "hasRealDisplayIdentity|isGenericWorkloadName|isIdentifiableWorkloadPerson|getTaskActor|Project owner|Project member|Unknown teammate" src/api/workloadIntelligence.js -C 5')
print("npm run build")
