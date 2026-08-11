import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'message' | 'group_invite' | 'mention' | 'system' | 'registration';
  title: string;
  body: string;
  referenceId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['message', 'group_invite', 'mention', 'system', 'registration'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Compound index for querying user notifications
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// TTL index to automatically delete notifications after 30 days (2592000 seconds)
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
