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

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: [] })
  badges: string[];

  @Prop({ default: [] })
  endorsements: string[];

  @Prop({ default: [] })
  experience: string[];

  @Prop({ default: [] })
  followers: string[];

  @Prop({ default: [] })
  following: string[];

  @Prop({ default: [] })
  hobbies: string[];

  @Prop({ default: [] })
  skills: string[];

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);