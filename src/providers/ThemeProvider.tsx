'use client';

import { useEffect } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { ALL_THEMES } from '../lib/themes';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeId, mode } = useThemeStore();

  useEffect(() => {
    const theme = ALL_THEMES.find((t) => t.id === themeId);
    if (!theme) return;

    const vars = mode === 'dark' ? theme.dark : theme.light;
    const root = document.documentElement;

    // Apply all CSS variables to :root
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Toggle light class on html element for any light-mode specific overrides
    if (mode === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [themeId, mode]);

  return <>{children}</>;
}
