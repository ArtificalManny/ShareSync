// server/utils/email/controllers/toggleReaction.js
const mongoose = require('mongoose');
const Post = require('../models/Post');
const telemetry = require('../services/telemetry.service');
const events = require('../system/events');

module.exports = async function toggleReaction(req, res, next) {
  try {
    const { postId } = req.params;
    const userId = req.user?.id || req.body.userId;
    const { emoji } = req.body || {};

    if (!postId) return res.status(400).json({ error: 'postId required' });
    if (!userId) return res.status(401).json({ error: 'user authentication required' });
    if (!emoji || typeof emoji !== 'string') return res.status(400).json({ error: 'emoji required' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const key = String(emoji);
    const uid = new mongoose.Types.ObjectId(userId);

    let action = 'added';
    const arr = (post.reactions?.get(key)) || [];
    const exists = arr.some(id => String(id) === String(uid));

    if (exists) {
      // remove
      const nextArr = arr.filter(id => String(id) !== String(uid));
      if (nextArr.length === 0) {
        post.reactions?.delete?.(key);
        if (post.reactions && post.reactions.size === 0) post.reactions = undefined;
      } else {
        if (!post.reactions) post.reactions = new Map();
        post.reactions.set(key, nextArr);
      }
      action = 'removed';
    } else {
      // add
      if (!post.reactions) post.reactions = new Map();
      post.reactions.set(key, [...arr, uid]);
    }

    await post.save();

    telemetry.track('post_reaction_toggled', {
      postId: String(post._id),
      userId: String(userId),
      emoji: key,
      action,
    });

    events.emit('post_reaction_toggled', {
      postId: String(post._id),
      projectId: String(post.projectId),
      userId: String(userId),
      emoji: key,
      action,
    });

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
