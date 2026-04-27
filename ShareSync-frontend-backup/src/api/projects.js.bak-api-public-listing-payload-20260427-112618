// src/api/projects.js - Hardened create + consistent unwrapping + lifecycle support
// ⭐ FIX: Added ID normalization to ensure all projects have valid id/_id fields
// ⭐ FIX: Now safely includes the `members` array in the payload!
// ⭐ LIFECYCLE: Added closure readiness / complete / reopen project APIs
import api from './client';

// ============================================
// HELPERS
// ============================================

// If backend returns { success: true, data: ... }, unwrap it.
// If backend returns raw data directly, keep as-is.
// Also tolerate common wrapper keys: { project }, { item }, { result }
function unwrap(response) {
  const payload = response?.data;

  if (!payload) return payload;

  // Common: { success: true, data: ... }
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const d = payload.data;

    // Common nested keys inside data
    if (d && typeof d === 'object') {
      if ('project' in d) return d.project;
      if ('item' in d) return d.item;
      if ('result' in d) return d.result;
    }

    return d;
  }

  // Common: { success: true, project: {...} }
  if (payload && typeof payload === 'object') {
    if ('project' in payload) return payload.project;
    if ('item' in payload) return payload.item;
    if ('result' in payload) return payload.result;
  }

  return payload;
}

function normalizeError(err, fallback = "Request failed") {
  const responseMessage = err?.response?.data?.message;
  const responseError = err?.response?.data?.error;

  const msg =
    err?.normalizedMessage ||
    (Array.isArray(responseMessage) ? responseMessage.join(", ") : responseMessage) ||
    responseError ||
    err?.message ||
    fallback;

  const status = err?.response?.status;
  const url = err?.config?.url;
  const method = err?.config?.method?.toUpperCase?.();

  const enriched = new Error(msg);
  enriched.normalizedMessage = msg;
  enriched.status = status;
  enriched.url = url;
  enriched.method = method;
  enriched.raw = err;
  enriched.details = err?.response?.data || null;
  return enriched;
}

/**
 * ⭐ FIX: Normalize a single project to ensure id/_id exists
 * @param {Object} project - Raw project from API
 * @returns {Object|null} - Normalized project or null if invalid
 */
function normalizeProjectId(project) {
  if (!project || typeof project !== 'object') return null;

  // Extract ID from various possible fields
  const id = project._id || project.id || project.projectId;

  // Validate ID
  if (!id || id === 'undefined' || id === 'null') {
    console.warn('[projects.js] Project missing valid ID:', project);
    return null;
  }

  // Convert ObjectId to string if needed
  const idString = typeof id === 'object' && id.toString ? id.toString() : String(id);

  // Ensure both name/title exist for UI compatibility
  const name = project.name || project.title;
  const title = project.title || project.name;

  return {
    ...project,
    id: idString,
    _id: idString,
    ...(name ? { name } : {}),
    ...(title ? { title } : {}),
  };
}

/**
 * ⭐ FIX: Normalize array of projects
 * @param {Array} projects - Array of raw projects
 * @returns {Array} - Array of normalized projects (invalid ones filtered out)
 */
function normalizeProjectsArray(projects) {
  if (!Array.isArray(projects)) return [];
  return projects.map(normalizeProjectId).filter(Boolean);
}

