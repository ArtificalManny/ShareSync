// src/api/workloadIntelligence.js
import client from "./client";
import { getSharedProjectOverview } from "./projectOverviewShared";

const MAX_OVERVIEW_PROJECTS = 10;
const OVERVIEW_REQUEST_DELAY_MS = 80;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(safeNumber(value, 0))));
}

function unwrapPayload(responseOrPayload) {
  const payload = responseOrPayload?.data ?? responseOrPayload;

  return (
    payload?.data ??
    payload?.result ??
    payload?.overview ??
    payload
  );
}

function extractArray(payload) {
  if (Array.isArray(payload)) return payload;

  const data = unwrapPayload(payload);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.projects)) return data.projects;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.members)) return data.members;

  return [];
}

function normalizeId(value) {
  if (!value) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  return String(
    value?._id ||
      value?.id ||
      value?.userId ||
      value?.memberId ||
      value?.ownerId ||
      value?.sub ||
      value?.$oid ||
      value?.value ||
      ""
  ).trim();
}

function normalizeUserId(value) {
  if (!value) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  return String(
    value?.user?._id ||
      value?.user?.id ||
      value?.userId?._id ||
      value?.userId?.id ||
      value?.member?._id ||
      value?.member?.id ||
      value?.profile?._id ||
      value?.profile?.id ||
      value?._id ||
      value?.id ||
      value?.userId ||
      value?.memberId ||
      value?.ownerId ||
      value?.sub ||
      ""
  ).trim();
}

function normalizeName(value, fallback = "Project member") {
  if (!value) return fallback;

  if (typeof value === "string" || typeof value === "number") {
    return fallback;
  }

  const nested =
    value?.user ||
    value?.userId ||
    value?.member ||
    value?.profile ||
    value?.owner ||
    value?.createdBy ||
    null;

  const firstName = value?.firstName || nested?.firstName || "";
  const lastName = value?.lastName || nested?.lastName || "";

  const joinedName = `${firstName} ${lastName}`.trim();

  return (
    value?.name ||
    value?.fullName ||
    value?.displayName ||
    value?.username ||
    value?.email ||
    nested?.name ||
    nested?.fullName ||
    nested?.displayName ||
    nested?.username ||
    nested?.email ||
    joinedName ||
    fallback
  );
}

function normalizeAvatar(value) {
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

function isDoneTask(task) {
  const status = String(task?.status || task?.state || "").toLowerCase();

  return (
    status === "done" ||
    status === "completed" ||
    status === "complete" ||
    Boolean(task?.completedAt)
  );
}

function getTaskActor(task, project, currentUser) {
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
}

function sameId(a, b) {
  const left = normalizeUserId(a) || normalizeId(a);
  const right = normalizeUserId(b) || normalizeId(b);
  return Boolean(left && right && left === right);
}

function readStoredUser() {
  if (typeof localStorage === "undefined") return null;

  const keys = ["user", "currentUser", "authUser", "profile"];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed?.user || parsed?.data || parsed;
      }
    } catch {
      // Ignore malformed localStorage values.
    }
  }

  return null;
}

async function fetchCurrentUser() {
  const endpoints = ["/users/me", "/auth/me", "/user/me"];

  for (const endpoint of endpoints) {
    try {
      const response = await client.get(endpoint);
      const data = unwrapPayload(response);
      const user = data?.user || data?.profile || data;

      if (user && typeof user === "object") {
        return user;
      }
    } catch {
      // Try the next known auth endpoint.
    }
  }

  return readStoredUser();
}

async function fetchProjects() {
  const response = await client.get("/projects");
  return extractArray(response);
}

async function fetchProjectOverview(projectId) {
  if (!projectId) return null;

  const response = await getSharedProjectOverview(projectId);
  return unwrapPayload(response);
}

