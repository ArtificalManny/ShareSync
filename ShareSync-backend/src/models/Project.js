const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema(
  {
    // Optional userId so middleware like ensureProjectEditor can recognize members
    userId: { type: String }, // non-breaking: old docs without this still work
    email: String,
    role: String,
  },
  { _id: false }
);

const AnnouncementSchema = new mongoose.Schema(
  {
    id: Number,
    content: String,
    media: String,
    likes: { type: Number, default: 0 },
    comments: [{ user: String, text: String }],
    user: String,
  },
  { _id: false }
);

const LegacyTaskSchema = new mongoose.Schema(
  {
    id: Number,
    title: String,
    assignee: String,
    dueDate: Date,
    status: String,
    comments: [{ user: String, text: String }],
    user: String,
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    category: String,
    status: String,
    privacy: String,

    userId: String,

    members: [MemberSchema],

    sharedWith: [String],

    announcements: [AnnouncementSchema],

    // Legacy embedded tasks array (kept for backward compatibility with old UI)
    tasks: [LegacyTaskSchema],

    /**
     * ✅ Server-truth “latest activity” timestamp
     * Used by Home stories/unread and can be updated whenever an activity occurs.
     */
    lastActivityAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // adds createdAt/updatedAt
  }
);

// (Optional) ensure the field exists on new docs
projectSchema.pre('save', function (next) {
  if (!this.lastActivityAt) this.lastActivityAt = new Date();
  next();
});

module.exports = mongoose.model('Project', projectSchema);
