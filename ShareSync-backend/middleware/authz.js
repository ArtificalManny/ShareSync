// middleware/authz.js
const Project = require('../models/Project'); // adjust if your Project model lives elsewhere

/**
 * Loads a project and attaches it to req.project
 * Supports params: :id or :projectId, or body.projectId
 */
async function loadProject(req, res, next) {
  try {
    const id =
      req.params?.projectId ||
      req.params?.id ||
      req.body?.projectId;

    if (!id) return res.status(400).json({ message: 'Missing project id' });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    req.project = project;
    next();
  } catch (e) {
    next(e);
  }
}

/** Owner-only guard (invites, destructive ops) */
function ensureProjectOwner(req, res, next) {
  const userId = req.user?.id || req.user?._id;
  const p = req.project;
  if (!userId || !p) return res.status(403).json({ message: 'Forbidden' });

  const isOwner =
    String(p.userId) === String(userId) ||
    (Array.isArray(p.members) &&
      p.members.some((m) => String(m.userId) === String(userId) && m.role === 'owner'));

  if (!isOwner) return res.status(403).json({ message: 'Only owners may perform this action' });
  next();
}

/** Editor guard: owner OR member (for adding/deleting files, editing tasks, etc.) */
function ensureProjectEditor(req, res, next) {
  const userId = req.user?.id || req.user?._id;
  const p = req.project;
  if (!userId || !p) return res.status(403).json({ message: 'Forbidden' });

  const isOwner = String(p.userId) === String(userId) ||
    (Array.isArray(p.members) && p.members.some((m) => String(m.userId) === String(userId) && m.role === 'owner'));

  const isMember =
    Array.isArray(p.members) &&
    p.members.some((m) => String(m.userId) === String(userId) && (m.role === 'member' || m.role === 'owner'));

  if (!(isOwner || isMember)) {
    return res.status(403).json({ message: 'Only editors (owner or member) can modify project files' });
  }
  next();
}

module.exports = { loadProject, ensureProjectOwner, ensureProjectEditor };