function makePersonKey(person) {
  const id = normalizeUserId(person) || normalizeId(person);
  if (id) return id;

  const name = normalizeName(person, "");
  return name ? `name:${name.toLowerCase()}` : "";
}

function addOrMergePerson(map, person, options = {}) {
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
}

function incrementPersonShips(map, actor, amount, fallbackName, currentUser) {
  const isCurrent = currentUser ? sameId(actor, currentUser) : false;

  const person = addOrMergePerson(map, actor || currentUser, {
    fallbackName,
    isCurrentUser: isCurrent,
    shipsToAdd: amount,
    projectsToAdd: 0,
  });

  return person;
}

function addProjectMembers(map, project, currentUser) {
  const currentUserId = normalizeUserId(currentUser) || normalizeId(currentUser);

  if (currentUser) {
    addOrMergePerson(map, currentUser, {
      fallbackName: "You",
      isCurrentUser: true,
      projectsToAdd: 0,
    });
  }

  const owner = project?.owner || project?.ownerId || project?.createdBy || project?.createdById;

  if (owner) {
    addOrMergePerson(map, owner, {
      fallbackName: currentUser && sameId(owner, currentUser) ? "You" : "Project owner",
      isCurrentUser: currentUserId ? sameId(owner, currentUser) : false,
      projectsToAdd: 1,
    });
  }

  const members = Array.isArray(project?.members) ? project.members : [];

  members.forEach((member) => {
    const rawMember = member?.user || member?.userId || member?.member || member?.profile || member;

    addOrMergePerson(map, rawMember, {
      fallbackName: "Unknown teammate",
      isCurrentUser: currentUserId ? sameId(rawMember, currentUser) : false,
      projectsToAdd: 1,
    });
  });
}


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
  const safePeople = Array.isArray(personnel) ? personnel : [];

  // Pass 1: merge obvious same IDs/emails.
  const byStrongKey = new Map();

  for (const person of safePeople) {
    const key = getWorkloadPersonDedupeKey(person);
    if (!key) continue;

    const existing = byStrongKey.get(key);
    byStrongKey.set(key, existing ? mergeWorkloadPeople(existing, person) : person);
  }

  // Pass 2: merge duplicate display-name rows that survived because one row
  // had an ID and the other row only had a name fallback.
  const byName = new Map();

  for (const person of Array.from(byStrongKey.values())) {
    const nameKey = normalizeWorkloadPersonNameKey(person.name);
    const emailKey = normalizeWorkloadPersonNameKey(person.email);

    const weakKey = emailKey ? `email:${emailKey}` : nameKey ? `name:${nameKey}` : "";

    if (!weakKey) continue;

    const existing = byName.get(weakKey);
    byName.set(weakKey, existing ? mergeWorkloadPeople(existing, person) : person);
  }

  return Array.from(byName.values());
}