function uniqueStrings(list = []) {
  return [...new Set(
    (Array.isArray(list) ? list : [])
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  )];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeClosureReadiness(readiness) {
  if (!readiness || typeof readiness !== 'object') {
    return {
      isReadyToClose: false,
      readinessScore: 0,
      blockingReasons: [],
      warnings: [],
      openTaskCount: 0,
      openCriticalTaskCount: 0,
      blockedTaskCount: 0,
      activeGoalCount: 0,
      completedGoalCount: 0,
      hasActiveSprint: false,
    };
  }

  return {
    ...readiness,
    isReadyToClose: Boolean(readiness.isReadyToClose),
    readinessScore: safeNumber(readiness.readinessScore, 0),
    blockingReasons: uniqueStrings(readiness.blockingReasons),
    warnings: uniqueStrings(readiness.warnings),
    openTaskCount: safeNumber(readiness.openTaskCount, 0),
    openCriticalTaskCount: safeNumber(readiness.openCriticalTaskCount, 0),
    blockedTaskCount: safeNumber(readiness.blockedTaskCount, 0),
    activeGoalCount: safeNumber(readiness.activeGoalCount, 0),
    completedGoalCount: safeNumber(readiness.completedGoalCount, 0),
    hasActiveSprint: Boolean(readiness.hasActiveSprint),
  };
}

// ============================================
// PROJECTS
// ============================================

export const getProjects = async () => {
  try {
    const response = await api.get('/projects');
    const data = unwrap(response);
    return normalizeProjectsArray(data);
  } catch (err) {
    throw normalizeError(err, "Failed to load projects");
  }
};

export const getProjectsQuick = async () => {
  try {
    const response = await api.get('/projects/quick');
    const data = unwrap(response);
    return normalizeProjectsArray(data);
  } catch (err) {
    throw normalizeError(err, "Failed to load projects (quick)");
  }
};

export const getProject = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}`);
    const data = unwrap(response);
    return normalizeProjectId(data);
  } catch (err) {
    throw normalizeError(err, "Failed to load project");
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE PROJECT (Compatibility Layer)
// ─────────────────────────────────────────────────────────────────────────────

function normalizeCreateProjectPayload(projectData = {}) {
  const title = (projectData.title ?? projectData.name ?? '').trim();
  const description = (projectData.description ?? '').trim();
  const category = (projectData.category ?? '').trim();

  const privacyRaw = (projectData.privacy ?? '').toString().trim().toLowerCase();
  const isPublicRaw = projectData.isPublic;

  const visibility =
    typeof isPublicRaw === 'boolean'
      ? (isPublicRaw ? 'public' : 'private')
      : privacyRaw === 'public'
        ? 'public'
        : privacyRaw === 'private'
          ? 'private'
          : undefined;

  const tags = category ? [category] : undefined;

  const emoji = (projectData.emoji ?? '').toString().trim() || undefined;
  const icon = (projectData.icon ?? '').toString().trim() || undefined;

  const rawColor = (projectData.color ?? '').toString().trim();
  const color =
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(rawColor) ? rawColor : undefined;

  // ⭐ BUG FIX: The frontend was silently discarding the members array!
  const members = Array.isArray(projectData.members) ? projectData.members : undefined;

  return {
    name: title,
    description: description || undefined,
    visibility,
    tags,
    emoji,
    icon,
    color,
    members,
  };
}

// Normalize create response so callers can always find an id
function normalizeCreatedProject(p) {
  if (!p || typeof p !== 'object') return p;

  // tolerate nested project wrapper accidentally passed in
  const candidate =
    (p.project && typeof p.project === 'object') ? p.project :
    (p.item && typeof p.item === 'object') ? p.item :
    (p.result && typeof p.result === 'object') ? p.result :
    p;

  const id = candidate._id || candidate.id || candidate.projectId;

  // Ensure both name/title exist for UI compatibility
  const name = candidate.name || candidate.title;
  const title = candidate.title || candidate.name;

  return {
    ...candidate,
    ...(id ? { _id: id, id } : {}),
    ...(name ? { name } : {}),
    ...(title ? { title } : {}),
  };
}

export const createProject = async (projectData) => {
  try {
    const payload = normalizeCreateProjectPayload(projectData);

    if (!payload.name || payload.name.trim().length < 2) {
      const err = new Error("Project name is required (min 2 chars).");
      err.normalizedMessage = "Project name is required (min 2 chars).";
      throw err;
    }

    const response = await api.post('/projects', payload);

    const created = unwrap(response);
    return normalizeCreatedProject(created);
  } catch (err) {
    throw normalizeError(err, "Failed to create project");
  }
};

export const updateProject = async (projectId, updates) => {
  try {
    const response = await api.put(`/projects/${projectId}`, updates);
    const data = unwrap(response);
    return normalizeProjectId(data);
  } catch (err) {
    throw normalizeError(err, "Failed to update project");
  }
};

export const deleteProject = async (projectId) => {
  try {
    const response = await api.delete(`/projects/${projectId}`);
    return unwrap(response);
  } catch (err) {
    throw normalizeError(err, "Failed to delete project");
  }
};

// ============================================
// PROJECT LIFECYCLE / COMPLETION ENGINE
// ============================================

function normalizeCompleteProjectPayload(payload = {}) {
  return {
    closureSummary: (payload.closureSummary ?? '').toString().trim(),
    outcomeStatus: payload.outcomeStatus || undefined,
    leftoverDecision: payload.leftoverDecision || undefined,
    followUpProjectId:
      payload.followUpProjectId && String(payload.followUpProjectId).trim()
        ? String(payload.followUpProjectId).trim()
        : undefined,
    forceComplete: Boolean(payload.forceComplete),
    closureChecklist:
      payload.closureChecklist && typeof payload.closureChecklist === 'object'
        ? {
            primaryGoalConfirmed: Boolean(payload.closureChecklist.primaryGoalConfirmed),
            openWorkResolved: Boolean(payload.closureChecklist.openWorkResolved),
            blockersReviewed: Boolean(payload.closureChecklist.blockersReviewed),
            handoffPrepared: Boolean(payload.closureChecklist.handoffPrepared),
            summaryWritten: Boolean(payload.closureChecklist.summaryWritten),
            stakeholderSignoff: Boolean(payload.closureChecklist.stakeholderSignoff),
          }
        : undefined,
  };
}

function normalizeReopenProjectPayload(payload = {}) {
  return {
    reason: (payload.reason ?? '').toString().trim() || 'Project reopened',
  };
}

export const getProjectClosureReadiness = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/closure-readiness`);
    const data = unwrap(response);
    return normalizeClosureReadiness(data);
  } catch (err) {
    throw normalizeError(err, "Failed to evaluate project closure readiness");
  }
};

