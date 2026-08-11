import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoomMemberDocument extends Document {
  roomId: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userImage?: string;
  role: 'host' | 'co-host' | 'participant';
  status: 'pending' | 'approved' | 'rejected';
  isMuted: boolean;
  isCameraOff: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  socketId?: string;
  joinedAt: Date;
  leftAt?: Date;
  micDuration: number;
  camDuration: number;
  speakingDuration: number;
}

const RoomMemberSchema = new Schema<IRoomMemberDocument>(
  {
    roomId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userImage: { type: String },
    role: { type: String, enum: ['host', 'co-host', 'participant'], default: 'participant' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    isMuted: { type: Boolean, default: false },
    isCameraOff: { type: Boolean, default: false },
    isHandRaised: { type: Boolean, default: false },
    isScreenSharing: { type: Boolean, default: false },
    isSpeaking: { type: Boolean, default: false },
    socketId: { type: String },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
    micDuration: { type: Number, default: 0 },
    camDuration: { type: Number, default: 0 },
    speakingDuration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

RoomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.RoomMember;
}

const RoomMember: Model<IRoomMemberDocument> =
  mongoose.models.RoomMember || mongoose.model<IRoomMemberDocument>('RoomMember', RoomMemberSchema);

export default RoomMember;
