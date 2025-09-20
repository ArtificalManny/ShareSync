const mongoose = require('mongoose');

const STATUSES = ['pending', 'approved', 'blocked'];
const VIRUS_STATES = ['clean', 'infected', null];

const FileSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true, required: true },
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    name: { type: String, trim: true },
    key:  { type: String, required: true, index: true }, // storage key
    url:  { type: String },                               // public preview/download

    type: { type: String, default: 'application/octet-stream' }, // MIME
    size: { type: Number, default: 0 },

    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    virus:  { type: String, enum: VIRUS_STATES, default: null },

    moderation: {
      reason: { type: String },
      tags:   [{ type: String }],
    },
  },
  { timestamps: true }
);

// Optional: prevent duplicate links per project/key (safe with parallel creates)
FileSchema.index({ projectId: 1, key: 1 }, { unique: false, sparse: true });

// Helpful virtuals / transforms
FileSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id; // frontend convenience
    delete ret._id;
    return ret;
  }
});
FileSchema.set('toObject', { virtuals: true, versionKey: false });

module.exports = mongoose.model('File', FileSchema);
