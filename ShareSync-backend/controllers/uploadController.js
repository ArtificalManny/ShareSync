/**
 * uploadController.js
 * Handles file upload operations
 */

const User = require('../models/User');
const Project = require('../models/Project');
const { getFileUrl, deleteFile, getFileInfo } = require('../middleware/upload');
const path = require('path');

// ============================================
// AVATAR UPLOAD
// ============================================

/**
 * Upload user avatar
 */
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      // Clean up uploaded file
      deleteFile(req.file.path);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete old avatar if exists and is local file
    if (user.profilePicture && user.profilePicture.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.profilePicture);
      deleteFile(oldPath);
    }
    
    // Update user profile picture
    user.profilePicture = getFileUrl(req.file.filename, 'avatars');
    await user.save();
    
    console.log(`📸 ${user.username} uploaded new avatar: ${req.file.filename}`);
    
    res.json({
      message: 'Avatar uploaded successfully',
      url: user.profilePicture,
      filename: req.file.filename,
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// MESSAGE ATTACHMENT
// ============================================

/**
 * Upload message attachment
 */
exports.uploadMessageAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileInfo = getFileInfo(req.file.path);
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: getFileUrl(req.file.filename, 'messages'),
        size: req.file.size,
        type: fileInfo?.type || 'unknown',
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.error('Upload attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// PROJECT FILE
// ============================================

/**
 * Upload project file
 */
exports.uploadProjectFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      deleteFile(req.file.path);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permission
    if (!project.isMember(req.user.id)) {
      deleteFile(req.file.path);
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const fileInfo = getFileInfo(req.file.path);
    
    // Add file to project
    const fileData = {
      name: req.file.originalname,
      filename: req.file.filename,
      url: getFileUrl(req.file.filename, 'projects'),
      size: req.file.size,
      type: fileInfo?.type || 'unknown',
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
    };
    
    // If project has files array, add to it
    if (!project.files) {
      project.files = [];
    }
    project.files.push(fileData);
    await project.save();
    
    console.log(`📎 File uploaded to project ${project.title}: ${req.file.originalname}`);
    
    res.json({
      message: 'File uploaded successfully',
      file: fileData,
    });
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.error('Upload project file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get project files
 */
exports.getProjectFiles = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('files.uploadedBy', 'username profilePicture');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permission
    if (!project.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({
      files: project.files || [],
      total: project.files?.length || 0,
    });
  } catch (error) {
    console.error('Get project files error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete project file
 */
exports.deleteProjectFile = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permission
    if (!project.hasPermission(req.user.id, 'canEditProject')) {
      return res.status(403).json({ message: 'No permission to delete files' });
    }
    
    const fileIndex = project.files.findIndex(f => f._id.toString() === req.params.fileId);
    
    if (fileIndex === -1) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const file = project.files[fileIndex];
    
    // Delete from disk
    const filepath = path.join(__dirname, '..', 'uploads', 'projects', file.filename);
    deleteFile(filepath);
    
    // Remove from project
    project.files.splice(fileIndex, 1);
    await project.save();
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete project file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;
