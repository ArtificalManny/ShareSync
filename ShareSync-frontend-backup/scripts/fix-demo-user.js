// scripts/fix-demo-user.js
// One-time script to update demo user with firstName/lastName

const mongoose = require('mongoose');

async function fixDemoUser() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sharesync';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find users with username 'demo' or email containing 'demo'
    const demoUsers = await usersCollection.find({
      $or: [
        { username: /demo/i },
        { email: /demo/i }
      ]
    }).toArray();

    console.log(`Found ${demoUsers.length} demo user(s)`);

    for (const user of demoUsers) {
      console.log(`Updating user: ${user.email || user.username}`);
      
      const updateResult = await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            firstName: user.firstName || 'Demo',
            lastName: user.lastName || 'User',
            displayName: user.displayName || 'Demo User'
          } 
        }
      );
      
      console.log(`  Modified: ${updateResult.modifiedCount}`);
    }

    // Also update any user that has empty firstName/lastName
    const emptyNameUsers = await usersCollection.find({
      $or: [
        { firstName: { $exists: false } },
        { firstName: null },
        { firstName: '' },
        { lastName: { $exists: false } },
        { lastName: null },
        { lastName: '' }
      ]
    }).toArray();

    console.log(`Found ${emptyNameUsers.length} user(s) with empty names`);

    for (const user of emptyNameUsers) {
      // Extract name from email or username
      const emailName = user.email ? user.email.split('@')[0] : '';
      const guessedFirst = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      
      const updateResult = await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            firstName: user.firstName || guessedFirst || 'User',
            lastName: user.lastName || ''
          } 
        }
      );
      
      console.log(`  Updated ${user.email}: modified ${updateResult.modifiedCount}`);
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDemoUser();
