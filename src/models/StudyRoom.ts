import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudyRoomDocument extends Document {
  roomId: string;
  name: string;
  hostId: mongoose.Types.ObjectId;
  hostName: string;
  password?: string;
  isPasswordProtected: boolean;
  visibility: 'public' | 'private';
  maxParticipants: number;
  permissions: {
    allowCamera: boolean;
    allowMic: boolean;
    allowScreenShare: boolean;
    allowChat: boolean;
  };
  isLocked: boolean;
  autoAdmit: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudyRoomSchema = new Schema<IStudyRoomDocument>(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hostName: { type: String, required: true },
    password: { type: String, select: false },
    isPasswordProtected: { type: Boolean, default: false },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    maxParticipants: { type: Number, default: 25, min: 2, max: 100 },
    permissions: {
      allowCamera: { type: Boolean, default: true },
      allowMic: { type: Boolean, default: true },
      allowScreenShare: { type: Boolean, default: true },
      allowChat: { type: Boolean, default: true },
    },
    isLocked: { type: Boolean, default: false },
    autoAdmit: { type: Boolean, default: true },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.StudyRoom;
}

const StudyRoom: Model<IStudyRoomDocument> =
  mongoose.models.StudyRoom || mongoose.model<IStudyRoomDocument>('StudyRoom', StudyRoomSchema);

export default StudyRoom;
