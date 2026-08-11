'use client';

import React, { useState } from 'react';
import { ALL_THEMES, AppTheme } from '../../lib/themes';
import { useThemeStore } from '../../store/useThemeStore';

interface ThemeSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeSwitcher({ isOpen, onClose }: ThemeSwitcherProps) {
  const { themeId, mode, setThemeId, setMode } = useThemeStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    setThemeId(id);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              🎨 Choose a Theme
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {ALL_THEMES.length} themes available — changes apply instantly
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Dark / Light Toggle */}
            <div
              className="flex rounded-lg overflow-hidden border"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <button
                onClick={() => setMode('dark')}
                className="px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: mode === 'dark' ? 'var(--accent-green)' : 'transparent',
                  color: mode === 'dark' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                🌙 Dark
              </button>
              <button
                onClick={() => setMode('light')}
                className="px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: mode === 'light' ? 'var(--accent-green)' : 'transparent',
                  color: mode === 'light' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                ☀️ Light
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-colors"
              style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-input)' }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_THEMES.map((theme: AppTheme) => {
              const isActive = themeId === theme.id;
              const isHovered = hoveredId === theme.id;

              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelect(theme.id)}
                  onMouseEnter={() => setHoveredId(theme.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="relative rounded-xl overflow-hidden text-left transition-all duration-200 group"
                  style={{
                    border: `2px solid ${isActive ? theme.previewAccent : 'transparent'}`,
                    transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                    boxShadow: isActive
                      ? `0 0 0 1px ${theme.previewAccent}40, 0 4px 20px ${theme.previewAccent}30`
                      : '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Mini Preview */}
                  <div
                    className="h-20 w-full relative overflow-hidden"
                    style={{ backgroundColor: theme.previewBg }}
                  >
                    {/* Fake sidebar strip */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-10 flex flex-col gap-1 p-1.5"
                      style={{ backgroundColor: theme.previewBg, filter: 'brightness(0.75)' }}
                    >
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-5 h-1.5 rounded-full"
                          style={{ backgroundColor: i === 1 ? theme.previewAccent : '#ffffff20' }}
                        />
                      ))}
                    </div>

                    {/* Fake chat bubbles */}
                    <div className="absolute right-2 top-2 left-12 flex flex-col gap-1.5">
                      <div
                        className="self-end rounded-lg px-2 py-1"
                        style={{ backgroundColor: theme.previewBubble, width: '70%', height: '10px' }}
                      />
                      <div
                        className="self-start rounded-lg px-2 py-1"
                        style={{ backgroundColor: '#ffffff15', width: '55%', height: '10px' }}
                      />
                      <div
                        className="self-end rounded-lg"
                        style={{ backgroundColor: theme.previewBubble, width: '45%', height: '10px' }}
                      />
                    </div>

                    {/* Fake input bar */}
                    <div
                      className="absolute bottom-0 left-10 right-0 h-6 flex items-center px-2"
                      style={{ backgroundColor: '#ffffff08' }}
                    >
                      <div className="flex-1 h-2.5 rounded-full" style={{ backgroundColor: '#ffffff12' }} />
                      <div
                        className="w-4 h-4 rounded-full ml-1.5 flex items-center justify-center"
                        style={{ backgroundColor: theme.previewAccent }}
                      />
                    </div>

                    {/* Active checkmark */}
                    {isActive && (
                      <div
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: theme.previewAccent }}
                      >
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div
                    className="px-3 py-2 flex items-center gap-2"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <span className="text-sm">{theme.emoji}</span>
                    <div className="min-w-0">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: isActive ? theme.previewAccent : 'var(--text-primary)' }}
                      >
                        {theme.name}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-tertiary)' }}
        >
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            ✦ Selected: <span style={{ color: 'var(--accent-green)' }}>
              {ALL_THEMES.find((t) => t.id === themeId)?.name}
            </span> · {mode === 'dark' ? '🌙 Dark' : '☀️ Light'} mode
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-green)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
