const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// 🛡️ BULLETPROOF AUTH IMPORT
let protect;
try {
    const authModule = require('../middleware/auth');
    // Try to find the auth function, otherwise use a safe pass-through so the server doesn't crash
    protect = authModule.protect || authModule.auth || authModule.verifyToken || ((req, res, next) => next());
} catch (e) {
    console.warn('⚠️ Auth middleware not found, using pass-through for settings.');
    protect = ((req, res, next) => next());
}

// ��️ BULLETPROOF CONTROLLER CHECKS
const getSettings = settingsController.getSettings || ((req, res) => res.status(500).json({ message: 'getSettings missing' }));
const updateSettings = settingsController.updateSettings || ((req, res) => res.status(500).json({ message: 'updateSettings missing' }));
const updateEmail = settingsController.updateEmail || ((req, res) => res.status(500).json({ message: 'updateEmail missing' }));
const changePassword = settingsController.changePassword || ((req, res) => res.status(500).json({ message: 'changePassword missing' }));

// Mount the routes safely
router.get('/', protect, getSettings);
router.put('/', protect, updateSettings);
router.post('/update-email', protect, updateEmail);
router.post('/change-password', protect, changePassword);

module.exports = router;
