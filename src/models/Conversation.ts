import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConversation extends Document {
  type: 'direct' | 'group';
  name?: string; // Group name, null for direct chats
  image?: string; // Group icon, null for direct chats
  description?: string; // Group bio, null for direct chats
  createdBy: mongoose.Types.ObjectId;
  lastMessageId?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  isArchived: boolean;
  disappearingTimer: 'off' | '24h' | 'view_once';
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    type: { type: String, enum: ['direct', 'group'], required: true, index: true },
    name: { type: String, default: null },
    image: { type: String, default: null },
    description: { type: String, default: null, maxlength: 512 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessageId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    lastMessageAt: { type: Date, default: null },
    isArchived: { type: Boolean, default: false },
    disappearingTimer: { type: String, enum: ['off', '24h', 'view_once'], default: 'off' },
  },
  { timestamps: true }
);

ConversationSchema.index({ lastMessageAt: -1 });

const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
