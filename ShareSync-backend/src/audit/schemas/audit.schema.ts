// src/audit/schemas/audit.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Audit extends Document {
  @Prop({ required: true })
  type: string;

  @Prop({ type: Object, required: true })
  actor: { id: string };

  @Prop({ type: Object })
  target?: { id: string; type: string };

  @Prop({ required: true })
  action: string;

  @Prop({ type: Object })
  meta?: Record<string, any>;
}

export type AuditDocument = Audit & Document;
export const AuditSchema = SchemaFactory.createForClass(Audit);