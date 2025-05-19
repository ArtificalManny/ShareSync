import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'; // Line 1
import { Document } from 'mongoose'; // Line 2

export type RefreshTokenDocument = RefreshToken & Document; // Line 4

@Schema({ timestamps: true }) // Line 6
export class RefreshToken { // Line 7
  @Prop({ required: true }) // Line 8
  userId: string; // Line 9

  @Prop({ required: true }) // Line 11
  token: string; // Line 12

  @Prop({ required: true, expires: '30d' }) // Line 14
  expiresAt: Date; // Line 15
} // Line 16

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken); // Line 18