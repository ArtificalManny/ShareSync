import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface InviteDoc extends Document {
  email: string;
  message?: string;
  inviterId?: string;
  projectId?: Types.ObjectId | string;
  token: string;
  accepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InviteSchema = new Schema<InviteDoc>(
  {
    email: { type: String, required: true, trim: true },
    message: { type: String },
    inviterId: { type: String },
    projectId: { type: Schema.Types.Mixed },
    token: { type: String, required: true, index: true, unique: true },
    accepted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Explicitly type as Model<InviteDoc> so TS knows methods like create/findOne
export const Invite: Model<InviteDoc> =
  mongoose.models.Invite || mongoose.model<InviteDoc>('Invite', InviteSchema);
