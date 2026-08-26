import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ required: true, index: true })
  userId: string;

  // openshare-persistent-session-v1
  // Only the SHA-256 hash is persisted.
  @Prop({ required: true, index: true })
  tokenHash: string;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ type: Date })
  lastUsedAt?: Date;

  @Prop({ type: Date })
  revokedAt?: Date;

  @Prop()
  replacedByTokenHash?: string;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

RefreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);