function buildWorkloadFromProjects({ projects, overviews, currentUser }) {
  const people = new Map();

  projects.forEach((project) => addProjectMembers(people, project, currentUser));

  let totalShips = 0;

  overviews.forEach((overview, index) => {
    const project = overview?.project || projects[index] || {};
    const tasks = Array.isArray(overview?.tasks) ? overview.tasks : extractArray(overview?.tasks);

    let countedTaskShipsForProject = 0;

    tasks.forEach((task) => {
      if (!isDoneTask(task)) return;

      const actor = getTaskActor(task, project, currentUser);
      incrementPersonShips(people, actor, 1, "Project member", currentUser);

      countedTaskShipsForProject += 1;
      totalShips += 1;
    });

    const projectMetrics =
      project?.metrics ||
      overview?.project?.metrics ||
      overview?.metrics ||
      {};

    const metricShips = safeNumber(
      projectMetrics?.totalShips ??
        projectMetrics?.completedTasks ??
        project?.totalShips ??
        project?.completedTasks,
      0
    );

    if (countedTaskShipsForProject === 0 && metricShips > 0) {
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
    }
  });

  const currentUserId = normalizeUserId(currentUser) || normalizeId(currentUser);

  let personnel = dedupeWorkloadPersonnel(Array.from(people.values()).filter(isIdentifiableWorkloadPerson));

  if (personnel.length === 0 && currentUser) {
    personnel = [
      {
        id: currentUserId || "current-user",
        userId: currentUserId || "current-user",
        name: normalizeName(currentUser, "You"),
        avatarUrl: normalizeAvatar(currentUser),
        shipsCompleted: 0,
        projectCount: projects.length,
        isCurrentUser: true,
        loadPercent: 0,
        status: "Available",
      },
    ];
  }

  totalShips = personnel.reduce((sum, person) => sum + safeNumber(person.shipsCompleted, 0), 0);

  personnel = personnel
    .map((person) => {
      const loadPercent = totalShips > 0 ? clampPercent((person.shipsCompleted / totalShips) * 100) : 0;

      let status = "Available";
      if (loadPercent >= 60 && personnel.length > 1) status = "Critical";
      else if (loadPercent >= 40 && personnel.length > 1) status = "Heavy";
      else if (loadPercent > 0) status = "Active";
      else status = "Quiet";

      return {
        ...person,
        loadPercent,
        load: loadPercent,
        ships: person.shipsCompleted,
        status,
      };
    })
    .sort((a, b) => {
      if (a.isCurrentUser && !b.isCurrentUser) return -1;
      if (!a.isCurrentUser && b.isCurrentUser) return 1;
      return safeNumber(b.shipsCompleted, 0) - safeNumber(a.shipsCompleted, 0);
    });

  const currentUserEntry =
    personnel.find((person) => person.isCurrentUser) ||
    personnel.find((person) => currentUserId && person.userId === currentUserId) ||
    personnel[0] ||
    null;

  const teamSize = Math.max(personnel.length, 1);
  const teamAverageShips = totalShips / teamSize;
  const currentUserShips = safeNumber(currentUserEntry?.shipsCompleted, 0);
  const currentUserLoadPercent = clampPercent(currentUserEntry?.loadPercent || 0);
  const imbalanceRatio =
    teamAverageShips > 0 ? Number((currentUserShips / teamAverageShips).toFixed(1)) : 0;

  const hasTeam = personnel.length > 1;
  const isHighWorkload =
    hasTeam &&
    totalShips > 0 &&
    (currentUserLoadPercent >= 60 || imbalanceRatio >= 1.6);

  const isBalanced = !hasTeam || !isHighWorkload;

  const title = !hasTeam
    ? "Solo Workload"
    : isBalanced
      ? "Load Balanced"
      : "High Workload";

  const description = !hasTeam
    ? "Only your own workload is active right now."
    : isBalanced
      ? "Team shipping load is reasonably distributed."
      : `You're doing ${currentUserLoadPercent}% of ships. Rebalance suggested.`;

  const diagnosticTitle = !hasTeam
    ? "Solo Workload"
    : isBalanced
      ? "Load Balanced"
      : "Workload Imbalance";

  const diagnosticDescription = !hasTeam
    ? "This view currently reflects your own output because no active teammate contribution is detected yet."
    : isBalanced
      ? "Current output is distributed across active personnel."
      : `Your current output is ${imbalanceRatio}× the team average. This pace may be unsustainable.`;

  return {
    title,
    description,
    diagnosticTitle,
    diagnosticDescription,
    isBalanced,
    isHighWorkload,
    hasTeam,
    totalShips,
    teamSize,
    teamAverageShips: Number(teamAverageShips.toFixed(1)),
    currentUserShipCount: currentUserShips,
    currentUserLoadPercent,
    imbalanceRatio,
    personnel,
    generatedAt: new Date().toISOString(),
  };
}


