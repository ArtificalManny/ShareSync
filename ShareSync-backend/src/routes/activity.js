// /src/api/activity.js
const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { userId, activity, relatedId } = req.body;
  console.log('Logged activity:', { userId, activity, relatedId });
  res.status(200).json({ message: 'Activity logged successfully' });
});

module.exports = router;