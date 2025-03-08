import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema()
export class Project {
  @Prop({ required: true })
  name: string = '';

  @Prop({ required: true })
  description: string = '';

  @Prop({ required: true })
  admin: string = ''; // Admin username

  @Prop()
  color?: string;

  @Prop()
  members: string[] = []; // Array of member usernames

  @Prop()
  administrators: string[] = []; // Array of admin usernames
}

export const ProjectSchema = SchemaFactory.createForClass(Project);