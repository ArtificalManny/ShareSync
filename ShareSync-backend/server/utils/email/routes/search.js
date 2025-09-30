// server/utils/email/routes/search.js
const express = require('express');
const router = express.Router();

const { requireFlag } = require('../middleware/flags');
const { parseTokens } = require('../services/search/tokens');
const {
  toNumber,
  searchUsers,
  searchProjects,
  searchPosts,
  searchFiles,
  searchTasks,
  mergeAndSlice,
} = require('../services/search/search.service');

// If you have auth, ensure req.user.id is set; else use a stub for now.
function requireAuth(req, res, next) {
  // TODO: replace with your real auth middleware
  if (!req.user || !req.user.id) {
    // still allow calls but without private results
    req.user = { id: null };
  }
  next();
}

router.get(
  '/search',
  requireFlag('FEATURE_GLOBAL_SEARCH'),
  requireAuth,
  async (req, res, next) => {
    try {
      const q = String(req.query.q || '').trim();
      const typesQ = String(req.query.types || '').trim();
      const sort = (req.query.sort === 'recent') ? 'recent' : 'relevance';
      const page = toNumber(req.query.page, 1, 1, 1000);
      const limit = toNumber(req.query.limit, 20, 1, 100);
      const projectId = req.query.projectId || null;

      const parsed = parseTokens(q);
      const requestedTypes = new Set(typesQ.split(',').filter(Boolean));
      const tokenTypes = new Set(parsed.typeTokens);
      const effectiveTypes = (requestedTypes.size ? requestedTypes : (tokenTypes.size ? tokenTypes : new Set(['user','project','post','file','task'])));

      const ctx = { userId: req.user.id };

      const buckets = [];
      if (effectiveTypes.has('user')) {
        buckets.push(await searchUsers(parsed.qPlain, ctx, { sort, page, limit }));
      }
      if (effectiveTypes.has('project')) {
        buckets.push(await searchProjects(parsed.qPlain, ctx, { sort, page, limit }));
      }
      if (effectiveTypes.has('post')) {
        buckets.push(await searchPosts(parsed.qPlain, ctx, { sort, page, limit, projectId }));
      }
      if (effectiveTypes.has('file')) {
        buckets.push(await searchFiles(parsed.qPlain, ctx, { sort, page, limit, projectId }));
      }
      if (effectiveTypes.has('task')) {
        buckets.push(await searchTasks(parsed.qPlain, ctx, { sort, page, limit, projectId }));
      }

      const merged = mergeAndSlice(buckets, page, limit, sort);

      // Telemetry (server-side)
      try {
        const events = require('../system/events');
        events.emit('search_used', {
          userId: ctx.userId || null,
          q: parsed.qPlain,
          types: Array.from(effectiveTypes),
          sort,
          count: merged.total,
        });
      } catch {}

      res.json({ total: merged.total, page, limit, items: merged.items });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
