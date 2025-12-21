/**
 * cleanup-uploads.js
 * Remove orphaned files from uploads directory
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function cleanupUploads() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = require('../models/User');
    const Project = require('../models/Project');
    
    // Get all avatar filenames from database
    const users = await User.find({}, 'profilePicture');
    const dbAvatars = new Set(
      users
        .map(u => u.profilePicture)
        .filter(p => p && p.startsWith('/uploads/avatars/'))
        .map(p => path.basename(p))
    );
    
    // Get all files in avatars directory
    const avatarDir = 'uploads/avatars';
    const avatarFiles = fs.readdirSync(avatarDir);
    
    let deleted = 0;
    
    // Delete orphaned avatars
    for (const file of avatarFiles) {
      if (file === '.gitkeep') continue;
      
      if (!dbAvatars.has(file)) {
        const filePath = path.join(avatarDir, file);
        fs.unlinkSync(filePath);
        console.log(`Deleted orphaned avatar: ${file}`);
        deleted++;
      }
    }
    
    console.log(`✅ Cleanup complete! Deleted ${deleted} orphaned files.`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupUploads();
}

module.exports = cleanupUploads;
