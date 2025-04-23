import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  gender: string;

  @Prop({ required: true })
  birthday: {
    month: string;
    day: string;
    year: string;
  };

  @Prop()
  profilePicture?: string;

  @Prop()
  bannerPicture?: string;

  @Prop()
  school?: string;

  @Prop()
  job?: string;

  @Prop([String])
  projects?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);