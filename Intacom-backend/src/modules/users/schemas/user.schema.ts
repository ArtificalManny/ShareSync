import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  gender?: string;

  @Prop()
  birthday?: { month: string; day: string; year: string };

  @Prop()
  profilePic?: string;

  @Prop()
  coverPhoto?: string;

  @Prop()
  bio?: string;

  @Prop()
  school?: string;

  @Prop()
  occupation?: string;

  @Prop({ type: [String], default: [] })
  hobbies?: string[];

  @Prop({
    type: {
      emailNotifications: { type: Boolean, default: true },
      postNotifications: { type: Boolean, default: true },
      commentNotifications: { type: Boolean, default: true },
      likeNotifications: { type: Boolean, default: true },
      taskNotifications: { type: Boolean, default: true },
      memberRequestNotifications: { type: Boolean, default: true },
      theme: { type: String, default: 'dark' },
      privacy: { type: String, default: 'public' },
    },
    default: {},
  })
  settings?: {
    emailNotifications: boolean;
    postNotifications: boolean;
    commentNotifications: boolean;
    likeNotifications: boolean;
    taskNotifications: boolean;
    memberRequestNotifications: boolean;
    theme: string;
    privacy: string;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);