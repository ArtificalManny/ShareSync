import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class VaultFile {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'VaultFolder', default: null, index: true })
  folderId: Types.ObjectId;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true })
  sizeInBytes: number;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ default: false })
  isStarred: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task', default: null })
  linkedTaskId: Types.ObjectId;
}

export type VaultFileDocument = VaultFile & Document;
export const VaultFileSchema = SchemaFactory.createForClass(VaultFile);
