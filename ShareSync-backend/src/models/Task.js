// src/models/Task.js
const mongoose = require('mongoose');

const { Schema, Types } = mongoose;

const TaskSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'doing', 'in_progress', 'done', 'blocked'],
      default: 'todo',
      index: true,
    },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
    labels: { type: [String], default: [] },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// helpful compound index for paging newest-first per project
TaskSchema.index({ projectId: 1, _id: -1 });

module.exports = mongoose.model('Task', TaskSchema);
