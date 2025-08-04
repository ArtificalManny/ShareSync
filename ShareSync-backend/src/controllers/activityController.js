// src/controllers/activityController.js
const { logUserActivity } = require('../utils/logUserActivity')

// Handles POST /api/activity
exports.logActivityForUser = async (req, res) => {
  try {
    const { userId, activity, relatedId } = req.body

    if (!userId || !activity) {
      return res.status(400).json({ error: 'Missing userId or activity type' })
    }

    await logUserActivity(userId, activity, relatedId)
    res.status(200).json({ success: true, message: 'Activity logged' })
  } catch (err) {
    console.error('[logActivityForUser]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
