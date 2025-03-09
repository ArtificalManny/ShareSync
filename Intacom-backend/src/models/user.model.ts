import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  firstName: string = '';

  @Prop({ required: true })
  lastName: string = '';

  @Prop({ required: true, unique: true })
  username: string = '';

  @Prop({ required: true })
  password: string = '';

  @Prop({ required: true, unique: true })
  email: string = '';

  @Prop({ required: true, enum: ['Male', 'Female'] })
  gender: string = '';

  @Prop({ required: true })
  birthday: { month: string; day: string; year: string } = { month: '', day: '', year: '' };

  @Prop()
  profilePic?: string;

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);