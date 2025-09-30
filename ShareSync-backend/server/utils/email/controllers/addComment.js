// server/utils/email/controllers/addComment.js
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const telemetry = require('../services/telemetry.service');
const events = require('../system/events');
const { parseAndNotify } = require('../services/mentions/parseAndNotify');

module.exports = async function addComment(req, res, next) {
  try {
    const { postId } = req.params;
    const authorId = req.user?.id || req.body.authorId;
    const { text } = req.body || {};

    if (!postId) return res.status(400).json({ error: 'postId required' });
    if (!authorId) return res.status(401).json({ error: 'author authentication required' });
    if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'text required' });
    if (text.length > 4000) return res.status(413).json({ error: 'comment too long' });

    const post = await Post.findById(postId).lean();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = await Comment.create({
      postId,
      projectId: post.projectId,
      authorId,
      text: text.trim(),
    });

    telemetry.track('comment_created', {
      commentId: String(comment._id),
      postId: String(postId),
      projectId: String(post.projectId),
      authorId: String(authorId),
    });

    events.emit('comment_created', {
      commentId: String(comment._id),
      postId: String(postId),
      projectId: String(post.projectId),
      authorId: String(authorId),
    });

    // Parse @mentions and notify (non-blocking but awaited here for simplicity)
    await parseAndNotify({
      projectId: String(post.projectId),
      authorId: String(authorId),
      postId: String(postId),
      commentId: String(comment._id),
      text: text.trim(),
    });

    res.status(201).json(serializeComment(comment));
  } catch (err) {
    next(err);
  }
};

function serializeComment(c) {
  return {
    id: String(c._id),
    postId: String(c.postId),
    projectId: String(c.projectId),
    authorId: String(c.authorId),
    text: c.text,
    createdAt: c.createdAt,
    editedAt: c.editedAt || null,
  };
}
