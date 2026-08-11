import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean; // Relevant on mobile to toggle list view vs message view
  activeTab: 'chats' | 'groups' | 'status';
  isProfileOpen: boolean; // Slider info panel open on desktop
  isRightInfoOpen: boolean; // Right side details drawer
  theme: 'dark' | 'light' | 'system';

  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: 'chats' | 'groups' | 'status') => void;
  setProfileOpen: (isOpen: boolean) => void;
  toggleRightInfo: () => void;
  setRightInfoOpen: (isOpen: boolean) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  activeTab: 'chats',
  isProfileOpen: false,
  isRightInfoOpen: false,
  theme: 'dark',

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setProfileOpen: (isProfileOpen) => set({ isProfileOpen }),
  toggleRightInfo: () => set((state) => ({ isRightInfoOpen: !state.isRightInfoOpen })),
  setRightInfoOpen: (isOpen) => set({ isRightInfoOpen: isOpen }),
  setTheme: (theme) => set({ theme }),
}));
export type { UIState };
