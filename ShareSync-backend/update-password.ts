import { connect, disconnect, Schema, model, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

// Define the User schema directly in the script
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  profilePicture: { type: String },
  bannerPicture: { type: String },
  job: { type: String },
  school: { type: String },
});

interface UserDocument extends Document {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  bannerPicture?: string;
  job?: string;
  school?: string;
}

async function updatePassword() {
  let userModel: Model<UserDocument>;

  try {
    // Connect to MongoDB
    const connection = await connect('mongodb://localhost:27018/sharesync');
    console.log('Connected to MongoDB');

    // Define the User model
    userModel = model<UserDocument>('User', UserSchema);

    // Hash the password
    const newPassword = 'S7mR0!%uMZ<$[w%@';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update or create the user
    const result = await userModel.updateOne(
      { email: 'eamonrivas@gmail.com' },
      {
        $set: {
          email: 'eamonrivas@gmail.com',
          username: 'eamonrivas',
          password: hashedPassword,
          firstName: 'Manny', // Updated first name
          lastName: 'Rivas',
          profilePicture: null,
          bannerPicture: null,
          job: null,
          school: null,
        },
      },
      { upsert: true } // Create the user if it doesn't exist
    );

    if (result.upsertedCount > 0) {
      console.log('New user created with email: eamonrivas@gmail.com');
    } else if (result.modifiedCount > 0) {
      console.log('User updated with email: eamonrivas@gmail.com');
    } else {
      console.log('User already exists with the correct details: eamonrivas@gmail.com');
    }
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updatePassword();