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
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
    await user.save();
    res.json({ profilePicture: user.profilePicture });
  } catch (err) {
    console.error('Profile upload error:', err); // <--- Check your backend logs!
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/create', auth, async (req, res) => {
  try {
    const { title, color, image, members } = req.body;
    const project = new Project({
      title,
      color,
      image,
      members,
      owner: req.user.id,
    });
    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err); // <--- Check your backend logs for details!
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
