// server/utils/email/controllers/posts/getPost.js
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');

module.exports = async function getPost(req, res, next) {
  try {
    const { postId } = req.params;
    if (!postId) return res.status(400).json({ error: 'postId required' });

    const post = await Post.findById(postId).lean();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const limit = Math.min(Math.max(parseInt(req.query.commentLimit || '20', 10), 0), 100);
    const comments = limit
      ? await Comment.find({ postId }).sort({ createdAt: 1 }).limit(limit).lean()
      : [];

    res.json({
      post: serializePost(post),
      comments: comments.map(c => serializeComment(c)),
    });
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
function mapToObject(map) {
  if (!map) return undefined;
  const out = {};
  for (const [k, v] of map.entries()) out[k] = v.map(String);
  return out;
}
