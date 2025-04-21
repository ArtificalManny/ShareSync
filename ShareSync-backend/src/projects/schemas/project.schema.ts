import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Project extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  ownerId: string;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);