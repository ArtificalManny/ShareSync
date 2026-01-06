// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Project association
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },

  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Message content
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },

  // Message type
  type: {
    type: String,
    enum: ['update', 'question', 'decision', 'idea', 'kudos'],
    default: 'update',
    required: true
  },

  // Reactions
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Resolution (for questions)
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },

  // Threading (for future phases)
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  replyCount: {
    type: Number,
    default: 0
  },

  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Metadata
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }

}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for performance
messageSchema.index({ project: 1, createdAt: -1 }); // For fetching messages by project
messageSchema.index({ author: 1 }); // For author queries
messageSchema.index({ type: 1 }); // For filtering by type
messageSchema.index({ resolved: 1 }); // For filtering resolved questions

// Virtual for reply count (can be calculated from replies array in future)
messageSchema.virtual('replies', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'parentMessage'
});

// Method to add reaction
messageSchema.methods.addReaction = function(emoji, userId) {
  // Check if user already reacted with this emoji
  const existingReaction = this.reactions.find(
    r => r.emoji === emoji && r.user.toString() === userId.toString()
  );

  if (existingReaction) {
    return false; // Already reacted
  }

  this.reactions.push({ emoji, user: userId });
  return true;
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(emoji, userId) {
  const index = this.reactions.findIndex(
    r => r.emoji === emoji && r.user.toString() === userId.toString()
  );

  if (index === -1) {
    return false; // Reaction not found
  }

  this.reactions.splice(index, 1);
  return true;
};

// Method to mark as resolved
messageSchema.methods.markResolved = function(userId) {
  if (this.type !== 'question') {
    throw new Error('Only questions can be resolved');
  }

  this.resolved = true;
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
};

// Method to mark as unresolved
messageSchema.methods.markUnresolved = function() {
  this.resolved = false;
  this.resolvedBy = null;
  this.resolvedAt = null;
};

// Soft delete
messageSchema.methods.softDelete = function() {
  this.deleted = true;
  this.deletedAt = new Date();
};

module.exports = mongoose.model('Message', messageSchema);