// server/utils/email/controllers/posts/listPosts.js
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');

module.exports = async function listPosts(req, res, next) {
  try {
    const projectId = req.params.projectId || req.query.projectId;
    if (!projectId) return res.status(400).json({ error: 'projectId required' });

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Post.find({ projectId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments({ projectId }),
    ]);

    // Fetch comment counts in one pass
    const postIds = items.map(p => p._id);
    const counts = await Comment.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]);

    const countMap = new Map(counts.map(c => [String(c._id), c.count]));

    res.json({
      page,
      limit,
      total,
      items: items.map(p => serializePost(p, countMap.get(String(p._id)) || 0)),
    });
  } catch (err) {
    next(err);
  }
};

function serializePost(p, commentCount) {
  return {
    id: String(p._id),
    projectId: String(p.projectId),
    authorId: String(p.authorId),
    body: p.body || '',
    attachments: p.attachments || [],
    reactions: mapToObject(p.reactions),
    createdAt: p.createdAt,
    editedAt: p.editedAt || null,
    comments: { count: commentCount },
  };
}
function mapToObject(map) {
  if (!map) return undefined;
  const out = {};
  for (const [k, v] of map.entries()) out[k] = v.map(String);
  return out;
}
