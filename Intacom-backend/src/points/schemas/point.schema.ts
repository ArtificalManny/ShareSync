import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PointDocument = Point & Document;

@Schema({ timestamps: true })
export class Point {
  @Prop({ required: true })
  userId: string; // The user earning the points

  @Prop({ required: true })
  points: number; // Number of points earned

  @Prop({ required: true })
  action: string; // e.g., "create_project", "comment", "complete_task"
}

export const PointSchema = SchemaFactory.createForClass(Point);