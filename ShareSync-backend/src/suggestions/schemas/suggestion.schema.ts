import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SuggestionDocument = Suggestion & Document;

@Schema({ timestamps: true, collection: 'suggestions' })
export class Suggestion {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  authorId: string;

  @Prop({ required: true, maxlength: 100 })
  title: string;

  @Prop({ required: true, maxlength: 2000 })
  content: string;

  // SPECTATOR ECONOMY CORE: Visibility control
  @Prop({ 
    required: true, 
    enum: ['draft', 'internal', 'public'], 
    default: 'draft',
    index: true 
  })
  visibility: string;

  @Prop({ 
    enum: ['open', 'approved', 'rejected', 'completed'], 
    default: 'open' 
  })
  status: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  upvotes: string[];
}

export const SuggestionSchema = SchemaFactory.createForClass(Suggestion);

// Compound index for efficient querying by project and visibility
SuggestionSchema.index({ projectId: 1, visibility: 1 });
