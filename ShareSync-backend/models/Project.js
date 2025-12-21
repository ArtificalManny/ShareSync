// backend/models/Project.js - ENHANCED WITH TASKS, SHIPS & ADVANCED MEMBERS
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

// ============================================
// ✅ ENHANCED MEMBER SCHEMA
// ============================================
const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'viewer'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive'],
    default: 'active'
  },
  // Granular permissions
  permissions: {
    canViewTasks: { type: Boolean, default: true },
    canCreateTasks: { type: Boolean, default: true },
    canEditTasks: { type: Boolean, default: true },
    canDeleteTasks: { type: Boolean, default: false },
    canCompleteOwnTasks: { type: Boolean, default: true },
    canCompleteAnyTask: { type: Boolean, default: false },
    
    canShip: { type: Boolean, default: true },
    canViewShips: { type: Boolean, default: true },
    
    canInviteMembers: { type: Boolean, default: false },
    canRemoveMembers: { type: Boolean, default: false },
    canEditMemberRoles: { type: Boolean, default: false },
    
    canEditProject: { type: Boolean, default: false },
    canDeleteProject: { type: Boolean, default: false },
    canArchiveProject: { type: Boolean, default: false },
    
    canManageSettings: { type: Boolean, default: false },
  },
  // Activity tracking
  lastActive: {
    type: Date,
    default: Date.now
  },
  contributionStats: {
    tasksCreated: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    shipsCreated: { type: Number, default: 0 },
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
  
  // ✅ Enhanced members array
  members: [memberSchema],
  
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

// ============================================
// ✅ MEMBER MANAGEMENT METHODS
// ============================================

/**
 * Add member to project
 */
projectSchema.methods.addMember = function(userId, role = 'member', invitedBy) {
  // Check if user is already a member
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  if (existingMember) {
    throw new Error('User is already a member');
  }
  
  const permissions = this.getDefaultPermissions(role);
  
  this.members.push({
    user: userId,
    role,
    invitedBy,
    status: 'active',
    permissions,
    joinedAt: new Date(),
  });
  
  console.log(`👤 Added ${userId} as ${role} to project ${this.title}`);
  
  return this.members[this.members.length - 1];
};

/**
 * Remove member from project
 */
projectSchema.methods.removeMember = function(userId) {
  // Can't remove owner
  if (this.owner.toString() === userId.toString()) {
    throw new Error('Cannot remove project owner');
  }
  
  const memberIndex = this.members.findIndex(m => m.user.toString() === userId.toString());
  if (memberIndex === -1) {
    throw new Error('Member not found');
  }
  
  this.members.splice(memberIndex, 1);
  
  console.log(`👋 Removed ${userId} from project ${this.title}`);
  
  return true;
};

/**
 * Update member role
 */
projectSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) {
    throw new Error('Member not found');
  }
  
  // Can't change owner role
  if (member.role === 'owner') {
    throw new Error('Cannot change owner role');
  }
  
  member.role = newRole;
  member.permissions = this.getDefaultPermissions(newRole);
  
  console.log(`🔄 Updated ${userId} to ${newRole} in project ${this.title}`);
  
  return member;
};

/**
 * Update member permissions
 */
projectSchema.methods.updateMemberPermissions = function(userId, permissions) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) {
    throw new Error('Member not found');
  }
  
  Object.assign(member.permissions, permissions);
  
  return member;
};

/**
 * Get member
 */
projectSchema.methods.getMember = function(userId) {
  return this.members.find(m => m.user.toString() === userId.toString());
};

/**
 * Check if user is a member
 */
projectSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString()) || 
         this.owner.toString() === userId.toString();
};

/**
 * Check if user has permission
 */
projectSchema.methods.hasPermission = function(userId, permission) {
  // Owner has all permissions
  if (this.owner.toString() === userId.toString()) {
    return true;
  }
  
  const member = this.getMember(userId);
  if (!member) return false;
  
  return member.permissions[permission] === true;
};

