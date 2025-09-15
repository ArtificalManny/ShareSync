import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FileDocument = File & Document;

export type FileKind = 'image' | 'video' | 'doc' | 'audio' | 'other';
export type FileStatus = 'pending' | 'approved' | 'blocked';

@Schema({ timestamps: true })
export class File {
  // Storage locations (keys/paths) and optional absolute URLs
  @Prop({ required: true }) storageKey: string;      // e.g. uploads/abc123.png
  @Prop() url?: string;                              // e.g. https://cdn/.../abc123.png

  @Prop() thumbKey?: string;
  @Prop() thumbUrl?: string;

  // Metadata
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) size: number;           // bytes
  @Prop({ required: true }) mime: string;
  @Prop({ enum: ['image', 'video', 'doc', 'audio', 'other'], default: 'other' })
  kind: FileKind;

  // Linkage
  @Prop({ required: true }) projectId: string;
  @Prop({ required: true }) uploaderId: string;     // who uploaded/linked it

  // Trust & safety
  @Prop({ enum: ['pending', 'approved', 'blocked'], default: 'approved' })
  status: FileStatus;

  @Prop({
    type: {
      reason: { type: String },
      tags: { type: [String], default: [] },
    },
    default: undefined,
  })
  moderation?: { reason?: string; tags?: string[] };
}

export const FileSchema = SchemaFactory.createForClass(File);