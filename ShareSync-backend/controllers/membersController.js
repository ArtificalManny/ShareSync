/**
 * membersController.js
 * Handles project member management
 */

const Project = require('../models/Project');
const User = require('../models/User');

// ============================================
// GET PROJECT MEMBERS
// ============================================

/**
 * Get all members of a project
 */
exports.getMembers = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('members.user', 'username email profilePicture')
      .populate('members.invitedBy', 'username')
      .populate('owner', 'username email profilePicture');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access
    if (!project.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Include owner in members list
    const ownerMember = {
      _id: project.owner._id,
      user: project.owner,
      role: 'owner',
      joinedAt: project.createdAt,
      status: 'active',
      permissions: project.getDefaultPermissions('owner'),
      contributionStats: {
        tasksCreated: 0,
        tasksCompleted: 0,
        shipsCreated: 0,
      }
    };
    
    const allMembers = [ownerMember, ...project.members];
    
    res.json({
      members: allMembers,
      total: allMembers.length,
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// ADD MEMBER
// ============================================

/**
 * Invite/add member to project
 */
exports.addMember = async (req, res) => {
  try {
    const { userId, email, username, role = 'member' } = req.body;
    
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permission
    if (!project.hasPermission(req.user.id, 'canInviteMembers')) {
      return res.status(403).json({ message: 'No permission to invite members' });
    }
    
    // Find user to add
    let userToAdd;
    if (userId) {
      userToAdd = await User.findById(userId);
    } else if (email) {
      userToAdd = await User.findOne({ email });
    } else if (username) {
      userToAdd = await User.findOne({ username });
    }
    
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add member
    const newMember = project.addMember(userToAdd._id, role, req.user.id);
    await project.save();
    
    // Populate user details
    await project.populate('members.user', 'username email profilePicture');
    
    res.json({
      message: 'Member added successfully',
      member: newMember,
    });
  } catch (error) {
    if (error.message === 'User is already a member') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// UPDATE MEMBER
// ============================================

/**
 * Update member role or permissions
 */
exports.updateMember = async (req, res) => {
  try {
    const { role, permissions } = req.body;
    
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permission
    if (!project.hasPermission(req.user.id, 'canEditMemberRoles')) {
      return res.status(403).json({ message: 'No permission to edit member roles' });
    }
    
    // Update role if provided
    if (role) {
      project.updateMemberRole(req.params.userId, role);
    }
    
    // Update permissions if provided
    if (permissions) {
      project.updateMemberPermissions(req.params.userId, permissions);
    }
    
    await project.save();
    
    const updatedMember = project.getMember(req.params.userId);
    
    res.json({
      message: 'Member updated successfully',
      member: updatedMember,
    });
  } catch (error) {
    if (error.message.includes('Member not found') || error.message.includes('Cannot change owner')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Update member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// REMOVE MEMBER
// ============================================

/**
 * Remove member from project
 */
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permission
    const canRemove = project.hasPermission(req.user.id, 'canRemoveMembers') ||
                      req.user.id === req.params.userId; // Users can remove themselves
    
    if (!canRemove) {
      return res.status(403).json({ message: 'No permission to remove members' });
    }
    
    project.removeMember(req.params.userId);
    await project.save();
    
    res.json({
      message: 'Member removed successfully',
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Cannot remove')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// GET MEMBER DETAILS
// ============================================

/**
 * Get specific member details
 */
exports.getMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('members.user', 'username email profilePicture');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access
    if (!project.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const member = project.getMember(req.params.userId);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    res.json({ member });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;
