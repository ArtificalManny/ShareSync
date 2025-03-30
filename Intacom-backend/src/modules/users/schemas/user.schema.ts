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

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  gender: string;

  @Prop()
  birthday: { month: string; day: string; year: string };

  @Prop()
  profilePic: string;

  @Prop()
  coverPhoto: string;

  @Prop()
  bio: string;

  @Prop()
  school: string;

  @Prop()
  occupation: string;

  @Prop([String])
  hobbies: string[];

  @Prop()
  backgroundImage: string;
}

export const UserSchema = SchemaFactory.createForClass(User);