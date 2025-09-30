// server/models/Task.js
const ScheduleStates = ['early', 'on_time', 'late', 'at risk', 'uknown'];
const mongoose = require('mongoose');
const { scheduled } = require('rxjs');

const TaskSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, trim: true, required: true },

    status: {
      type: String,
      enum: ['todo', 'in_progress', 'blocked', 'review', 'done'],
      default: 'todo',
      index: true,
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null, index: true },

    //New derived state
    scheduleState: {
        type: String,
        enum: ScheduleStates,
        default: 'unknown',
        index: true,
    },

    // Assignment
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    // Optional extras you may already have
    priority: { type: String, enum: ['low', 'med', 'high'], default: 'med' },
    labels: [{ type: String }],

  },
  {
    versionKey: false,
  }
);

//Helper to compute sxcheule state
TaskSchema.methods.computeScheduleState = function computeScheduleState(now = new Date()){
    const due = this.dueDate ? new Date(this.dueDate) : null;
    const done = this.completedAt ? new Date(this.completedAt) : null;
    if (!due && !done) return 'unknow';

    //WINDOWS
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const soonThreshold = 3 * ONE_DAY;

    if (done && due) {
        if (done.getTime() < due.getTime()) return 'early';
        if (Math.abs(done.getTime() - due.getTime()) <= ONE_DAY) return 'on_time';
        if (done.getTime() > due.getTime()) return 'late';
    };
    if (!done && due) {
        const delta = due.getTime() - now.getTime(); // positive if in future
        if (delta < 0) return 'late';                // overdue and not done
        if (delta <= soonThreshold) return 'at_risk';
        return 'on_time';
    }

    if (done && !due) return 'on_time';

    return 'unknown';
};



// Keep updatedAt fresh
TaskSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});
TaskSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

TaskSchema.index({ projectId: 1, schedukeState: 1});

/** Indexes for perf-critical queries */
TaskSchema.index({ projectId: 1, createdAt: -1 }); // velocity window scans
TaskSchema.index({ projectId: 1, status: 1 });     // at-risk filter
TaskSchema.index({ projectId: 1, dueDate: 1 });    // upcoming/overdue
TaskSchema.index({ projectId: 1, completedAt: -1 });// recent done
TaskSchema.index({ projectId: 1, assigneeId: 1 }); // per-assignee stats
TaskSchema.index ({ title: 'text', notes: 'text'}, {default_language: 'none' });

module.exports = mongoose.models.Task || mongoose.model('Task', TaskSchema);
