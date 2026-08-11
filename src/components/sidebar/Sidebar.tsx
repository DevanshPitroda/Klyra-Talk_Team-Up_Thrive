'use client';

import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import SidebarTabs from './SidebarTabs';
import ChatList from '../chat/ChatList';
import ContactSearch from './ContactSearch';

import { useChatStore } from '../../store/useChatStore';
import { useUIStore } from '../../store/useUIStore';

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { activeMeetingRoomId, setActiveMeetingRoomId } = useChatStore();

  return (
    <div className="w-full h-full flex flex-col relative bg-bg-secondary select-none">
      {/* Discord-style Active Voice Channel Banner */}
      {activeMeetingRoomId && (
        <div className="bg-brand-green/15 border-b border-brand-green/30 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-green truncate">🔊 Connected to Room</p>
              <p className="text-[10px] text-text-secondary font-mono truncate">{activeMeetingRoomId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveMeetingRoomId(activeMeetingRoomId);
                useUIStore.getState().setSidebarOpen(false);
              }}
              className="px-2.5 py-1 bg-brand-green text-white text-[10px] font-bold rounded-lg hover:bg-brand-hover transition cursor-pointer"
            >
              Open
            </button>
            <button
              onClick={() => setActiveMeetingRoomId(null)}
              className="p-1 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition cursor-pointer"
              title="Disconnect"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Search Input & New Chat Header */}
      <div className="p-3 bg-bg-secondary shrink-0 border-b border-border-default/40 flex items-center gap-2">
        <div className="bg-bg-input flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-transparent focus-within:border-brand-green/40 transition">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-xs text-text-primary placeholder-text-muted"
          />
        </div>
        <button
          onClick={() => setIsSearchActive(true)}
          className="p-2 rounded-xl border border-border-default/40 hover:border-brand-green/40 transition-colors cursor-pointer text-text-secondary hover:text-brand-green shrink-0"
          style={{ background: 'var(--bg-input)' }}
          title="New Direct Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Chips Bar */}
      <SidebarTabs />

      {/* Conversations List */}
      <ChatList searchQuery={searchQuery} />

      {/* Contact Discovery Overlay */}
      {isSearchActive && (
        <ContactSearch onClose={() => setIsSearchActive(false)} />
      )}
    </div>
  );
}
