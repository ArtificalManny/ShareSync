import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class ThreadMessageReaction {
  @Prop({ required: true })
  emoji: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  users: Types.ObjectId[];
}

@Schema({ _id: false })
export class ThreadMessageFileReference {
  @Prop({ required: true })
  fileId: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ default: '' })
  fileType: string;

  @Prop({ default: 0 })
  fileSize: number;

  @Prop({
    type: String,
    enum: ['project_file'],
    default: 'project_file',
  })
  source: 'project_file';

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  linkedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  linkedAt: Date;
}

@Schema({ timestamps: true })
export class ThreadMessage {
  @Prop({ type: Types.ObjectId, ref: 'Thread', required: true, index: true })
  threadId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  mentions: Types.ObjectId[];

  @Prop({ type: [ThreadMessageReaction], default: [] })
  reactions: ThreadMessageReaction[];

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({
    type: [ThreadMessageFileReference],
    default: [],
  })
  fileReferences: ThreadMessageFileReference[];

  @Prop({ default: false })
  isEdited: boolean;

  @Prop()
  editedAt: Date;
}

export type ThreadMessageDocument = ThreadMessage & Document;
export const ThreadMessageSchema = SchemaFactory.createForClass(ThreadMessage);

// Helpful indexes
ThreadMessageSchema.index({ threadId: 1, createdAt: -1 });
ThreadMessageSchema.index({ userId: 1, createdAt: -1 });
