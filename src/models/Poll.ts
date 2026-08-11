import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPollOption {
  text: string;
  votes: mongoose.Types.ObjectId[];
}

export interface IPoll extends Document {
  messageId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  question: string;
  options: IPollOption[];
  createdAt: Date;
  updatedAt: Date;
}

const PollOptionSchema = new Schema<IPollOption>({
  text: { type: String, required: true },
  votes: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
});

const PollSchema = new Schema<IPoll>(
  {
    messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    question: { type: String, required: true },
    options: [PollOptionSchema],
  },
  { timestamps: true }
);

const Poll: Model<IPoll> =
  mongoose.models.Poll || mongoose.model<IPoll>('Poll', PollSchema);

export default Poll;
