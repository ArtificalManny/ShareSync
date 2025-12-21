/**
 * middleware/upload.js
 * File upload configuration using multer
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
  'uploads/avatars',
  'uploads/messages',
  'uploads/projects',
  'uploads/temp',
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================
// STORAGE CONFIGURATION
// ============================================

/**
 * Avatar storage
 */
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

/**
 * Message attachment storage
 */
const messageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/messages');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `msg-${uniqueSuffix}-${safeName}`);
  }
});

/**
 * Project file storage
 */
const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/projects');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `project-${req.params.projectId || 'unknown'}-${uniqueSuffix}-${safeName}`);
  }
});

// ============================================
// FILE FILTERS
// ============================================

/**
 * Image file filter (avatars)
 */
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'));
  }
};

/**
 * Document file filter (messages/projects)
 */
const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type not allowed!'));
  }
};

// ============================================
// MULTER INSTANCES
// ============================================

/**
 * Avatar uploader
 */
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

/**
 * Message attachment uploader
 */
const uploadMessageAttachment = multer({
  storage: messageStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

/**
 * Project file uploader
 */
const uploadProjectFile = multer({
  storage: projectStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Delete file from disk
 */
function deleteFile(filepath) {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`🗑️ Deleted file: ${filepath}`);
      return true;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get file URL
 */
function getFileUrl(filename, type = 'avatars') {
  if (!filename) return null;
  
  // In production, this would be your CDN/S3 URL
  // For now, use local server URL
  return `/uploads/${type}/${filename}`;
}

/**
 * Get file info
 */
function getFileInfo(filepath) {
  try {
    if (!fs.existsSync(filepath)) {
      return null;
    }
    
    const stats = fs.statSync(filepath);
    const ext = path.extname(filepath).toLowerCase();
    
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      extension: ext,
      type: getFileType(ext),
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
}

/**
 * Get file type from extension
 */
function getFileType(ext) {
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const docExts = ['.pdf', '.doc', '.docx', '.txt'];
  const archiveExts = ['.zip', '.rar', '.7z'];
  
  if (imageExts.includes(ext)) return 'image';
  if (docExts.includes(ext)) return 'document';
  if (archiveExts.includes(ext)) return 'archive';
  return 'other';
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  uploadAvatar,
  uploadMessageAttachment,
  uploadProjectFile,
  deleteFile,
  getFileUrl,
  getFileInfo,
};
