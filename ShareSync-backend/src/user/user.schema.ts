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

  @Prop({ required: false })
  firstName: string;

  @Prop({ required: false })
  lastName: string;

  @Prop({ required: false })
  profilePicture: string;

  @Prop({ required: false })
  bannerPicture: string;

  @Prop({ required: false })
  job: string;

  @Prop({ required: false })
  school: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = User & Document;