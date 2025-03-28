import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

// Define a nested schema for the birthday field
@Schema()
class Birthday {
  @Prop({ required: false })
  month: string;

  @Prop({ required: false })
  day: string;

  @Prop({ required: false })
  year: string;
}

export const BirthdaySchema = SchemaFactory.createForClass(Birthday);

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

  @Prop({ type: BirthdaySchema, required: false }) // Define birthday as a nested schema
  birthday?: Birthday;

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