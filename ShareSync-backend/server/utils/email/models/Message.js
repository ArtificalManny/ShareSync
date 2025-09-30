// server/utils/email/models/Message.js
const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema(
  {
    id: { type: String, trim: true },
    name: { type: String, trim: true },
    size: { type: Number },
    type: { type: String, trim: true }, // mime
    url:  { type: String, trim: true }, // optional
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    convoId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    text: { type: String, trim: true, default: '' },
    attachments: { type: [AttachmentSchema], default: [] },

    // Map<emoji, ObjectId[]>
    reactions: {
      type: Map,
      of: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: undefined,
    },
  },
  { versionKey: false, timestamps: { createdAt: true, updatedAt: false } }
);

// Index for timeline
MessageSchema.index({ convoId: 1, createdAt: -1 });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
