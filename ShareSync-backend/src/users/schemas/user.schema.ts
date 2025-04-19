import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  username: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ type: Date })
  birthday: Date;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: [String], default: [] })
  badges: string[];

  @Prop({ type: [String], default: [] })
  endorsements: string[];

  @Prop({ type: [String], default: [] })
  followers: string[];

  @Prop({ type: [String], default: [] })
  following: string[];

  @Prop({ type: [String], default: [] })
  hobbies: string[];

  @Prop({ default: 0 })
  points: number;

  @Prop({ type: [String], default: [] })
  notifications: string[];

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ default: '' })
  bio: string;
}

export const UserSchema = SchemaFactory.createForClass(User);