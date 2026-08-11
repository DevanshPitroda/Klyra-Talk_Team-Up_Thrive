'use client';

import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
      '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
      '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
      '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'
    ]
  },
  {
    name: 'Gestures',
    icon: '👍',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💅', '🤳', '💪', '🦾', '👂', '🦻', '👃', '🧠'
    ]
  },
  {
    name: 'Animals & Nature',
    icon: '🐱',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
      '🐯', '🦁', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉',
      '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇',
      '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞'
    ]
  },
  {
    name: 'Food & Drink',
    icon: '🍕',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑',
      '🥦', '🥬', '🥒', '🌽', '🥕', '🥔', '🥖', '🍞', '🥯', '🥞',
      '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🍣', '🍿', '🍩', '🍪'
    ]
  },
  {
    name: 'Activities',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏹', '🎣', '🤿', '🥊',
      '🥋', '🥇', '🥈', '🥉', '🏆', '🏅', '🎟️', '🎫', '🎪', '🎭'
    ]
  },
  {
    name: 'Hearts & Symbols',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '💟', '🌟', '⭐', '✨', '⚡', '💥', '🔥', '🌈', '☀️', '☁️',
      '💤', '💬', '📢', '🔔', '🔕', '🚫', '⚠️', '💯', '✅', '❌'
    ]
  }
];

export default function EmojiPicker({ onSelectEmoji, onClose }: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="relative bg-bg-secondary border border-border-default/50 rounded-2xl shadow-2xl w-[300px] max-w-[calc(100vw-2rem)] overflow-hidden z-50 flex flex-col h-[320px] transition-colors">
      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-border-default/45 px-2 py-1.5 shrink-0 bg-bg-secondary/40">
        <div className="flex items-center gap-0.5">
          {EMOJI_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => setActiveTab(idx)}
              className={cn(
                'p-1.5 rounded-lg text-lg transition-all cursor-pointer',
                activeTab === idx ? 'bg-brand-green/20 scale-105' : 'hover:bg-bg-input opacity-70 hover:opacity-100'
              )}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-bg-input rounded-full text-text-secondary hover:text-text-primary transition shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Emoji Grid Container */}
      <div className="flex-1 overflow-y-auto p-3 select-none">
        <h4 className="text-[10px] uppercase tracking-wider font-bold text-text-secondary mb-2 select-none">
          {EMOJI_CATEGORIES[activeTab].name}
        </h4>
        <div className="grid grid-cols-8 gap-1.5">
          {EMOJI_CATEGORIES[activeTab].emojis.map((emoji, idx) => (
            <button
              key={`${emoji}-${idx}`}
              onClick={() => onSelectEmoji(emoji)}
              className="text-2xl p-1 hover:bg-bg-input rounded-lg active:scale-95 transition cursor-pointer flex items-center justify-center h-10 w-10"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
