const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Fetch notifications for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Notifications Route - Fetching notifications for user:', req.user.id);
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('Notifications Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Notifications Route - Notifications fetched:', user.notifications.length);
    res.json(user.notifications);
  } catch (err) {
    console.error('Notifications Route - Error fetching notifications:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a notification as read
router.put('/:notificationIndex', auth, async (req, res) => {
  try {
    console.log('Notifications Route - Marking notification as read for user:', req.user.id);
    const { notificationIndex } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('Notifications Route - User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    if (notificationIndex >= user.notifications.length) {
      console.log('Notifications Route - Notification not found:', notificationIndex);
      return res.status(404).json({ message: 'Notification not found' });
    }

    user.notifications[notificationIndex].read = true;
    await user.save();

    console.log('Notifications Route - Notification marked as read:', notificationIndex);
    res.json(user.notifications[notificationIndex]);
  } catch (err) {
    console.error('Notifications Route - Error marking notification as read:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;