function finalizeWorkloadSignal(payload = {}) {
  const personnel = Array.isArray(payload.personnel) ? payload.personnel : [];
  const totalShips = Number(payload.totalShips || 0);
  const activeContributors = personnel.filter((p) => Number(p.shipsCompleted || 0) > 0);
  const teamSize = personnel.length;

  if (totalShips <= 0) {
    return {
      ...payload,
      title: "No Workload Signal Yet",
      diagnosticTitle: "No Workload Signal Yet",
      description: "No shipped work is attributed in this scope yet.",
      diagnosticDescription: "Once people start shipping work, OpenShare can detect load imbalance.",
      currentUserLoadPercent: 0,
      currentUserShipCount: 0,
      teamAverageShips: 0,
      imbalanceRatio: 0,
      isBalanced: true,
      isHighWorkload: false,
      hasTeam: teamSize > 1,
      personnel: personnel.map((person) => ({
        ...person,
        loadPercent: 0,
      })),
    };
  }

  const normalizedPersonnel = personnel.map((person) => ({
    ...person,
    loadPercent: Math.round(
      (Number(person.shipsCompleted || 0) / Math.max(totalShips, 1)) * 100
    ),
  }));

  const currentUser = normalizedPersonnel.find((person) => person.isCurrentUser);
  const currentUserLoadPercent = Number(currentUser?.loadPercent || 0);
  const currentUserShipCount = Number(currentUser?.shipsCompleted || 0);
  const teamAverageShips = teamSize > 0 ? totalShips / teamSize : totalShips;
  const maxShips = Math.max(...normalizedPersonnel.map((p) => Number(p.shipsCompleted || 0)), 0);
  const imbalanceRatio = teamAverageShips > 0 ? Number((maxShips / teamAverageShips).toFixed(1)) : 0;

  const singlePersonCarrying =
    teamSize > 1 &&
    activeContributors.length === 1 &&
    totalShips > 0;

  const isHighWorkload =
    singlePersonCarrying ||
    currentUserLoadPercent >= 70 ||
    imbalanceRatio >= 2.5;

  return {
    ...payload,
    personnel: normalizedPersonnel,
    currentUserLoadPercent,
    currentUserShipCount,
    teamAverageShips,
    imbalanceRatio,
    isBalanced: !isHighWorkload,
    isHighWorkload,
    title: isHighWorkload ? "High Workload" : "Load Balanced",
    diagnosticTitle: isHighWorkload ? "Workload Imbalance" : "Load Balanced",
    description: isHighWorkload
      ? `You're doing ${currentUserLoadPercent}% of ships. Rebalance suggested.`
      : "Current output is distributed across active personnel.",
    diagnosticDescription: singlePersonCarrying
      ? "One person is carrying all attributed shipped work in this scope."
      : isHighWorkload
        ? `Your current output is ${imbalanceRatio}× the team average. This pace may be unsustainable.`
        : "Current output is distributed across active personnel.",
  };
}

export async function getWorkloadIntelligence() {
  const currentUser = await fetchCurrentUser();
  const projects = await fetchProjects();

  const activeProjects = projects.filter((project) => {
    const status = String(project?.status || "").toLowerCase();
    return !project?.isArchived && status !== "archived" && status !== "completed";
  });

  const scopedProjects = activeProjects.slice(0, MAX_OVERVIEW_PROJECTS);

  const overviews = [];

  for (const project of scopedProjects) {
    const projectId = normalizeId(project?._id || project?.id || project?.projectId);

    try {
      const overview = await fetchProjectOverview(projectId);
      overviews.push(overview || { project });
    } catch (error) {
      console.warn("[workloadIntelligence] Project overview failed:", {
        projectId,
        message: error?.normalizedMessage || error?.message || error,
      });

      overviews.push({ project, tasks: [] });
    }

    await sleep(OVERVIEW_REQUEST_DELAY_MS);
  }

  return finalizeWorkloadSignal(buildWorkloadFromProjects({
    projects: scopedProjects,
    overviews,
    currentUser,
  }));
}
