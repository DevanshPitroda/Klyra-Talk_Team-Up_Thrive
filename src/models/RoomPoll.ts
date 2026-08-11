import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPollOption {
  id: number;
  text: string;
  votes: number;
  voters: string[]; // array of userId strings
}

export interface IRoomPollDocument extends Document {
  roomId: string;
  question: string;
  options: IPollOption[];
  isAnonymous: boolean;
  totalVotes: number;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
}

const PollOptionSchema = new Schema(
  {
    id: { type: Number, required: true },
    text: { type: String, required: true },
    votes: { type: Number, default: 0 },
    voters: [{ type: String }],
  },
  { _id: false }
);

const RoomPollSchema = new Schema<IRoomPollDocument>(
  {
    roomId: { type: String, required: true, index: true },
    question: { type: String, required: true },
    options: [PollOptionSchema],
    isAnonymous: { type: Boolean, default: false },
    totalVotes: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (mongoose.models as any).RoomPoll;
}

const RoomPoll: Model<IRoomPollDocument> =
  mongoose.models.RoomPoll || mongoose.model<IRoomPollDocument>('RoomPoll', RoomPollSchema);

export default RoomPoll;
