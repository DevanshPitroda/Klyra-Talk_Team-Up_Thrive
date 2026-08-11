import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password?: string;       // Hashed — only for credential-based accounts
  image?: string;
  about: string;
  phone?: string;
  role: 'user' | 'admin';
  isOnline: boolean;
  lastSeen?: Date;
  emailVerified?: Date;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:     { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email:    { type: String, required: true, unique: true, index: true },
    password: { type: String, default: null, select: false }, // Never returned in queries by default
    image:    { type: String, default: null },
    about:    { type: String, default: 'Hey there! I am using Klyra' },
    phone:    { type: String, sparse: true, unique: true },
    role:     { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    isOnline: { type: Boolean, default: false, index: true },
    lastSeen: { type: Date, default: null },
    emailVerified: { type: Date, default: null },
    isBanned: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Search indexes for directory search queries
UserSchema.index({ name: 'text', email: 'text', username: 'text' });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
