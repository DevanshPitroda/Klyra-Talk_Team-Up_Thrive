import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStatusView {
  userId: mongoose.Types.ObjectId;
  viewedAt: Date;
}

export interface IStatus extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'text' | 'image' | 'video';
  content?: string;
  backgroundColor?: string;
  mediaUrl?: string;
  viewedBy: IStatusView[];
  expiresAt: Date;
  createdAt: Date;
}

const StatusViewSchema = new Schema<IStatusView>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  viewedAt: { type: Date, required: true, default: Date.now },
});

const StatusSchema = new Schema<IStatus>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['text', 'image', 'video'], required: true },
    content: { type: String, default: null },
    backgroundColor: { type: String, default: null },
    mediaUrl: { type: String, default: null },
    viewedBy: [StatusViewSchema],
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index to automatically delete statuses 24 hours after creation
StatusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Status: Model<IStatus> =
  mongoose.models.Status || mongoose.model<IStatus>('Status', StatusSchema);

export default Status;
