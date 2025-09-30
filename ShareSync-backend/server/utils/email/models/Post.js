// server/utils/email/models/Post.js
const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema(
  {
    id: { type: String, trim: true },           // client-side uid
    url: { type: String, trim: true, required: true },
    name: { type: String, trim: true },
    mime: { type: String, trim: true },
    size: { type: Number },                      // bytes
    width: { type: Number },                     // images/videos (optional)
    height: { type: Number },
    kind: { type: String, trim: true },          // 'image' | 'video' | 'file' | ...
  },
  { _id: false }
);

/**
 * Reactions structure:
 * reactions: {
 *   "👍": [userId1, userId2],
 *   "🔥": [userId3]
 * }
 *
 * Stored as a Map<String, Array<ObjectId>> for efficient $push/$pull.
 */
const ReactionsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },                          // emoji
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // unique per emoji enforced in code
  },
  { _id: false }
);

const PostSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    authorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    body: { type: String, trim: true, default: '' },
    attachments: { type: [AttachmentSchema], default: [] },

    reactions: {
      type: Map,
      of: [ { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ],
      default: undefined, // keep field absent until first reaction
    },

    createdAt: { type: Date, default: Date.now, index: true },
    editedAt:  { type: Date, default: null },
  },
  { versionKey: false }
);

// Text index for simple search in project scope
PostSchema.index({ projectId: 1, createdAt: -1 });
PostSchema.index({ body: 'text' }, { weights: { body: 5 } });

// Edit helper
PostSchema.methods.editBody = async function editBody(newBody) {
  this.body = newBody ?? '';
  this.editedAt = new Date();
  return this.save();
};

// Reaction helpers
PostSchema.methods.addReaction = async function addReaction(emoji, userId) {
  if (!emoji || !userId) return this;
  const key = String(emoji);
  const uid = new mongoose.Types.ObjectId(userId);

  const arr = (this.reactions?.get(key)) || [];
  const exists = arr.some(id => String(id) === String(uid));
  if (!exists) {
    arr.push(uid);
    if (!this.reactions) this.reactions = new Map();
    this.reactions.set(key, arr);
    await this.save();
  }
  return this;
};

PostSchema.methods.removeReaction = async function removeReaction(emoji, userId) {
  if (!emoji || !userId || !this.reactions) return this;
  const key = String(emoji);
  const uid = String(userId);

  const arr = this.reactions.get(key);
  if (!arr) return this;

  const next = arr.filter(id => String(id) !== uid);
  if (next.length === 0) {
    this.reactions.delete(key);
    if (this.reactions.size === 0) this.reactions = undefined;
  } else {
    this.reactions.set(key, next);
  }
  await this.save();
  return this;
};

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);
