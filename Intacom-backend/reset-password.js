const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { UserSchema } = require('./src/users/schemas/user.schema');

const User = mongoose.model('User', UserSchema);

async function resetPassword() {
  try {
    // Connect to the local MongoDB instance
    await mongoose.connect('mongodb://localhost:27017/intacom', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'eamonrivas@gmail.com' });
    if (!user) {
      console.log('User not found. Register the user first.');
      return;
    }

    // Hash the new password
    const newPassword = 'S7mR0!%uMZ<$[w%@';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    console.log('Password reset successfully for ArtificialManny');
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetPassword();