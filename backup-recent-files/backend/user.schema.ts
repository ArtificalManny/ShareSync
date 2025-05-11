import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  profilePicture: string;

  @Prop()
  bannerPicture: string;

  @Prop()
  job: string;

  @Prop()
  school: string;

  @Prop({ type: [String], default: ['email_task_completion', 'email_new_post'] })
  notificationPreferences: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = User & Document;