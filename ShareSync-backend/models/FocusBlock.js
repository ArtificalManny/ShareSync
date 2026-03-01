// backend/models/FocusBlock.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.3: Focus Block persistence model
// Tracks deep work sessions for team visibility + analytics
// STANDALONE collection — zero changes to existing models
// ═══════════════════════════════════════════════════════════════════════════════

const mongoose = require('mongoose');

const focusBlockSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  taskName: {
    type: String,
    default: '',
    maxlength: 200
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  label: {
    type: String,
    default: '',
    maxlength: 100
  },
  duration: {
    type: Number, // planned duration in minutes
    required: true,
    min: 1,
    max: 480
  },
  actualDuration: {
    type: Number, // actual duration in minutes (calculated on stop)
    default: null
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  xpMultiplier: {
    type: Number,
    default: 2
  },
  xpAwarded: {
    type: Number,
    default: 0
  },
  completedTasks: [{
    taskId: mongoose.Schema.Types.ObjectId,
    title: String,
    completedAt: Date
  }]
}, {
  timestamps: true
});

// ── Indexes ──────────────────────────────────────────────────────────────
// Fast lookup: "does this user have an active block?"
focusBlockSchema.index({ userId: 1, status: 1 });
// Team query: "who on this project is in focus?"
focusBlockSchema.index({ projectId: 1, status: 1 });
// History query
focusBlockSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('FocusBlock', focusBlockSchema);
