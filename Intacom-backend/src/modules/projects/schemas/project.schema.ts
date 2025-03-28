import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  admin?: string;

  @Prop()
  color?: string;

  @Prop({ type: [{ userId: String, role: String }], default: [] })
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];

  @Prop({ type: [{ userId: String, requestedBy: String, status: String }], default: [] })
  memberRequests?: { userId: string; requestedBy: string; status: 'pending' | 'approved' | 'denied' }[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);