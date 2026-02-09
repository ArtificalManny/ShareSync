import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class MessageReaction {
  @Prop({ required: true })
  emoji: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  users: Types.ObjectId[];
}

@Schema({ _id: false })
export class MessageAttachment {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  size: number;
}

@Schema({ timestamps: true })
export class ThreadMessage {
  @Prop({ type: Types.ObjectId, ref: 'Thread', required: true, index: true })
  threadId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  mentions: Types.ObjectId[];

  @Prop({ type: [MessageReaction], default: [] })
  reactions: MessageReaction[];

  @Prop({ type: [MessageAttachment], default: [] })
  attachments: MessageAttachment[];

  @Prop({ default: false })
  isEdited: boolean;

  @Prop()
  editedAt: Date;
}

export type ThreadMessageDocument = ThreadMessage & Document;
export const ThreadMessageSchema = SchemaFactory.createForClass(ThreadMessage);

ThreadMessageSchema.index({ threadId: 1, createdAt: 1 });
