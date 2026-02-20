import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class VaultFolder {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['public', 'private'], default: 'public' })
  accessLevel: string;

  // If private, only the creator, project owner/moderator, and these users can see it
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  allowedUsers: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export type VaultFolderDocument = VaultFolder & Document;
export const VaultFolderSchema = SchemaFactory.createForClass(VaultFolder);
