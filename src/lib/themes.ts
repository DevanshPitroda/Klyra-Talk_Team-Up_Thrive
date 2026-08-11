// ══════════════════════════════════════════════════════════════
//  All App Themes — CSS Variable Definitions
//  Each theme defines dark + light mode variables
// ══════════════════════════════════════════════════════════════

export interface ThemeVars {
  '--background': string;
  '--foreground': string;
  '--bg-primary': string;
  '--bg-secondary': string;
  '--bg-tertiary': string;
  '--bg-input': string;
  '--bg-bubble-sent': string;
  '--bg-bubble-rcvd': string;
  '--accent-green': string;
  '--accent-hover': string;
  '--text-primary': string;
  '--text-secondary': string;
  '--text-muted': string;
  '--border-default': string;
  '--online-dot': string;
  '--unread-badge': string;
}

export interface AppTheme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  previewBg: string;
  previewAccent: string;
  previewBubble: string;
  dark: ThemeVars;
  light: ThemeVars;
}

export const ALL_THEMES: AppTheme[] = [
  // ─────────────────────────────────────────────────────────
  // 1. WhatsApp Dark (Default)
  // ─────────────────────────────────────────────────────────
  {
    id: 'whatsapp-dark',
    name: 'WhatsApp Dark',
    emoji: '💬',
    description: 'The classic. Deep teal greens on dark.',
    previewBg: '#111b21',
    previewAccent: '#00a884',
    previewBubble: '#005c4b',
    dark: {
      '--background': '#111b21',
      '--foreground': '#e9edef',
      '--bg-primary': '#111b21',
      '--bg-secondary': '#1f2c34',
      '--bg-tertiary': '#0b141a',
      '--bg-input': '#2a3942',
      '--bg-bubble-sent': '#005c4b',
      '--bg-bubble-rcvd': '#1f2c34',
      '--accent-green': '#00a884',
      '--accent-hover': '#06cf9c',
      '--text-primary': '#e9edef',
      '--text-secondary': '#8696a0',
      '--text-muted': '#667781',
      '--border-default': '#2a3942',
      '--online-dot': '#31c557',
      '--unread-badge': '#00a884',
    },
    light: {
      '--background': '#ffffff',
      '--foreground': '#111b21',
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f0f2f5',
      '--bg-tertiary': '#efeae2',
      '--bg-input': '#f0f2f5',
      '--bg-bubble-sent': '#d9fdd3',
      '--bg-bubble-rcvd': '#ffffff',
      '--accent-green': '#00a884',
      '--accent-hover': '#06cf9c',
      '--text-primary': '#111b21',
      '--text-secondary': '#667781',
      '--text-muted': '#8696a0',
      '--border-default': '#e9edef',
      '--online-dot': '#31c557',
      '--unread-badge': '#00a884',
    },
  },

  // ─────────────────────────────────────────────────────────
  // 2. Midnight Indigo
  // ─────────────────────────────────────────────────────────
  {
    id: 'midnight-indigo',
    name: 'Midnight Indigo',
    emoji: '🌌',
    description: 'Deep navy with violet purple. Discord × Linear.',
    previewBg: '#0d1117',
    previewAccent: '#7c3aed',
    previewBubble: '#1d3557',
    dark: {
      '--background': '#0d1117',
      '--foreground': '#e6edf3',
      '--bg-primary': '#0d1117',
      '--bg-secondary': '#161b22',
      '--bg-tertiary': '#1c2128',
      '--bg-input': '#21262d',
      '--bg-bubble-sent': '#1d3557',
      '--bg-bubble-rcvd': '#161b22',
      '--accent-green': '#7c3aed',
      '--accent-hover': '#8b5cf6',
      '--text-primary': '#e6edf3',
      '--text-secondary': '#8b949e',
      '--text-muted': '#6e7681',
      '--border-default': '#30363d',
      '--online-dot': '#3fb950',
      '--unread-badge': '#7c3aed',
    },
    light: {
      '--background': '#f0f4ff',
      '--foreground': '#0d1117',
      '--bg-primary': '#f0f4ff',
      '--bg-secondary': '#e4e8f7',
      '--bg-tertiary': '#d9def0',
      '--bg-input': '#e4e8f7',
      '--bg-bubble-sent': '#ede9fe',
      '--bg-bubble-rcvd': '#ffffff',
      '--accent-green': '#7c3aed',
      '--accent-hover': '#6d28d9',
      '--text-primary': '#0d1117',
      '--text-secondary': '#4b5563',
      '--text-muted': '#9ca3af',
      '--border-default': '#d1d9f0',
      '--online-dot': '#3fb950',
      '--unread-badge': '#7c3aed',
    },
  },

  // ─────────────────────────────────────────────────────────
  // 3. Catppuccin Mocha
  // ─────────────────────────────────────────────────────────
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    emoji: '🌸',
    description: 'Cozy warm dark purples. Loved by developers.',
    previewBg: '#1e1e2e',
    previewAccent: '#cba6f7',
    previewBubble: '#45475a',
    dark: {
      '--background': '#1e1e2e',
      '--foreground': '#cdd6f4',
      '--bg-primary': '#1e1e2e',
      '--bg-secondary': '#181825',
      '--bg-tertiary': '#313244',
      '--bg-input': '#313244',
      '--bg-bubble-sent': '#45475a',
      '--bg-bubble-rcvd': '#181825',
      '--accent-green': '#cba6f7',
      '--accent-hover': '#f5c2e7',
      '--text-primary': '#cdd6f4',
      '--text-secondary': '#a6adc8',
      '--text-muted': '#7f849c',
      '--border-default': '#45475a',
      '--online-dot': '#a6e3a1',
      '--unread-badge': '#cba6f7',
    },
    light: {
      '--background': '#eff1f5',
      '--foreground': '#4c4f69',
      '--bg-primary': '#eff1f5',
      '--bg-secondary': '#e6e9ef',
      '--bg-tertiary': '#dce0e8',
      '--bg-input': '#dce0e8',
      '--bg-bubble-sent': '#f2d5f8',
      '--bg-bubble-rcvd': '#ffffff',
      '--accent-green': '#8839ef',
      '--accent-hover': '#7c3aed',
      '--text-primary': '#4c4f69',
      '--text-secondary': '#6c6f85',
      '--text-muted': '#8c8fa1',
      '--border-default': '#ccd0da',
      '--online-dot': '#40a02b',
      '--unread-badge': '#8839ef',
    },
  },

  // ─────────────────────────────────────────────────────────
  // 4. Supabase Green
  // ─────────────────────────────────────────────────────────
  {
    id: 'supabase-green',
    name: 'Supabase Green',
    emoji: '🌿',
    description: 'Near-black with mint green. Clean & professional.',
    previewBg: '#171717',
    previewAccent: '#3ecf8e',
    previewBubble: '#1a3a2a',
    dark: {
      '--background': '#171717',
      '--foreground': '#f1f1f1',
      '--bg-primary': '#171717',
      '--bg-secondary': '#1c1c1c',
      '--bg-tertiary': '#242424',
      '--bg-input': '#2a2a2a',
      '--bg-bubble-sent': '#1a3a2a',
      '--bg-bubble-rcvd': '#1c1c1c',
      '--accent-green': '#3ecf8e',
      '--accent-hover': '#56d9a2',
      '--text-primary': '#f1f1f1',
      '--text-secondary': '#8e8e8e',
      '--text-muted': '#636363',
      '--border-default': '#2e2e2e',
      '--online-dot': '#3ecf8e',
      '--unread-badge': '#3ecf8e',
    },
    light: {
      '--background': '#fcfcfc',
      '--foreground': '#171717',
      '--bg-primary': '#fcfcfc',
      '--bg-secondary': '#f5f5f5',
      '--bg-tertiary': '#ebebeb',
      '--bg-input': '#f0f0f0',
      '--bg-bubble-sent': '#dcfce7',
      '--bg-bubble-rcvd': '#ffffff',
      '--accent-green': '#18794e',
      '--accent-hover': '#3ecf8e',
      '--text-primary': '#171717',
      '--text-secondary': '#6b6b6b',
      '--text-muted': '#a0a0a0',
      '--border-default': '#e0e0e0',
      '--online-dot': '#3ecf8e',
      '--unread-badge': '#18794e',
    },
  },

  // ─────────────────────────────────────────────────────────
  // 5. Obsidian Amber
  // ─────────────────────────────────────────────────────────
  {
    id: 'obsidian-amber',
    name: 'Obsidian Amber',
    emoji: '🔥',
    description: 'Jet black with glowing amber gold. Bold & unique.',
    previewBg: '#0a0a0a',
    previewAccent: '#f59e0b',
    previewBubble: '#2d1a00',
    dark: {
      '--background': '#0a0a0a',
      '--foreground': '#fafafa',
      '--bg-primary': '#0a0a0a',
      '--bg-secondary': '#111111',
      '--bg-tertiary': '#1a1a1a',
      '--bg-input': '#222222',
      '--bg-bubble-sent': '#2d1a00',
      '--bg-bubble-rcvd': '#111111',
      '--accent-green': '#f59e0b',
      '--accent-hover': '#fbbf24',
      '--text-primary': '#fafafa',
      '--text-secondary': '#a3a3a3',
      '--text-muted': '#6b6b6b',
      '--border-default': '#262626',
      '--online-dot': '#f59e0b',
      '--unread-badge': '#f59e0b',
    },
    light: {
      '--background': '#fffbf0',
      '--foreground': '#1a1a1a',
      '--bg-primary': '#fffbf0',
      '--bg-secondary': '#fff3d6',
      '--bg-tertiary': '#fde89d',
      '--bg-input': '#fff3d6',
      '--bg-bubble-sent': '#fde68a',
      '--bg-bubble-rcvd': '#ffffff',
      '--accent-green': '#d97706',
      '--accent-hover': '#f59e0b',
      '--text-primary': '#1a1a1a',
      '--text-secondary': '#6b7280',
      '--text-muted': '#9ca3af',
      '--border-default': '#fde8a0',
      '--online-dot': '#d97706',
      '--unread-badge': '#d97706',
    },
  },

  // ─────────────────────────────────────────────────────────
  // 6. Ocean Slate
  // ─────────────────────────────────────────────────────────
  {
    id: 'ocean-slate',
    name: 'Ocean Slate',
    emoji: '🌊',
    description: 'Dark navy blue with sky blue. Calm & focused.',
    previewBg: '#0f172a',
    previewAccent: '#0ea5e9',
    previewBubble: '#164e63',
    dark: {
      '--background': '#0f172a',
      '--foreground': '#f1f5f9',
      '--bg-primary': '#0f172a',
      '--bg-secondary': '#1e293b',
      '--bg-tertiary': '#253347',
      '--bg-input': '#334155',
      '--bg-bubble-sent': '#164e63',
      '--bg-bubble-rcvd': '#1e293b',
      '--accent-green': '#0ea5e9',
      '--accent-hover': '#38bdf8',
      '--text-primary': '#f1f5f9',
      '--text-secondary': '#94a3b8',
      '--text-muted': '#64748b',
      '--border-default': '#334155',
      '--online-dot': '#22d3ee',
      '--unread-badge': '#0ea5e9',
    },
    light: {
      '--background': '#f8fafc',
      '--foreground': '#0f172a',
      '--bg-primary': '#f8fafc',
      '--bg-secondary': '#f1f5f9',
      '--bg-tertiary': '#e2e8f0',
      '--bg-input': '#e8eef5',
      '--bg-bubble-sent': '#e0f2fe',
      '--bg-bubble-rcvd': '#ffffff',
      '--accent-green': '#0284c7',
      '--accent-hover': '#0ea5e9',
      '--text-primary': '#0f172a',
      '--text-secondary': '#475569',
      '--text-muted': '#94a3b8',
      '--border-default': '#e2e8f0',
      '--online-dot': '#22d3ee',
      '--unread-badge': '#0284c7',
    },
  },

  // ─────────────────────────────────────────────────────────
  // 7. Noir Rose Gold (NEW)
  // ─────────────────────────────────────────────────────────
  {
    id: 'noir-rose-gold',
    name: 'Noir Rose Gold',
    emoji: '✦',
    description: 'Gunmetal dark with luxurious rose gold. Editorial luxury.',
    previewBg: '#141416',
    previewAccent: '#c9748a',
    previewBubble: '#3d1a2e',
    dark: {
      '--background': '#141416',
      '--foreground': '#f7f4f2',
      '--bg-primary': '#141416',
      '--bg-secondary': '#1a1a1e',
      '--bg-tertiary': '#1f1f24',
      '--bg-input': '#252529',
      '--bg-bubble-sent': '#3d1a2e',
      '--bg-bubble-rcvd': '#1f1f24',
      '--accent-green': '#c9748a',
      '--accent-hover': '#d9889e',
      '--text-primary': '#f7f4f2',
      '--text-secondary': '#9a8f8c',
      '--text-muted': '#5e5552',
      '--border-default': '#2a2a30',
      '--online-dot': '#e8a0b0',
      '--unread-badge': '#c9748a',
    },
    light: {
      '--background': '#fdf6f0',
      '--foreground': '#1a1016',
      '--bg-primary': '#fdf6f0',
      '--bg-secondary': '#f5ede6',
      '--bg-tertiary': '#ede0d8',
      '--bg-input': '#f0e4dc',
      '--bg-bubble-sent': '#f5d0da',
      '--bg-bubble-rcvd': '#ffffff',
      '--accent-green': '#a8495e',
      '--accent-hover': '#c9748a',
      '--text-primary': '#1a1016',
      '--text-secondary': '#7a5f62',
      '--text-muted': '#b08890',
      '--border-default': '#e8d5cc',
      '--online-dot': '#c9748a',
      '--unread-badge': '#a8495e',
    },
  },

  // ─────────────────────────────────────────────────────────
  // 8. Carbon Crimson (NEW)
  // ─────────────────────────────────────────────────────────
  {
    id: 'carbon-crimson',
    name: 'Carbon Crimson',
    emoji: '⬛',
    description: 'True black with vivid red. Bold like a trading platform.',
    previewBg: '#0c0c0c',
    previewAccent: '#e53e3e',
    previewBubble: '#2a0a0a',
    dark: {
      '--background': '#0c0c0c',
      '--foreground': '#fafafa',
      '--bg-primary': '#0c0c0c',
      '--bg-secondary': '#111111',
      '--bg-tertiary': '#161616',
      '--bg-input': '#1f1f1f',
      '--bg-bubble-sent': '#2a0a0a',
      '--bg-bubble-rcvd': '#161616',
      '--accent-green': '#e53e3e',
      '--accent-hover': '#fc5e5e',
      '--text-primary': '#fafafa',
      '--text-secondary': '#a0a0a0',
      '--text-muted': '#666666',
      '--border-default': '#222222',
      '--online-dot': '#e53e3e',
      '--unread-badge': '#e53e3e',
    },
    light: {
      '--background': '#fff5f5',
      '--foreground': '#1a0000',
      '--bg-primary': '#fff5f5',
      '--bg-secondary': '#ffe8e8',
      '--bg-tertiary': '#fdd',
      '--bg-input': '#ffe8e8',
      '--bg-bubble-sent': '#fed7d7',
      '--bg-bubble-rcvd': '#ffffff',
      '--accent-green': '#c53030',
      '--accent-hover': '#e53e3e',
      '--text-primary': '#1a0000',
      '--text-secondary': '#718096',
      '--text-muted': '#a0aec0',
      '--border-default': '#fed7d7',
      '--online-dot': '#e53e3e',
      '--unread-badge': '#c53030',
    },
  },

  // ─────────────────────────────────────────────────────────
  // 9. Arctic Frost (NEW)
  // ─────────────────────────────────────────────────────────
  {
    id: 'arctic-frost',
    name: 'Arctic Frost',
    emoji: '❄️',
    description: 'Pure white with electric blue. Clean enterprise look.',
    previewBg: '#f4f7fb',
    previewAccent: '#2563eb',
    previewBubble: '#dbeafe',
    dark: {
      '--background': '#0f1923',
      '--foreground': '#e2e8f0',
      '--bg-primary': '#0f1923',
      '--bg-secondary': '#172033',
      '--bg-tertiary': '#1e2a40',
      '--bg-input': '#263350',
      '--bg-bubble-sent': '#1e3a5f',
      '--bg-bubble-rcvd': '#172033',
      '--accent-green': '#3b82f6',
      '--accent-hover': '#60a5fa',
      '--text-primary': '#e2e8f0',
      '--text-secondary': '#94a3b8',
      '--text-muted': '#64748b',
      '--border-default': '#263350',
      '--online-dot': '#22d3ee',
      '--unread-badge': '#3b82f6',
    },
    light: {
      '--background': '#ffffff',
      '--foreground': '#0f172a',
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f4f7fb',
      '--bg-tertiary': '#eaf0f9',
      '--bg-input': '#eef2f8',
      '--bg-bubble-sent': '#dbeafe',
      '--bg-bubble-rcvd': '#ffffff',
      '--accent-green': '#2563eb',
      '--accent-hover': '#3b82f6',
      '--text-primary': '#0f172a',
      '--text-secondary': '#475569',
      '--text-muted': '#94a3b8',
      '--border-default': '#e2e8f0',
      '--online-dot': '#2563eb',
      '--unread-badge': '#2563eb',
    },
  },

  // ─────────────────────────────────────────────────────────
  // 10. Cyber Neon (NEW)
  // ─────────────────────────────────────────────────────────
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    emoji: '⚡',
    description: 'Deep navy black with neon cyan glow. Futuristic energy.',
    previewBg: '#080c14',
    previewAccent: '#00ffcc',
    previewBubble: '#0d2450',
    dark: {
      '--background': '#080c14',
      '--foreground': '#e0f7f4',
      '--bg-primary': '#080c14',
      '--bg-secondary': '#0d1220',
      '--bg-tertiary': '#121a2e',
      '--bg-input': '#1a2540',
      '--bg-bubble-sent': '#0d2450',
      '--bg-bubble-rcvd': '#0d1220',
      '--accent-green': '#00ffcc',
      '--accent-hover': '#33ffda',
      '--text-primary': '#e0f7f4',
      '--text-secondary': '#7ab8b0',
      '--text-muted': '#3d7070',
      '--border-default': '#1a2e40',
      '--online-dot': '#00ffcc',
      '--unread-badge': '#00ffcc',
    },
    light: {
      '--background': '#f0fffe',
      '--foreground': '#00332b',
      '--bg-primary': '#f0fffe',
      '--bg-secondary': '#e0fdf9',
      '--bg-tertiary': '#ccfbf1',
      '--bg-input': '#e0fdf9',
      '--bg-bubble-sent': '#99f6e4',
      '--bg-bubble-rcvd': '#ffffff',
      '--accent-green': '#0d9488',
      '--accent-hover': '#14b8a6',
      '--text-primary': '#00332b',
      '--text-secondary': '#0f766e',
      '--text-muted': '#5eead4',
      '--border-default': '#ccfbf1',
      '--online-dot': '#0d9488',
      '--unread-badge': '#0d9488',
    },
  },

  // ─────────────────────────────────────────────────────────
  // 11. Golden Dusk (NEW)
  // ─────────────────────────────────────────────────────────
  {
    id: 'golden-dusk',
    name: 'Golden Dusk',
    emoji: '🌅',
    description: 'Espresso dark with brilliant gold. Ultra luxury Bloomberg vibes.',
    previewBg: '#1a1208',
    previewAccent: '#f0a500',
    previewBubble: '#3d2a00',
    dark: {
      '--background': '#1a1208',
      '--foreground': '#faf3e0',
      '--bg-primary': '#1a1208',
      '--bg-secondary': '#201608',
      '--bg-tertiary': '#271c08',
      '--bg-input': '#302010',
      '--bg-bubble-sent': '#3d2a00',
      '--bg-bubble-rcvd': '#201a10',
      '--accent-green': '#f0a500',
      '--accent-hover': '#f5bc33',
      '--text-primary': '#faf3e0',
      '--text-secondary': '#c8b080',
      '--text-muted': '#7a6040',
      '--border-default': '#3a2c10',
      '--online-dot': '#f0a500',
      '--unread-badge': '#f0a500',
    },
    light: {
      '--background': '#fffdf0',
      '--foreground': '#1a1000',
      '--bg-primary': '#fffdf0',
      '--bg-secondary': '#fff8d6',
      '--bg-tertiary': '#fff0aa',
      '--bg-input': '#fff8d6',
      '--bg-bubble-sent': '#fde68a',
      '--bg-bubble-rcvd': '#ffffff',
      '--accent-green': '#b7791f',
      '--accent-hover': '#d69e2e',
      '--text-primary': '#1a1000',
      '--text-secondary': '#7b6214',
      '--text-muted': '#c09a38',
      '--border-default': '#fde8a0',
      '--online-dot': '#d69e2e',
      '--unread-badge': '#b7791f',
    },
  },
];

export const DEFAULT_THEME_ID = 'whatsapp-dark';
