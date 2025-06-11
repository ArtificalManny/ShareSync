const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const router = express.Router();
const auth = require('../middleware/auth'); // JWT middleware

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pictures/');
  },
  filename: function (req, file, cb) {
    cb(null, req.user.id + '-' + Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.post('/upload-profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: `/uploads/profile-pictures/${req.file.filename}` },
      { new: true }
    );
    res.json({ profilePicture: user.profilePicture });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
