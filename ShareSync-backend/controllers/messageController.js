// backend/controllers/messageController.js - WITH SOCKET.IO & NOTIFICATIONS
const Message = require('../models/Message');
const Project = require('../models/Project');

// Safely attempt to load the Notification model
let Notification;
try {
  Notification = require('../models/Notification');
} catch (e) {
  console.warn('⚠️ Notification model not found at ../models/Notification. Real-time DB notifications will be skipped.');
}

// Helper to get socket.io instance
const getIO = (req) => req.app.get('io');

// @desc    Get all messages for a project
// @route   GET /api/projects/:projectId/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50, type, resolved } = req.query;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members?.some(m => m.user.toString() === req.user.id);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { 
      project: projectId,
      deleted: false,
      parentMessage: null
    };

    if (type) query.type = type;
    if (resolved !== undefined) query.resolved = resolved === 'true';

    const messages = await Message.find(query)
      .populate('author', 'firstName lastName profilePicture')
      .populate('resolvedBy', 'firstName lastName')
      .populate('reactions.user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

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

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members?.some(m => m.user.toString() === req.user.id);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = await Message.create({
      project: projectId,
      author: req.user.id,
      content: content.trim(),
      type
    });

    await message.populate('author', 'firstName lastName profilePicture');

    // ⭐ EMIT SOCKET EVENT TO PROJECT ROOM
    const io = getIO(req);
    if (io) {
      io.to(`project:${projectId}`).emit('message:new', message);
    }

    // ⭐ FIX: CREATE NOTIFICATIONS AND ALERT USERS PERSONALLY
    if (Notification && io) {
      try {
        const projectMembers = project.members ? project.members.map(m => m.user.toString()) : [];
        const allParticipants = [project.owner.toString(), ...projectMembers];
        const recipients = [...new Set(allParticipants)].filter(id => id !== req.user.id);

        for (const recipientId of recipients) {
          const notification = await Notification.create({
            recipient: recipientId,
            sender: req.user.id,
            type: 'message',
            title: `New message in ${project.title}`,
            message: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            relatedItemId: message._id,
            onModel: 'Message',
            isRead: false
          });
          
          // Emit to the user's personal socket room so their top-bar red badge updates instantly
          io.to(recipientId.toString()).emit('new_notification', notification);
          // Also emit a personal direct message event just in case the frontend is listening for it
          io.to(recipientId.toString()).emit('new_message', message);
        }
      } catch (notifErr) {
        console.error('[createMessage] Failed to broadcast notifications:', notifErr);
      }
    }

    res.status(201).json(message);

  } catch (error) {
    console.error('[createMessage] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a message
// @route   PUT /api/projects/:projectId/messages/:messageId
// @access  Private
exports.updateMessage = async (req, res) => {
  try {
    const { projectId, messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the author can edit this message' });
    }

    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('author', 'firstName lastName profilePicture');

    // ⭐ EMIT SOCKET EVENT
    const io = getIO(req);
    if (io) {
      io.to(`project:${projectId}`).emit('message:updated', message);
    }

    res.json(message);

  } catch (error) {
    console.error('[updateMessage] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/projects/:projectId/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const { projectId, messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const project = await Project.findById(projectId);
    const isAuthor = message.author.toString() === req.user.id;
    const isOwner = project.owner.toString() === req.user.id;

    if (!isAuthor && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    message.softDelete();
    await message.save();

    // ⭐ EMIT SOCKET EVENT
    const io = getIO(req);
    if (io) {
      io.to(`project:${projectId}`).emit('message:deleted', { messageId });
    }

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
    const { projectId, messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const added = message.addReaction(emoji, req.user.id);
    if (!added) {
      return res.status(400).json({ message: 'You already reacted with this emoji' });
    }

    await message.save();
    await message.populate('reactions.user', 'firstName lastName');

    // ⭐ EMIT SOCKET EVENT
    const io = getIO(req);
    if (io) {
      const reaction = message.reactions[message.reactions.length - 1];
      io.to(`project:${projectId}`).emit('reaction:added', {
        messageId,
        reaction: {
          emoji: reaction.emoji,
          userId: reaction.user._id
        }
      });
    }

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
    const { projectId, messageId, emoji } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const removed = message.removeReaction(emoji, req.user.id);
    if (!removed) {
      return res.status(400).json({ message: 'Reaction not found' });
    }

    await message.save();
    await message.populate('reactions.user', 'firstName lastName');

    // ⭐ EMIT SOCKET EVENT
    const io = getIO(req);
    if (io) {
      io.to(`project:${projectId}`).emit('reaction:removed', {
        messageId,
        emoji,
        userId: req.user.id
      });
    }

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
    const { projectId, messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.type !== 'question') {
      return res.status(400).json({ message: 'Only questions can be resolved' });
    }

    message.markResolved(req.user.id);
    await message.save();
    await message.populate('resolvedBy', 'firstName lastName');

    // ⭐ EMIT SOCKET EVENT
    const io = getIO(req);
    if (io) {
      io.to(`project:${projectId}`).emit('message:resolved', {
        messageId,
        resolvedBy: {
          _id: message.resolvedBy._id,
          firstName: message.resolvedBy.firstName,
          lastName: message.resolvedBy.lastName
        },
        resolvedAt: message.resolvedAt
      });
    }

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
    const { projectId, messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.markUnresolved();
    await message.save();

    // ⭐ EMIT SOCKET EVENT
    const io = getIO(req);
    if (io) {
      io.to(`project:${projectId}`).emit('message:unresolved', { messageId });
    }

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

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

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
