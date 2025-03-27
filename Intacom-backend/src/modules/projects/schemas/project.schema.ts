import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Project extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  admin: string;

  @Prop()
  color: string;

  @Prop([{ userId: String, role: String }])
  sharedWith: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);