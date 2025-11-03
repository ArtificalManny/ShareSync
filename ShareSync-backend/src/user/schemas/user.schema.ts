// src/user/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  password: string;

  @Prop()
  profilePicture?: string;

  @Prop()
  bannerPicture?: string;

  @Prop()
  school?: string;

  @Prop()
  job?: string;

  @Prop({ default: false })
  publicProfile?: boolean;

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: 0 })
  xp: number; // NEW: for leaderboard

  @Prop({ type: [Types.ObjectId], ref: 'Project', default: [] })
  projects: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  notificationPreferences: string[];

  @Prop({ default: null })
  lastLogin?: Date;

  @Prop({ default: 0 })
  streakDays: number;

  @Prop({ type: Boolean, default: false })
  emailOptOut: boolean;

  // Virtual: full name
  get name(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
  }
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

// Add virtual for name
UserSchema.virtual('name').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
});