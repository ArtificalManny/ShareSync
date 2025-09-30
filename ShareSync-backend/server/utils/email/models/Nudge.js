// server/models/Nudge.js
const mongoose = require('mongoose');

const CtaSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    url: { type: String, trim: true },       // deep link (optional)
    action: { type: String, trim: true },    // client-side action key (optional)
  },
  { _id: false }
);

const NudgeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true, default: null },
    type: { type: String, trim: true, default: 'mentor' }, // e.g., 'mentor', 'reminder'
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    cta: { type: CtaSchema, default: undefined },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false,
  }
);

// Useful compound index for listing newest per project/user
NudgeSchema.index({ projectId: 1, createdAt: -1 });
NudgeSchema.index({ userId: 1, createdAt: -1 });

// Mark one as read
NudgeSchema.statics.markRead = async function (id) {
  return this.findByIdAndUpdate(id, { $set: { readAt: new Date() } }, { new: true });
};

module.exports = mongoose.models.Nudge || mongoose.model('Nudge', NudgeSchema);
