import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  username!: string; // Use ! to indicate it will be assigned

  @Prop({ required: true })
  password!: string; // Use ! to indicate it will be assigned

  @Prop()
  profilePic?: string; // Optional with ?
}

export const UserSchema = SchemaFactory.createForClass(User);