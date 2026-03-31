/**
 * settingsController.js
 * Manages global app settings, appearance, notifications, and account security.
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Needed for password changes

// ============================================
// GET SETTINGS
// ============================================
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('appSettings email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // ⭐ PHASE 3 FIX: Return data in the exact shape the frontend SettingsContext expects
    res.json({ 
      success: true, 
      data: user.appSettings || {}, // The new context looks here first
      settings: user.appSettings || {}, // Fallback for older components
      email: user.email 
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// UPDATE SETTINGS (Merge logic)
// ============================================
exports.updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ⭐ PHASE 3 FIX: Dynamically spread the entire req.body into appSettings.
    // This ensures momentum, focus, mentor, social, and legacy settings are ALL saved
    // without having to hardcode every single category.
    user.appSettings = {
      ...user.appSettings,
      ...req.body
    };

    // Safely update top-level legacy fields if they exist in the payload
    if (req.body.publicProfile !== undefined) {
      user.publicProfile = req.body.publicProfile;
    }
    if (req.body.discoverable !== undefined) {
      user.discoverable = req.body.discoverable;
    }

    await user.save();

    // Return the standardized success response for the frontend context
    res.json({ 
      success: true, 
      data: user.appSettings,
      message: 'Settings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// ACCOUNT SECURITY: UPDATE EMAIL
// ============================================
exports.updateEmail = async (req, res) => {
  try {
    const { newEmail } = req.body;
    
    if (!newEmail || !newEmail.includes('@')) {
      return res.status(400).json({ message: 'Please provide a valid email.' });
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'This email is already in use by another account.' });
    }

    const user = await User.findById(req.user.id);
    user.email = newEmail;
    await user.save();

    res.json({ message: 'Email updated successfully', email: user.email });
  } catch (error) {
    console.error('Error updating email:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// ACCOUNT SECURITY: CHANGE PASSWORD
// ============================================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    // Hash the new password and save
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password successfully updated' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
