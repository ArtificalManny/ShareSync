// server/utils/email/models/Conversation.js
const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['dm', 'project'], required: true, index: true },
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },

    lastAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false, timestamps: true } // adds createdAt, updatedAt
);

// Helpful compound indexes (per spec)
ConversationSchema.index({ memberIds: 1, lastAt: -1 });
ConversationSchema.index({ kind: 1, projectId: 1 });

// Ensure DM uniqueness for the same exact set of members (order-agnostic)
// (enforced in code during create; you can add a unique partial index if you prefer)
module.exports = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
