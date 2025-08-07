import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class User {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
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

  @Prop({ type: [Types.ObjectId], ref: 'Project', default: [] })
  projects: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  notificationPreferences: string[];

  @Prop({ default: null })
  lastLogin?: Date;

  @Prop({ default: 0 })
  streakDays: number;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
