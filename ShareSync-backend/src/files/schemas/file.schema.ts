// src/files/schemas/file.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FileDocument = File & Document;

export type ModerationStatus = 'allowed' | 'pending' | 'blocked';

@Schema({ timestamps: true })
export class File {
  @Prop({ required: true }) url: string;
  @Prop() thumbUrl?: string;

  @Prop({ required: true }) name: string;
  @Prop({ required: true }) size: number; // bytes
  @Prop({ required: true }) mime: string;

  // Linkage
  @Prop({ required: true }) projectId: string;
  @Prop({ required: true }) userId: string; // uploader

  // Trust & safety
  @Prop({ enum: ['allowed', 'pending', 'blocked'], default: 'allowed' })
  moderationStatus: ModerationStatus;
}

export const FileSchema = SchemaFactory.createForClass(File);
