import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  gender: string;

  @Prop({ type: Object })
  birthday: {
    month: string;
    day: string;
    year: string;
  };

  @Prop()
  verificationToken: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  resetToken: string;

  @Prop()
  bio: string;

  @Prop([String])
  hobbies: string[];

  @Prop([String])
  skills: string[]; // For LinkedIn-like professional profile

  @Prop([String])
  experience: string[]; // For LinkedIn-like professional profile

  @Prop([String])
  endorsements: string[]; // For LinkedIn-like endorsements

  @Prop([String])
  following: string[]; // Users this user follows

  @Prop([String])
  followers: string[]; // Users following this user

  @Prop({ default: 0 })
  points: number; // Total points for gamification

  @Prop([String])
  badges: string[]; // Badges for achievements (e.g., "Team Player")
}

export const UserSchema = SchemaFactory.createForClass(User);