/**
 * Get default permissions for role
 */
projectSchema.methods.getDefaultPermissions = function(role) {
  const permissionPresets = {
    owner: {
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canCompleteOwnTasks: true,
      canCompleteAnyTask: true,
      canShip: true,
      canViewShips: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canEditMemberRoles: true,
      canEditProject: true,
      canDeleteProject: true,
      canArchiveProject: true,
      canManageSettings: true,
    },
    admin: {
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canCompleteOwnTasks: true,
      canCompleteAnyTask: true,
      canShip: true,
      canViewShips: true,
      canInviteMembers: true,
      canRemoveMembers: false,
      canEditMemberRoles: false,
      canEditProject: true,
      canDeleteProject: false,
      canArchiveProject: false,
      canManageSettings: true,
    },
    member: {
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: false,
      canCompleteOwnTasks: true,
      canCompleteAnyTask: false,
      canShip: true,
      canViewShips: true,
      canInviteMembers: false,
      canRemoveMembers: false,
      canEditMemberRoles: false,
      canEditProject: false,
      canDeleteProject: false,
      canArchiveProject: false,
      canManageSettings: false,
    },
    viewer: {
      canViewTasks: true,
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canCompleteOwnTasks: false,
      canCompleteAnyTask: false,
      canShip: false,
      canViewShips: true,
      canInviteMembers: false,
      canRemoveMembers: false,
      canEditMemberRoles: false,
      canEditProject: false,
      canDeleteProject: false,
      canArchiveProject: false,
      canManageSettings: false,
    },
  };
  
  return permissionPresets[role] || permissionPresets.member;
};

/**
 * Update member activity
 */
projectSchema.methods.updateMemberActivity = function(userId, activity) {
  const member = this.getMember(userId);
  if (!member) return;
  
  member.lastActive = new Date();
  
  // Update contribution stats
  if (activity === 'task_created') {
    member.contributionStats.tasksCreated += 1;
  } else if (activity === 'task_completed') {
    member.contributionStats.tasksCompleted += 1;
  } else if (activity === 'ship_created') {
    member.contributionStats.shipsCreated += 1;
  }
};

// ============================================
// TASK METHODS (KEPT AS IS)
// ============================================

/**
 * Update progress when tasks change
 */
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

/**
 * Add task
 */
projectSchema.methods.addTask = function(taskData) {
  this.tasks.push(taskData);
  this.updateProgress();
  
  // Update member activity
  if (taskData.createdBy) {
    this.updateMemberActivity(taskData.createdBy, 'task_created');
  }
  
  return this.tasks[this.tasks.length - 1];
};

/**
 * Update task
 */
projectSchema.methods.updateTask = function(taskId, updates) {
  const task = this.tasks.id(taskId);
  if (!task) throw new Error('Task not found');
  
  Object.assign(task, updates);
  
  // If marking as completed
  if (updates.completed && !task.completedAt) {
    task.completedAt = new Date();
    
    // Update member activity
    if (updates.completedBy) {
      this.updateMemberActivity(updates.completedBy, 'task_completed');
    }
  }
  
  this.updateProgress();
  return task;
};

/**
 * Delete task
 */
projectSchema.methods.deleteTask = function(taskId) {
  const taskIndex = this.tasks.findIndex(t => t._id.toString() === taskId.toString());
  if (taskIndex === -1) throw new Error('Task not found');
  
  this.tasks.splice(taskIndex, 1);
  this.updateProgress();
  return true;
};

/**
 * Add ship
 */
projectSchema.methods.addShip = function(shipData) {
  this.ships.unshift(shipData); // Add to beginning (most recent first)
  
  // Update member activity
  if (shipData.author) {
    this.updateMemberActivity(shipData.author, 'ship_created');
  }
  
  return this.ships[0];
};

// ============================================
// INDEXES
// ============================================
projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
