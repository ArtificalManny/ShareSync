import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  _id: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  profilePicture: string;

  @Prop()
  bannerPicture: string;

  @Prop()
  job: string;

  @Prop()
  school: string;

  @Prop({ type: Object })
  notificationPreferences: Record<string, any>;

  @Prop({ type: Date }) // ✅ new
  lastLogin: Date;

  @Prop({ type: Number, default: 0 }) // ✅ new
  streakDays: number;
}

export const UserSchema = SchemaFactory.createForClass(User);