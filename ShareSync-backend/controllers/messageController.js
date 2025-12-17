// backend/controllers/messageController.js
const Message = require('../models/Message');
const Project = require('../models/Project');

// @desc    Get all messages for a project
// @route   GET /api/projects/:projectId/messages
// @access  Private (must be project member)
exports.getMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50, type, resolved } = req.query;

    // Verify user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is project owner or member
    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members?.some(m => m.user.toString() === req.user.id);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build query
    const query = { 
      project: projectId,
      deleted: false,
      parentMessage: null // Only get top-level messages (not replies)
    };

    if (type) query.type = type;
    if (resolved !== undefined) query.resolved = resolved === 'true';

    // Execute query with pagination
    const messages = await Message.find(query)
      .populate('author', 'firstName lastName profilePicture')
      .populate('resolvedBy', 'firstName lastName')
      .populate('reactions.user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count
    const count = await Message.countDocuments(query);

    res.json({
      messages,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalMessages: count
    });

  } catch (error) {
    console.error('[getMessages] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new message
// @route   POST /api/projects/:projectId/messages
// @access  Private
exports.createMessage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content, type = 'update' } = req.body;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members?.some(m => m.user.toString() === req.user.id);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create message
    const message = await Message.create({
      project: projectId,
      author: req.user.id,
      content: content.trim(),
      type
    });

    // Populate author info
    await message.populate('author', 'firstName lastName profilePicture');

    res.status(201).json(message);

  } catch (error) {
    console.error('[createMessage] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a message
// @route   PUT /api/projects/:projectId/messages/:messageId
// @access  Private (author only)
exports.updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is author
    if (message.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the author can edit this message' });
    }

    // Update message
    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('author', 'firstName lastName profilePicture');

    res.json(message);

  } catch (error) {
    console.error('[updateMessage] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/projects/:projectId/messages/:messageId
// @access  Private (author or project owner)
exports.deleteMessage = async (req, res) => {
  try {
    const { projectId, messageId } = req.params;

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is author or project owner
    const project = await Project.findById(projectId);
    const isAuthor = message.author.toString() === req.user.id;
    const isOwner = project.owner.toString() === req.user.id;

    if (!isAuthor && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Soft delete
    message.softDelete();
    await message.save();

    res.json({ message: 'Message deleted successfully' });

  } catch (error) {
    console.error('[deleteMessage] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add reaction to message
// @route   POST /api/projects/:projectId/messages/:messageId/reactions
// @access  Private
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    // Validation
    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Add reaction
    const added = message.addReaction(emoji, req.user.id);
    if (!added) {
      return res.status(400).json({ message: 'You already reacted with this emoji' });
    }

    await message.save();
    await message.populate('reactions.user', 'firstName lastName');

    res.json(message);

  } catch (error) {
    console.error('[addReaction] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove reaction from message
// @route   DELETE /api/projects/:projectId/messages/:messageId/reactions/:emoji
// @access  Private
exports.removeReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.params;

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Remove reaction
    const removed = message.removeReaction(emoji, req.user.id);
    if (!removed) {
      return res.status(400).json({ message: 'Reaction not found' });
    }

    await message.save();
    await message.populate('reactions.user', 'firstName lastName');

    res.json(message);

  } catch (error) {
    console.error('[removeReaction] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark message as resolved
// @route   POST /api/projects/:projectId/messages/:messageId/resolve
// @access  Private
exports.resolveMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if it's a question
    if (message.type !== 'question') {
      return res.status(400).json({ message: 'Only questions can be resolved' });
    }

    // Mark as resolved
    message.markResolved(req.user.id);
    await message.save();
    await message.populate('resolvedBy', 'firstName lastName');

    res.json(message);

  } catch (error) {
    console.error('[resolveMessage] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark message as unresolved
// @route   DELETE /api/projects/:projectId/messages/:messageId/resolve
// @access  Private
exports.unresolveMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Mark as unresolved
    message.markUnresolved();
    await message.save();

    res.json(message);

  } catch (error) {
    console.error('[unresolveMessage] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get unread message count
// @route   GET /api/projects/:projectId/messages/unread
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find messages where user hasn't read
    const count = await Message.countDocuments({
      project: projectId,
      deleted: false,
      'readBy.user': { $ne: req.user.id }
    });

    res.json({ unreadCount: count });

  } catch (error) {
    console.error('[getUnreadCount] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark message as read
// @route   POST /api/projects/:projectId/messages/:messageId/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if already read
    const alreadyRead = message.readBy.some(
      r => r.user.toString() === req.user.id
    );

    if (!alreadyRead) {
      message.readBy.push({ user: req.user.id });
      await message.save();
    }

    res.json({ message: 'Marked as read' });

  } catch (error) {
    console.error('[markAsRead] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
