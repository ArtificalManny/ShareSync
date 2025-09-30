// server/utils/email/controllers/posts/createPost.js
const Post = require('../../models/Post');
const Comment = require('../../models/Comment'); // not used here but handy for future
const events = require('../../system/events');
const telemetry = require('../../services/telemetry.service');
const feed = require('../../services/feed.service');

module.exports = async function createPost(req, res, next) {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const authorId = req.user?.id || req.body.authorId; // prefer auth middleware
    const { body = '', attachments = [] } = req.body || {};

    if (!projectId) return res.status(400).json({ error: 'projectId required' });
    if (!authorId) return res.status(400).json({ error: 'authorId required' });
    if (typeof body !== 'string') return res.status(400).json({ error: 'body must be a string' });

    // Basic size guard
    if (body.length > 5000) return res.status(413).json({ error: 'body too long' });

    const post = await Post.create({
      projectId,
      authorId,
      body: body.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    // Emit side effects
    telemetry.track('post_created', { projectId: String(projectId), authorId: String(authorId), postId: String(post._id) });
    feed.publish('post_created', { projectId: String(projectId), postId: String(post._id) });
    events.emit('post_created', { projectId: String(projectId), authorId: String(authorId), postId: String(post._id) });

    res.status(201).json(serializePost(post));
  } catch (err) {
    next(err);
  }
};

function serializePost(p) {
  return {
    id: String(p._id),
    projectId: String(p.projectId),
    authorId: String(p.authorId),
    body: p.body || '',
    attachments: p.attachments || [],
    reactions: mapToObject(p.reactions),
    createdAt: p.createdAt,
    editedAt: p.editedAt || null,
  };
}

function mapToObject(map) {
  if (!map) return undefined;
  const out = {};
  for (const [k, v] of map.entries()) out[k] = v.map(String);
  return out;
}
