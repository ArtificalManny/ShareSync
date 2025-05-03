import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TeamActivity extends Document {
  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ type: [String], default: [] })
  likedBy: string[];
}

export const TeamActivitySchema = SchemaFactory.createForClass(TeamActivity);