// models/PulseCheck.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.4: Pulse Check Schema
// ═══════════════════════════════════════════════════════════════════════════════
//
// Stores daily 30-second standup responses.
// One document per user per day.
//
// ═══════════════════════════════════════════════════════════════════════════════

const mongoose = require('mongoose');

const PulseCheckSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Date of the pulse (normalized to start of day for easy querying)
    date: {
      type: Date,
      required: true,
      index: true,
    },

    // Energy level: 1-5
    // 1 = Frustrated (😤)
    // 2 = Low (😔)
    // 3 = Okay (😐)
    // 4 = Good (😊)
    // 5 = On Fire (🔥)
    energy: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Optional: which task is the #1 focus
    focusTaskId: {
      type: String,
      default: null,
    },

    // Optional: free-text focus description (if no task ID)
    focusTaskText: {
      type: String,
      default: '',
      maxlength: 200,
    },

    // Blocker info
    blocker: {
      hasBlocker: { type: Boolean, default: false },
      description: { type: String, default: '', maxlength: 500 },
    },

    // XP awarded for this pulse
    xpAwarded: {
      type: Number,
      default: 15,
    },

    // Project context (optional, for team queries)
    projectId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// ─────────────────────────────────────────────────────────────────────────
// COMPOUND INDEXES
// ─────────────────────────────────────────────────────────────────────────

// Unique per user per day (prevents duplicate submissions)
PulseCheckSchema.index({ userId: 1, date: 1 }, { unique: true });

// Team queries: all pulses for a project in a date range
PulseCheckSchema.index({ projectId: 1, date: -1 });

// Burnout detection: last N pulses for a user
PulseCheckSchema.index({ userId: 1, createdAt: -1 });

const PulseCheck = mongoose.model('PulseCheck', PulseCheckSchema);

module.exports = PulseCheck;
