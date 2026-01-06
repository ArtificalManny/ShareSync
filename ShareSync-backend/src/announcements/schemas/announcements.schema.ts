import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AnnouncementDocument = Announcement & Document;

@Schema({ timestamps: true })
export class Announcement {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  authorId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true, maxlength: 200 })
  title: string;

  @Prop({ type: String, required: true, maxlength: 2000 })
  message: string;

  @Prop({ 
    type: String, 
    enum: ['general', 'important', 'milestone', 'payment'],
    default: 'general'
  })
  type: string;

  @Prop({ type: Boolean, default: true })
  pinned: boolean;

  @Prop({ type: [String], default: [] })
  attachments: string[]; // URLs to uploaded files

  @Prop({ 
    type: [{ 
      userId: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
      readAt: Date 
    }],
    default: []
  })
  readBy: Array<{
    userId: MongooseSchema.Types.ObjectId;
    readAt: Date;
  }>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);

// Indexes
AnnouncementSchema.index({ projectId: 1, pinned: -1, createdAt: -1 });
AnnouncementSchema.index({ projectId: 1, type: 1 });