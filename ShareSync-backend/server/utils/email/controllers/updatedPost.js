// server/utils/email/controllers/posts/updatePost.js
const Post = require('../../models/Post');
const telemetry = require('../../services/telemetry.service');
const events = require('../../system/events');

module.exports = async function updatePost(req, res, next) {
  try {
    const { postId } = req.params;
    const editorId = req.user?.id || req.body.authorId;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Simple auth: only author can edit (adjust to your roles later)
    if (editorId && String(post.authorId) !== String(editorId)) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    const { body, attachments } = req.body || {};
    let changed = false;

    if (typeof body === 'string' && body !== post.body) {
      if (body.length > 5000) return res.status(413).json({ error: 'body too long' });
      post.body = body;
      post.editedAt = new Date();
      changed = true;
    }

    if (Array.isArray(attachments)) {
      post.attachments = attachments;
      if (!changed) post.editedAt = new Date();
      changed = true;
    }

    if (!changed) return res.json(serializePost(post)); // nothing to do

    await post.save();

    telemetry.track('post_updated', { postId: String(post._id), editorId: editorId ? String(editorId) : null });
    events.emit('post_updated', { postId: String(post._id) });

    res.json(serializePost(post));
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
    reactions: p.reactions ? Object.fromEntries(p.reactions) : undefined,
    createdAt: p.createdAt,
    editedAt: p.editedAt || null,
  };
}
