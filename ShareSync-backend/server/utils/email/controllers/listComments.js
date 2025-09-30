// server/utils/email/controllers/listComments.js
const Comment = require('../models/Comment');

module.exports = async function listComments(req, res, next) {
  try {
    const { postId } = req.params;
    if (!postId) return res.status(400).json({ error: 'postId required' });

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Comment.find({ postId }).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
      Comment.countDocuments({ postId }),
    ]);

    res.json({
      page,
      limit,
      total,
      items: items.map(serializeComment),
    });
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
