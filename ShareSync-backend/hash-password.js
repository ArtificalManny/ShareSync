const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function hashPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27018/sharesync');
    console.log('Connected to MongoDB');

    const newPassword = 'S7mR0!%uMZ<$[w%@';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'eamonrivas@gmail.com' },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      console.log('User not found: eamonrivas@gmail.com');
    } else {
      console.log('Password hashed and updated for user: eamonrivas@gmail.com');
    }
  } catch (error) {
    console.error('Error hashing password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

hashPassword();