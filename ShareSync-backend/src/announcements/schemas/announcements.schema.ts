import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnnouncementDocument = Announcement & Document;

@Schema({ timestamps: true })
export class Announcement {
  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  body: string;

  @Prop({ default: 'general' })
  category?: string;

  @Prop({ default: false })
  pinned?: boolean;

  @Prop({ default: false })
  archived?: boolean;

  @Prop({ type: String })
  createdBy?: string;

  @Prop({ type: String })
  projectId?: string;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
