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
}

export const ProjectSchema = SchemaFactory.createForClass(Project);