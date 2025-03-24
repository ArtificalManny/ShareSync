import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Project extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  admin: string;

  @Prop()
  color: string;

  @Prop([
    {
      userId: { type: String, required: true },
      role: { type: String, enum: ['Admin', 'Editor', 'Viewer'], required: true },
    },
  ])
  sharedWith: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);