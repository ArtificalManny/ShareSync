import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  password: string;

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
}

export const UserSchema = SchemaFactory.createForClass(User);