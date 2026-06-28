function toArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function normalizeId(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return String(
      value._id ||
        value.id ||
        value.userId ||
        value.memberId ||
        value.value ||
        ""
    ).trim();
  }

  return String(value).trim();
}

function unwrapPerson(value) {
  if (!value || typeof value !== "object") return value;

  return (
    value.userId ||
    value.user ||
    value.member ||
    value.profile ||
    value.account ||
    value
  );
}

function getFullName(value) {
  const person = unwrapPerson(value);

  if (!person) return "";

  if (typeof person === "string") {
    return /^[a-f\d]{24}$/i.test(person) ? "" : person;
  }

  const firstLast = [person.firstName, person.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    person.name ||
    person.fullName ||
    person.displayName ||
    firstLast ||
    person.username ||
    person.email ||
    ""
  );
}

function getEmail(value) {
  const person = unwrapPerson(value);
  if (!person || typeof person !== "object") return "";
  return person.email || value?.email || "";
}

function getAvatar(value) {
  const person = unwrapPerson(value);
  if (!person || typeof person !== "object") return "";

  return (
    person.avatarUrl ||
    person.profilePicture ||
    person.profileImage ||
    person.photoUrl ||
    person.imageUrl ||
    person.avatar ||
    person.picture ||
    value?.avatarUrl ||
    value?.profilePicture ||
    value?.avatar ||
    ""
  );
}

function getInitials(name) {
  const parts = String(name || "Project member")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "PM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function addMember(map, rawMember, fallback = {}) {
  if (!rawMember) return;

  const person = unwrapPerson(rawMember);
  const id =
    normalizeId(person) ||
    normalizeId(rawMember.userId) ||
    normalizeId(rawMember.user) ||
    normalizeId(rawMember.memberId) ||
    normalizeId(rawMember._id) ||
    normalizeId(rawMember.id) ||
    getEmail(rawMember) ||
    getFullName(rawMember);

  if (!id) return;

  const existing = map.get(id) || {};

  const name =
    getFullName(rawMember) ||
    getFullName(person) ||
    fallback.name ||
    existing.name ||
    "Project member";

  map.set(id, {
    id,
    name,
    email: getEmail(rawMember) || existing.email || "",
    avatar: getAvatar(rawMember) || existing.avatar || "",
    initials: getInitials(name),
    role:
      rawMember.displayRole ||
      rawMember.role ||
      rawMember.permissionRole ||
      fallback.role ||
      existing.role ||
      "Member",
    assigned: existing.assigned || 0,
    blocked: existing.blocked || 0,
    load: existing.load || 0,
  });
}

function collectMembers(project = {}, overview = {}) {
  const map = new Map();

  toArray(project.members).forEach((member) => addMember(map, member));

  const ownerCandidates = [
    project.ownerId,
    project.owner,
    project.createdBy,
    project.createdById,
    overview?.summary?.ownerSummary?.owner,
    overview?.summary?.ownerSummary?.primaryOwner,
  ];

  ownerCandidates.forEach((owner) => {
    if (owner && typeof owner === "object") {
      addMember(map, owner, { role: "Owner" });
    }
  });

  return map;
}

function isTaskDone(task) {
  const status = String(
    task?.status ||
      task?.state ||
      task?.column ||
      task?.lane ||
      ""
  ).toLowerCase();

  return (
    task?.done === true ||
    task?.completed === true ||
    Boolean(task?.completedAt) ||
    ["done", "completed", "complete", "closed", "archived", "cancelled", "canceled"].includes(status)
  );
}

function isTaskBlocked(task) {
  const status = String(
    task?.status ||
      task?.state ||
      task?.column ||
      task?.lane ||
      ""
  ).toLowerCase();

  const unresolvedBlockers = [
    ...toArray(task?.blockers),
    ...toArray(task?.blockedBy),
    ...toArray(task?.blockerIds),
    ...toArray(task?.blocking),
  ].some((blocker) => {
    if (!blocker) return false;
    if (typeof blocker === "string") return blocker.trim().length > 0;

    return (
      blocker.resolved !== true &&
      blocker.done !== true &&
      blocker.completed !== true &&
      !blocker.resolvedAt &&
      !blocker.completedAt
    );
  });

  return (
    task?.blocked === true ||
    task?.isBlocked === true ||
    task?.is_blocked === true ||
    Boolean(task?.blockedReason) ||
    Boolean(task?.blockerReason) ||
    status.includes("block") ||
    unresolvedBlockers
  );
}

function getTaskAssigneeIds(task) {
  const rawCandidates = [
    task?.assignee,
    task?.assigneeId,
    task?.assignedUser,
    task?.assignedUserId,
    task?.owner,
    task?.ownerId,
    task?.user,
    task?.userId,
    task?.member,
    task?.memberId,
    task?.createdBy,
    task?.createdById,
    ...toArray(task?.assignedTo),
    ...toArray(task?.assignedToIds),
    ...toArray(task?.assigneeIds),
    ...toArray(task?.assignees),
    ...toArray(task?.owners),
    ...toArray(task?.assignedUsers),
    ...toArray(task?.members),
  ];

  return [
    ...new Set(
      rawCandidates
        .map((candidate) => {
          const unwrapped =
            candidate?.userId ||
            candidate?.user ||
            candidate?.member ||
            candidate?.profile ||
            candidate;

          return normalizeId(unwrapped) || normalizeId(candidate);
        })
        .filter(Boolean)
    ),
  ];
}

function buildProjectTeamCapacity({
  project = {},
  tasks = [],
  overview = {},
  fallback = null,
} = {}) {
  const memberMap = collectMembers(project, overview);
  const openTasks = toArray(tasks).filter((task) => !isTaskDone(task));

  openTasks.forEach((task) => {
    const assigneeIds = getTaskAssigneeIds(task);
    const blocked = isTaskBlocked(task);

    assigneeIds.forEach((id) => {
      if (!memberMap.has(id)) {
        addMember(memberMap, { _id: id, name: "Project member" });
      }

      const row = memberMap.get(id);
      row.assigned += 1;
      if (blocked) row.blocked += 1;
      memberMap.set(id, row);
    });
  });

  const fallbackMembers = Array.isArray(fallback)
    ? fallback
    : Array.isArray(fallback?.members)
      ? fallback.members
      : [];

  fallbackMembers.forEach((member) => addMember(memberMap, member));

  const members = Array.from(memberMap.values()).map((member) => {
    const load = Math.min(100, member.assigned * 18 + member.blocked * 22);
    const tone = load >= 80 || member.blocked >= 3 ? "risk" : load >= 50 || member.blocked > 0 ? "watch" : "balanced";

    return {
      ...member,
      load,
      loadPercent: load,
      tone,
      statusLabel:
        tone === "risk"
          ? "Overloaded"
          : tone === "watch"
            ? "Watch"
            : "Balanced",
    };
  });

  const totalAssigned = members.reduce((sum, member) => sum + Number(member.assigned || 0), 0);
  const totalBlocked = members.reduce((sum, member) => sum + Number(member.blocked || 0), 0);
  const avgLoadPercent =
    members.length > 0
      ? Math.round(members.reduce((sum, member) => sum + Number(member.loadPercent || 0), 0) / members.length)
      : 0;

  return {
    memberCount: members.length,
    avgLoadPercent,
    totalAssigned,
    totalBlocked,
    overloadedCount: members.filter((member) => member.tone === "risk").length,
    members,
    updatedAt: new Date().toISOString(),
  };
}

export { buildProjectTeamCapacity };
export default buildProjectTeamCapacity;
