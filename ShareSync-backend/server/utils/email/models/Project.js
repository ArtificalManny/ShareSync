// server/utils/email/models/Project.js
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },

    // membership structure in your app may differ; keep ids for checks
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    // NEW
    discoverable: { type: Boolean, default: false, index: true },
    chatEnabled: { type: Boolean, default: true, index: true }, //NEW
    lastActivityAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false, timestamps: true }
);

// Text index
ProjectSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
