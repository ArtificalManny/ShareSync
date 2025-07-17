import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema()
export class Project {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  category: string;

  @Prop()
  status: string;

  @Prop()
  privacy: string;

  @Prop({ type: [{ email: String, role: String }], default: [] })
  members: { email: string; role: string }[];

  @Prop({ required: true })
  userId: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
