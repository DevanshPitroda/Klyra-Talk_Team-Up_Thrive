import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_THEME_ID } from '../lib/themes';

interface ThemeStoreState {
  themeId: string;
  mode: 'dark' | 'light';
  setThemeId: (id: string) => void;
  setMode: (mode: 'dark' | 'light') => void;
}

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME_ID,
      mode: 'dark',
      setThemeId: (themeId) => set({ themeId }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'chatapp-theme', // localStorage key
    }
  )
);
