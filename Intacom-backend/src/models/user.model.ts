import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  username: string = '';

  @Prop({ required: true })
  password: string = '';

  @Prop({ required: true, unique: true })
  email: string = '';

  @Prop({ required: true })
  name: string = '';

  @Prop({ required: true })
  age: number = 0;

  @Prop()
  profilePic?: string;

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);