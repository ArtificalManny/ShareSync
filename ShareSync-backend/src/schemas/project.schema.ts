import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  ownerId: string;

  @Prop([{ type: { type: String }, message: String, timestamp: Date }])
  teamActivities?: { type: string; message: string; timestamp: Date }[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);