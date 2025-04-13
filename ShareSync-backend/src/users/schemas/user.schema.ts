import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
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

  @Prop({
    type: {
      month: { type: String, required: true },
      day: { type: String, required: true },
      year: { type: String, required: true },
    },
    required: true,
  })
  birthday: { month: string; day: string; year: string };

  @Prop()
  bio: string;

  @Prop([String])
  skills: string[];

  @Prop({ type: [{ company: String, role: String, duration: String }] })
  experience: { company: string; role: string; duration: string }[];

  @Prop()
  profilePicture: string;

  @Prop()
  coverPhoto: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop()
  verificationToken: string;

  @Prop()
  resetPasswordToken: string;

  @Prop()
  resetPasswordExpires: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);