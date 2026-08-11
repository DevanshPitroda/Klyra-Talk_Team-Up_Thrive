import { create } from 'zustand';
import { IStudyRoom, IRoomMember, UserRole } from '../types';

interface StudyRoomState {
  currentRoom: IStudyRoom | null;
  currentUserRole: UserRole | null;
  members: IRoomMember[];
  isCreationModalOpen: boolean;
  isWaitingRoom: boolean;
  activeTab: 'video' | 'whiteboard' | 'notes' | 'presentation';
  
  // Actions
  setCurrentRoom: (room: IStudyRoom | null) => void;
  setCurrentUserRole: (role: UserRole | null) => void;
  setMembers: (members: IRoomMember[]) => void;
  addMember: (member: IRoomMember) => void;
  updateMember: (userId: string, updates: Partial<IRoomMember>) => void;
  removeMember: (userId: string) => void;
  setIsCreationModalOpen: (isOpen: boolean) => void;
  setIsWaitingRoom: (isWaiting: boolean) => void;
  setActiveTab: (tab: 'video' | 'whiteboard' | 'notes' | 'presentation') => void;
  resetRoomState: () => void;
}

export const useStudyRoomStore = create<StudyRoomState>((set) => ({
  currentRoom: null,
  currentUserRole: null,
  members: [],
  isCreationModalOpen: false,
  isWaitingRoom: false,
  activeTab: 'video',

  setCurrentRoom: (room) => set({ currentRoom: room }),
  setCurrentUserRole: (role) => set({ currentUserRole: role }),
  setMembers: (members) => set({ members }),
  addMember: (member) =>
    set((state) => ({
      members: [...state.members.filter((m) => m.userId !== member.userId), member],
    })),
  updateMember: (userId, updates) =>
    set((state) => ({
      members: state.members.map((m) => (m.userId === userId ? { ...m, ...updates } : m)),
    })),
  removeMember: (userId) =>
    set((state) => ({
      members: state.members.filter((m) => m.userId !== userId),
    })),
  setIsCreationModalOpen: (isOpen) => set({ isCreationModalOpen: isOpen }),
  setIsWaitingRoom: (isWaiting) => set({ isWaitingRoom: isWaiting }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  resetRoomState: () =>
    set({
      currentRoom: null,
      currentUserRole: null,
      members: [],
      isWaitingRoom: false,
      activeTab: 'video',
    }),
}));
