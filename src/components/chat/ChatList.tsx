'use client';

import React from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useUIStore } from '../../store/useUIStore';
import ChatListItem from './ChatListItem';

interface ChatListProps {
  searchQuery: string;
}

export default function ChatList({ searchQuery }: ChatListProps) {
  const { conversations, activeConversationId, setActiveConversationId, onlineUserIds } = useChatStore();
  const { activeTab, setSidebarOpen } = useUIStore();

  const handleChatClick = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setSidebarOpen(false);
  };

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'chats' && c.type !== 'direct') return false;
    if (activeTab === 'groups' && c.type !== 'group') return false;

    if (searchQuery.trim() !== '') {
      const nameToSearch = c.name || c.members?.[0]?.name || '';
      return nameToSearch.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const otherConversations = filteredConversations.filter((c) => !c.isPinned);

  if (filteredConversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-12 h-12 text-text-muted mb-3"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 9.75a.625.625 0 1 1-1.25 0 .625.625 0 0 1 1.25 0Zm0 0H8.25m4.125 0a.625.625 0 1 1-1.25 0 .625.625 0 0 1 1.25 0Zm0 0H12m4.125 0a.625.625 0 1 1-1.25 0 .625.625 0 0 1 1.25 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
          />
        </svg>
        <p className="text-sm text-text-secondary">No chats found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-bg-primary">
      {/* Pinned Section Header & Items */}
      {pinnedConversations.length > 0 && (
        <div>
          <div className="px-4 py-1.5 bg-bg-secondary/40 border-b border-border-default/30 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <span>📌 Pinned ({pinnedConversations.length}/3)</span>
          </div>
          {pinnedConversations.map((conv) => {
            const otherMember = conv.members?.[0];
            const isOnline = otherMember ? onlineUserIds.has(otherMember._id) : false;

            return (
              <ChatListItem
                key={conv._id}
                conversation={conv}
                isActive={activeConversationId === conv._id}
                isOnline={isOnline}
                onClick={() => handleChatClick(conv._id)}
              />
            );
          })}
        </div>
      )}

      {/* All Chats Section */}
      {otherConversations.length > 0 && (
        <div>
          {pinnedConversations.length > 0 && (
            <div className="px-4 py-1.5 bg-bg-secondary/40 border-b border-border-default/30 text-[10px] font-bold text-text-muted uppercase tracking-wider">
              <span>All Chats</span>
            </div>
          )}
          {otherConversations.map((conv) => {
            const otherMember = conv.members?.[0];
            const isOnline = otherMember ? onlineUserIds.has(otherMember._id) : false;

            return (
              <ChatListItem
                key={conv._id}
                conversation={conv}
                isActive={activeConversationId === conv._id}
                isOnline={isOnline}
                onClick={() => handleChatClick(conv._id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
