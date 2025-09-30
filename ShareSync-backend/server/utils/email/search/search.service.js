// server/utils/email/services/search/search.service.js
const mongoose = require('mongoose');
const User = require('../../models/User');
const Project = require('../../models/Project');
const Post = require('../../models/Post');
const Task = require('../../models/Task');
// If you have File model:
let File = null;
try { File = require('../../models/File'); } catch {}

function toNumber(v, def, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(n, min), max);
}

async function isProjectMember(projectId, userId) {
  if (!projectId || !userId) return false;
  const proj = await Project.findById(projectId).select({ memberIds: 1, ownerId: 1 }).lean();
  if (!proj) return false;
  if (String(proj.ownerId) === String(userId)) return true;
  return (proj.memberIds || []).some(id => String(id) === String(userId));
}

function buildTextQuery(fieldSpec, qPlain) {
  if (qPlain && qPlain.length >= 2) {
    return { $text: { $search: qPlain } };
  }
  // fallback lightweight regex when no query
  return {};
}

function computeScoreProjection() {
  return { score: { $meta: 'textScore' } };
}
function computeSort(sort, hasText) {
  if (sort === 'recent') return { updatedAt: -1, createdAt: -1, lastActivityAt: -1 };
  if (hasText) return { score: { $meta: 'textScore' } };
  return { createdAt: -1 };
}

// ---------- USERS ----------
async function searchUsers(qPlain, ctx, { sort, page, limit }) {
  const filter = {
    // discoverable OR self
    $or: [
      { discoverable: true },
      { _id: ctx.userId ? new mongoose.Types.ObjectId(ctx.userId) : null },
    ],
  };
  const query = { ...filter, ...buildTextQuery({ username: 1, fullName: 1 }, qPlain) };

  const projection = qPlain ? computeScoreProjection() : {};
  const docs = await User.find(query, projection)
    .sort(computeSort(sort, !!qPlain))
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return docs.map(u => ({
    type: 'user',
    id: String(u._id),
    username: u.username || null,
    fullName: u.fullName || null,
    avatarUrl: u.avatarUrl || null,
  }));
}

// ---------- PROJECTS ----------
async function searchProjects(qPlain, ctx, { sort, page, limit }) {
  const base = buildTextQuery({ title: 1, description: 1 }, qPlain);

  // discoverable=true or member
  const membershipFilter = ctx.userId
    ? { $or: [{ discoverable: true }, { memberIds: ctx.userId }, { ownerId: ctx.userId }] }
    : { discoverable: true };

  const query = { ...base, ...membershipFilter };
  const projection = qPlain ? computeScoreProjection() : {};
  const docs = await Project.find(query, projection)
    .sort(sort === 'recent' ? { lastActivityAt: -1 } : computeSort(sort, !!qPlain))
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return docs.map(p => ({
    type: 'project',
    id: String(p._id),
    title: p.title,
    description: p.description || '',
    lastActivityAt: p.lastActivityAt || p.updatedAt || p.createdAt,
  }));
}

// ---------- POSTS ----------
async function searchPosts(qPlain, ctx, { sort, page, limit, projectId }) {
  const base = buildTextQuery({ body: 1 }, qPlain);
  const and = [base];
  if (projectId) and.push({ projectId });

  // Only projects where requester is member
  const memberProjects = await Project.find({
    $or: [{ ownerId: ctx.userId }, { memberIds: ctx.userId }],
  }).select({ _id: 1 }).lean();
  const allowed = new Set(memberProjects.map(p => String(p._id)));
  if (projectId && !allowed.has(String(projectId))) return [];

  if (!projectId) and.push({ projectId: { $in: Array.from(allowed) } });

  const query = and.length > 1 ? { $and: and } : base;
  const projection = qPlain ? computeScoreProjection() : {};
  const docs = await Post.find(query, projection)
    .sort(computeSort(sort, !!qPlain))
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return docs.map(p => ({
    type: 'post',
    id: String(p._id),
    projectId: String(p.projectId),
    snippet: p.body?.slice(0, 180) || '',
    createdAt: p.createdAt,
  }));
}

// ---------- FILES (optional) ----------
async function searchFiles(qPlain, ctx, { sort, page, limit, projectId }) {
  if (!File) return [];
  const base = buildTextQuery({ filename: 1, title: 1 }, qPlain);
  const and = [base];
  if (projectId) and.push({ projectId });

  const memberProjects = await Project.find({
    $or: [{ ownerId: ctx.userId }, { memberIds: ctx.userId }],
  }).select({ _id: 1 }).lean();
  const allowed = new Set(memberProjects.map(p => String(p._id)));
  if (projectId && !allowed.has(String(projectId))) return [];
  if (!projectId) and.push({ projectId: { $in: Array.from(allowed) } });

  const query = and.length > 1 ? { $and: and } : base;
  const projection = qPlain ? computeScoreProjection() : {};
  const docs = await File.find(query, projection)
    .sort(computeSort(sort, !!qPlain))
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return docs.map(f => ({
    type: 'file',
    id: String(f._id),
    projectId: String(f.projectId),
    name: f.filename || f.title || 'file',
    size: f.size || null,
  }));
}

// ---------- TASKS ----------
async function searchTasks(qPlain, ctx, { sort, page, limit, projectId }) {
  const base = buildTextQuery({ title: 1, notes: 1 }, qPlain);
  const and = [base];
  if (projectId) and.push({ projectId });

  const memberProjects = await Project.find({
    $or: [{ ownerId: ctx.userId }, { memberIds: ctx.userId }],
  }).select({ _id: 1 }).lean();
  const allowed = new Set(memberProjects.map(p => String(p._id)));
  if (projectId && !allowed.has(String(projectId))) return [];
  if (!projectId) and.push({ projectId: { $in: Array.from(allowed) } });

  const query = and.length > 1 ? { $and: and } : base;
  const projection = qPlain ? computeScoreProjection() : {};
  const docs = await Task.find(query, projection)
    .sort(computeSort(sort, !!qPlain))
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return docs.map(t => ({
    type: 'task',
    id: String(t._id),
    projectId: String(t.projectId),
    title: t.title || '',
    status: t.status || '',
    createdAt: t.createdAt,
  }));
}

function mergeAndSlice(buckets, page, limit, sort) {
  const flat = buckets.flat();
  if (sort === 'recent') {
    flat.sort((a, b) => new Date(b.createdAt || b.lastActivityAt || 0) - new Date(a.createdAt || a.lastActivityAt || 0));
  }
  const total = flat.length;
  const start = (page - 1) * limit;
  const items = flat.slice(start, start + limit);
  return { total, items };
}

module.exports = {
  toNumber,
  searchUsers,
  searchProjects,
  searchPosts,
  searchFiles,
  searchTasks,
  mergeAndSlice,
  isProjectMember,
};
