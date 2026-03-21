import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnnouncementDocument = Announcement & Document;

@Schema({ timestamps: true })
export class Announcement {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ default: 'info' })
  type: string;

  @Prop({ default: false })
  pinned: boolean;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  readBy: Types.ObjectId[];

  @Prop({ default: false })
  archived: boolean;

  // ✅ NEW: Likes — array of user ObjectIds who liked this announcement
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  // ✅ NEW: Comments — embedded subdocuments
  @Prop({
    type: [
      {
        authorId: { type: Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        attachments: { type: [String], default: [] },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  comments: Array<{
    _id?: Types.ObjectId;
    authorId: Types.ObjectId;
    text: string;
    attachments: string[];
    createdAt: Date;
  }>;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
