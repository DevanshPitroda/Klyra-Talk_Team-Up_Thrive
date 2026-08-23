'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '../../store/useUIStore';

export default function SidebarTabs() {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const filterChips: Array<{ id: 'chats' | 'groups'; label: string }> = [
    { id: 'chats', label: 'All' },
    { id: 'groups', label: 'Groups' },
  ];

  return (
    <div
      className="px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto shrink-0 select-none relative"
      style={{ borderColor: 'var(--border-default)', background: 'var(--bg-secondary)' }}
    >
      {filterChips.map((chip) => {
        const isActive = activeTab === chip.id;
        return (
          <button
            key={chip.id}
            onClick={() => setActiveTab(chip.id)}
            className="relative px-3.5 py-1 rounded-full text-xs font-bold transition-colors shrink-0 cursor-pointer"
            style={{
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="active-chip"
                className="absolute inset-0 rounded-full shadow-sm"
                style={{ background: 'var(--accent-green)' }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
}
