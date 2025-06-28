// src/user/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document }                   from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ default: '/default-profile.png' })
  profilePicture: string;

  @Prop()
  bannerPicture?: string;

  @Prop()
  job?: string;

  @Prop()
  school?: string;

  @Prop({ type: Object, default: {} })
  notificationPreferences?: Record<string, any>;
}

export const UserSchema = SchemaFactory.createForClass(User);
