import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
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

  @Prop({ required: true })
  gender: string;

  @Prop({ required: true })
  birthday: { month: string; day: string; year: string };

  @Prop()
  profilePic: string;
}

export const UserSchema = SchemaFactory.createForClass(User);