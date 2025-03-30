import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema()
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  admin: string;

  @Prop()
  color: string;

  @Prop({ type: [{ userId: String, role: String }], default: [] })
  sharedWith: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];

  @Prop({ default: 'current' })
  status: 'current' | 'past';
}

export const ProjectSchema = SchemaFactory.createForClass(Project);