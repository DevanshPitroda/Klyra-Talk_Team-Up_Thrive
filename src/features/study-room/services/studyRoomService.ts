import { ICreateRoomPayload, IJoinRoomPayload } from '../types';

export const studyRoomService = {
  async createRoom(payload: ICreateRoomPayload) {
    const res = await fetch('/api/study-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getRoomDetails(roomId: string) {
    const res = await fetch(`/api/study-rooms/${roomId}`);
    return res.json();
  },

  async joinRoom(roomId: string, password?: string, userName?: string) {
    const res = await fetch(`/api/study-rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, userName }),
    });
    return res.json();
  },
};
