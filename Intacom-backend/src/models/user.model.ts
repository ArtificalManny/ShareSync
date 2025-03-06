import { Schema, model, Document } from 'mongoose';

export interface User extends Document {
  username: string;
  password: string;
  profilePic?: string;
}

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, required: false },
});

export default model<User>('User', UserSchema);