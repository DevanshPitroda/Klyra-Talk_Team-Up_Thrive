export type UserRole = 'host' | 'co-host' | 'participant';

export type MemberStatus = 'pending' | 'approved' | 'rejected';

export type RoomVisibility = 'public' | 'private';

export interface IRoomPermissions {
  allowCamera: boolean;
  allowMic: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
}

export interface IStudyRoom {
  _id: string;
  roomId: string; // e.g. "XH9K-7PQR"
  name: string;
  hostId: string;
  hostName: string;
  password?: string;
  isPasswordProtected: boolean;
  visibility: RoomVisibility;
  maxParticipants: number;
  permissions: IRoomPermissions;
  isLocked: boolean;
  autoAdmit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IRoomMember {
  _id: string;
  roomId: string;
  userId: string;
  userName: string;
  userImage?: string;
  role: UserRole;
  status: MemberStatus;
  isMuted: boolean;
  isCameraOff: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  socketId?: string;
  joinedAt: string;
  leftAt?: string;
  micDuration: number;
  camDuration: number;
  speakingDuration: number;
}

export interface ICreateRoomPayload {
  name: string;
  password?: string;
  visibility: RoomVisibility;
  maxParticipants: number;
  permissions: IRoomPermissions;
  autoAdmit?: boolean;
}

export interface IJoinRoomPayload {
  roomId: string;
  password?: string;
}
