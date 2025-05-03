import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  username: string;

  @Prop({ default: 0 })
  points: number;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  job: string;

  @Prop()
  school: string;

  @Prop()
  profilePicture: string;

  @Prop()
  bannerPicture: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = User & Document;