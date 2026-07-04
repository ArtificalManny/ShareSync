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

  @Prop({
    type: {
      question: { type: String, default: '' },
      options: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true },
          votes: { type: [{ type: Types.ObjectId, ref: 'User' }], default: [] },
        },
      ],
      closed: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
    default: null,
  })
  poll?: {
    question: string;
    options: { id: string; text: string; votes: Types.ObjectId[] }[];
    closed: boolean;
    createdAt?: Date;
  } | null;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  readBy: Types.ObjectId[];

  @Prop({ default: false })
  archived: boolean;

  // ═══════════════════════════════════════════════════════════════════════════════
  // NEW: Likes and Comments Schema definitions so the database actually saves them
  // ═══════════════════════════════════════════════════════════════════════════════
  
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  @Prop({
    type: [
      {
        text: { type: String, required: true },
        authorId: { type: Types.ObjectId, ref: 'User', required: true },
        attachments: { type: [String], default: [] },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  comments: any[];
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
