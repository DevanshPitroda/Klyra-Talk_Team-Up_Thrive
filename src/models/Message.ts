import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttachment {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface IReceipt {
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
}

export interface IReaction {
  emoji: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  body?: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system' | 'location' | 'poll' | 'meeting';
  viewOnce: boolean;
  viewOnceSeen: boolean;
  attachments: IAttachment[];
  replyToId?: mongoose.Types.ObjectId;
  seenBy: IReceipt[];
  deliveredTo: IReceipt[];
  reactions: IReaction[];
  isPinned: boolean;
  pinnedAt?: Date;
  starredBy: mongoose.Types.ObjectId[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReactionSchema = new Schema<IReaction>(
  {
    emoji: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
  },
  { _id: false }
);

const AttachmentSchema = new Schema<IAttachment>({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
});

const ReceiptSchema = new Schema<IReceipt>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, required: true, default: Date.now },
});

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, default: null },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'system', 'location', 'poll', 'meeting'],
      default: 'text',
      required: true,
    },
    viewOnce: { type: Boolean, default: false },
    viewOnceSeen: { type: Boolean, default: false },
    attachments: [AttachmentSchema],
    replyToId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    seenBy: [ReceiptSchema],
    deliveredTo: [ReceiptSchema],
    reactions: [ReactionSchema],
    isPinned: { type: Boolean, default: false },
    pinnedAt: { type: Date, default: null },
    starredBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Search message indexes
MessageSchema.index({ body: 'text' });
// Paginated logs index
MessageSchema.index({ conversationId: 1, createdAt: -1 });
// TTL Index for disappearing messages
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

if (process.env.NODE_ENV === 'development' && mongoose.models.Message) {
  delete mongoose.models.Message;
}

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
