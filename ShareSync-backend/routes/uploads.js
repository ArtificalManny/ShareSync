/**
 * routes/uploads.js
 * Routes for file uploads
 */

const express = require('express');
const router = express.Router();

const {
  uploadAvatar,
  uploadMessageAttachment,
  uploadProjectFile,
  getProjectFiles,
  deleteProjectFile,
} = require('../controllers/uploadController');

const {
  uploadAvatar: avatarUploader,
  uploadMessageAttachment: messageUploader,
  uploadProjectFile: projectUploader,
} = require('../middleware/upload');

// Require auth middleware
let requireAuth;
try { requireAuth = require('../middleware/auth'); } catch { requireAuth = require('../auth'); }

// All routes require authentication
router.use(requireAuth);

// ============================================
// UPLOAD ROUTES
// ============================================

// POST /api/uploads/avatar - Upload user avatar
router.post('/avatar', avatarUploader.single('avatar'), uploadAvatar);

// POST /api/uploads/message - Upload message attachment
router.post('/message', messageUploader.single('file'), uploadMessageAttachment);

// POST /api/uploads/project/:projectId - Upload project file
router.post('/project/:projectId', projectUploader.single('file'), uploadProjectFile);

// GET /api/uploads/project/:projectId/files - Get project files
router.get('/project/:projectId/files', getProjectFiles);

// DELETE /api/uploads/project/:projectId/files/:fileId - Delete project file
router.delete('/project/:projectId/files/:fileId', deleteProjectFile);

module.exports = router;