export const completeProject = async (projectId, payload = {}) => {
  try {
    const body = normalizeCompleteProjectPayload(payload);

    if (!body.closureSummary || body.closureSummary.length < 10) {
      const err = new Error("Closure summary is required before completing a project.");
      err.normalizedMessage = "Closure summary is required before completing a project.";
      throw err;
    }

    const response = await api.post(`/projects/${projectId}/complete`, body);
    const data = unwrap(response);
    return normalizeProjectId(data);
  } catch (err) {
    throw normalizeError(err, "Failed to complete project");
  }
};

export const reopenProject = async (projectId, payload = {}) => {
  try {
    const body = normalizeReopenProjectPayload(payload);
    const response = await api.post(`/projects/${projectId}/reopen`, body);
    const data = unwrap(response);
    return normalizeProjectId(data);
  } catch (err) {
    throw normalizeError(err, "Failed to reopen project");
  }
};

// ============================================
// TASKS
// ============================================

export const getTasks = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/tasks`);
    const data = unwrap(response);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw normalizeError(err, "Failed to load tasks");
  }
};

export const createTask = async (projectId, taskData) => {
  try {
    const response = await api.post(`/projects/${projectId}/tasks`, taskData);
    return unwrap(response);
  } catch (err) {
    throw normalizeError(err, "Failed to create task");
  }
};

export const updateTask = async (projectId, taskId, updates) => {
  try {
    const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, updates);
    return unwrap(response);
  } catch (err) {
    throw normalizeError(err, "Failed to update task");
  }
};

export const completeTask = async (projectId, taskId) => {
  try {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/complete`);
    return unwrap(response);
  } catch (err) {
    throw normalizeError(err, "Failed to complete task");
  }
};

export const deleteTask = async (projectId, taskId) => {
  try {
    const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    return unwrap(response);
  } catch (err) {
    throw normalizeError(err, "Failed to delete task");
  }
};

// ============================================
// SHIPS
// ============================================

export const getShips = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/ships`);
    const data = unwrap(response);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw normalizeError(err, "Failed to load ships");
  }
};

export const shipProject = async (projectId, shipData) => {
  try {
    const response = await api.post(`/projects/${projectId}/ships`, shipData);
    return unwrap(response);
  } catch (err) {
    throw normalizeError(err, "Failed to ship project");
  }
};

export const deleteShip = async (projectId, shipId) => {
  try {
    const response = await api.delete(`/projects/${projectId}/ships/${shipId}`);
    return unwrap(response);
  } catch (err) {
    throw normalizeError(err, "Failed to delete ship");
  }
};

// ============================================
// EXPORTS FOR HELPERS (for use in other files)
// ============================================

export {
  normalizeProjectId,
  normalizeProjectsArray,
  normalizeClosureReadiness,
};
