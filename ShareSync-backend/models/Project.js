// backend/models/Project.js - ENHANCED WITH TASKS & SHIPS
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date
  },
  effort: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  estimatedTime: {
    type: Number // minutes
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const shipSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  xpAwarded: {
    type: Number,
    default: 50
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const deadlineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  urgent: {
    type: Boolean,
    default: false
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Completed', 'Archived'],
    default: 'Active'
  },
  privacy: {
    type: String,
    enum: ['private', 'public'],
    default: 'private'
  },
  
  // Members with roles
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      canInvite: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canEditSettings: { type: Boolean, default: false }
    }
  }],
  
  // Tasks
  tasks: [taskSchema],
  
  // Ships (activity log)
  ships: [shipSchema],
  
  // Deadlines
  deadlines: [deadlineSchema],
  
  // Progress tracking
  progress: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    percentComplete: { type: Number, default: 0 }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update progress when tasks change
projectSchema.methods.updateProgress = function() {
  const totalTasks = this.tasks.length;
  const completedTasks = this.tasks.filter(t => t.completed).length;
  const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  this.progress = {
    totalTasks,
    completedTasks,
    percentComplete
  };
};

// Add task
projectSchema.methods.addTask = function(taskData) {
  this.tasks.push(taskData);
  this.updateProgress();
  return this.tasks[this.tasks.length - 1];
};

// Update task
projectSchema.methods.updateTask = function(taskId, updates) {
  const task = this.tasks.id(taskId);
  if (!task) throw new Error('Task not found');
  
  Object.assign(task, updates);
  
  // If marking as completed
  if (updates.completed && !task.completedAt) {
    task.completedAt = new Date();
  }
  
  this.updateProgress();
  return task;
};

// Delete task
projectSchema.methods.deleteTask = function(taskId) {
  const taskIndex = this.tasks.findIndex(t => t._id.toString() === taskId.toString());
  if (taskIndex === -1) throw new Error('Task not found');
  
  this.tasks.splice(taskIndex, 1);
  this.updateProgress();
  return true;
};

// Add ship
projectSchema.methods.addShip = function(shipData) {
  this.ships.unshift(shipData); // Add to beginning (most recent first)
  return this.ships[0];
};

module.exports = mongoose.model('Project', projectSchema);
