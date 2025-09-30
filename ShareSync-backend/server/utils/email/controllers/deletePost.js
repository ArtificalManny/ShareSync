// server/utils/email/controllers/posts/deletePost.js
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const telemetry = require('../../services/telemetry.service');
const events = require('../../system/events');

module.exports = async function deletePost(req, res, next) {
  try {
    const { postId } = req.params;
    const requesterId = req.user?.id || null;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Auth: author can delete; add admin/mod roles later
    if (requesterId && String(post.authorId) !== String(requesterId)) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    await Post.deleteOne({ _id: postId });
    await Comment.deleteMany({ postId });

    telemetry.track('post_deleted', { postId: String(postId), requesterId: requesterId ? String(requesterId) : null });
    events.emit('post_deleted', { postId: String(postId), projectId: String(post.projectId) });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
