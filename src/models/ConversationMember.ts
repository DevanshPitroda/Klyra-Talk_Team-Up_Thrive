import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConversationMember extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'member' | 'admin' | 'owner';
  joinedAt: Date;
  lastReadAt?: Date;
  isMuted: boolean;
  isArchived: boolean;
  unreadCount: number;
}

const ConversationMemberSchema = new Schema<IConversationMember>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['member', 'admin', 'owner'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
  lastReadAt: { type: Date, default: null },
  isMuted: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  unreadCount: { type: Number, default: 0 },
});

// Compound unique constraint: a user can only be in a conversation once
ConversationMemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

// Compound query index for fetching user's active chats sorted in sidebar
ConversationMemberSchema.index({ userId: 1, isArchived: 1 });

const ConversationMember: Model<IConversationMember> =
  mongoose.models.ConversationMember ||
  mongoose.model<IConversationMember>('ConversationMember', ConversationMemberSchema);

export default ConversationMember;
