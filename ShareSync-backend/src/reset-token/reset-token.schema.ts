import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ResetToken extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const ResetTokenSchema = SchemaFactory.createForClass(ResetToken);