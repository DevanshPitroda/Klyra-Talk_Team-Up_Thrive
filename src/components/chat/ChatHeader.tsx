'use client';

import React, { useState } from 'react';
import Avatar from '../ui/Avatar';
import { useChatStore } from '../../store/useChatStore';
import { useUIStore } from '../../store/useUIStore';
import { cn } from '../../utils/cn';
import { useSession } from 'next-auth/react';
import { MoreVertical } from 'lucide-react';
import DirectCallModal from './DirectCallModal';
import ChatSettingsModal from './ChatSettingsModal';

const EMPTY_ARRAY: string[] = [];

export default function ChatHeader() {
  const { data: session } = useSession();
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const conversations = useChatStore((state) => state.conversations);
  const onlineUserIds = useChatStore((state) => state.onlineUserIds);
  const messages = useChatStore((state) => state.messages);
  const setActiveMeetingRoomId = useChatStore((state) => state.setActiveMeetingRoomId);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const messageSearchQuery = useChatStore((state) => state.messageSearchQuery);
  const setMessageSearchQuery = useChatStore((state) => state.setMessageSearchQuery);
  const activeTyping = useChatStore((state) =>
    state.activeConversationId ? state.typingUsers[state.activeConversationId] || EMPTY_ARRAY : EMPTY_ARRAY
  );
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const toggleRightInfo = useUIStore((state) => state.toggleRightInfo);
  const isRightInfoOpen = useUIStore((state) => state.isRightInfoOpen);

  const conversation = conversations.find((c) => c._id === activeConversationId);

  // 1-on-1 Call Modal State
  const [directCallType, setDirectCallType] = useState<'audio' | 'video' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleTimerChange = (newTimer: 'off' | '24h' | 'view_once') => {
    if (activeConversationId) {
      updateConversation(activeConversationId, { disappearingTimer: newTimer });
    }
  };

  if (!conversation) return null;

  const chatName = conversation.name || conversation.members[0]?.name || 'Chat';
  const chatImage = conversation.image || conversation.members[0]?.image;

  const isDirect = conversation.type === 'direct';
  const isOnline = isDirect && conversation.members[0] ? onlineUserIds.has(conversation.members[0]._id) : false;

  const isTyping = activeTyping.length > 0;

  let statusText = '';
  let isTypingText = false;

  if (isTyping) {
    isTypingText = true;
    if (isDirect) {
      statusText = 'typing...';
    } else {
      statusText = `${activeTyping.join(', ')} ${activeTyping.length === 1 ? 'is' : 'are'} typing...`;
    }
  } else if (isDirect) {
    statusText = isOnline ? 'Online' : 'Offline';
  } else {
    statusText = `${conversation.members.length} members`;
  }

  const chatMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const pinnedMessage = chatMessages.find((m) => m.isPinned);

  const handleStartGroupCallFromDirect = async (invitedUserIds: string[]) => {
    const newRoomCode = `GROUP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    try {
      await fetch('/api/study-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${chatName}'s Group Call`,
          roomId: newRoomCode,
        }),
      });
      setActiveMeetingRoomId(newRoomCode);
    } catch (err) {
      console.error('Failed to upgrade to group call:', err);
    }
  };

  return (
    <>
      {/* 1-on-1 Call Overlay */}
      {directCallType && conversation.members[0] && (
        <DirectCallModal
          isOpen={true}
          type={directCallType}
          targetUser={{
            _id: conversation.members[0]._id,
            name: chatName,
            image: chatImage,
          }}
          onClose={() => setDirectCallType(null)}
          onUpgradeToGroup={handleStartGroupCallFromDirect}
        />
      )}

      <div className="flex flex-col shrink-0 border-b border-border-default z-10 select-none">
        {/* Main Header Bar */}
        <div className="h-16 bg-bg-secondary flex items-center justify-between px-4 shadow-sm">
          {/* Left: Contact Info */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Back button */}
            <button
              onClick={() => {
                useChatStore.getState().setActiveConversationId(null);
                setSidebarOpen(true);
              }}
              className="lg:hidden p-1.5 hover:bg-bg-input rounded-full text-text-secondary hover:text-text-primary transition mr-1 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            <Avatar src={chatImage} name={chatName} size="md" showOnlineIndicator={isDirect} isOnline={isOnline} />

            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-text-primary leading-tight truncate">
                {chatName}
              </span>
              <span
                className={cn(
                  'text-[11px] leading-none mt-1 truncate transition-colors duration-200',
                  isTypingText ? 'text-[#00a884] font-medium animate-pulse' : 'text-text-secondary'
                )}
              >
                {statusText}
              </span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* 📞 Audio Call */}
            {isDirect && (
              <button
                onClick={() => setDirectCallType('audio')}
                className="p-2 hover:bg-bg-input rounded-full text-text-secondary hover:text-brand-green transition cursor-pointer"
                title="Start Audio Call"
              >
                📞
              </button>
            )}

            {/* 📹 Video Call */}
            {isDirect && (
              <button
                onClick={() => setDirectCallType('video')}
                className="p-2 hover:bg-bg-input rounded-full text-text-secondary hover:text-brand-green transition cursor-pointer"
                title="Start Video Call"
              >
                📹
              </button>
            )}

            {/* Settings (Direct only) */}
            {isDirect && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-full transition cursor-pointer text-text-secondary hover:bg-bg-input hover:text-text-primary"
                title="Chat Settings"
              >
                ⚙️
              </button>
            )}

            {/* Search Toggle */}
            <button
              onClick={() => {
                if (showSearch) {
                  setMessageSearchQuery('');
                  setShowSearch(false);
                } else {
                  setShowSearch(true);
                }
              }}
              className={cn(
                'p-2 rounded-full transition cursor-pointer text-text-secondary hover:text-text-primary',
                (showSearch || messageSearchQuery) ? 'bg-brand-green/20 text-brand-green' : 'hover:bg-bg-input'
              )}
              title="Search Messages"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>

            {/* Chat Settings Modal Trigger */}
            <button
              onClick={() => setShowSettings(true)}
              className={cn(
                'p-2 rounded-full transition cursor-pointer text-text-secondary hover:text-text-primary',
                showSettings ? 'bg-brand-green/20 text-brand-green' : 'hover:bg-bg-input'
              )}
              title="Chat Settings"
            >
              <span className="text-xs">⚙️</span>
            </button>

            {/* Info Panel Toggle (Three Dots) */}
            <button
              onClick={() => toggleRightInfo()}
              className={cn(
                'p-2 rounded-full transition cursor-pointer text-text-secondary hover:text-text-primary',
                isRightInfoOpen ? 'bg-brand-green/20 text-brand-green font-bold' : 'hover:bg-bg-input'
              )}
              title="Contact Details & Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        <ChatSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          conversationId={conversation._id}
          currentTimer={conversation.disappearingTimer || 'off'}
          onTimerChange={(newTimer) => handleTimerChange(newTimer)}
        />

        {/* In-Chat Search Bar Dropdown */}
        {(showSearch || messageSearchQuery) && (
          <div className="px-4 py-2 bg-bg-input/60 border-t border-border-default/30 flex items-center gap-2">
            <span className="text-xs">🔍</span>
            <input
              type="text"
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              placeholder="Search in conversation..."
              autoFocus
              className="flex-1 bg-transparent text-xs text-text-primary outline-none placeholder-text-muted"
            />
            {messageSearchQuery && (
              <button onClick={() => setMessageSearchQuery('')} className="text-xs text-text-secondary hover:text-text-primary cursor-pointer font-bold px-1">
                ✕
              </button>
            )}
          </div>
        )}

        {/* Pinned Message Banner */}
        {pinnedMessage && (
          <div className="px-4 py-1.5 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2 truncate">
              <span>📌</span>
              <span className="font-bold shrink-0">{typeof pinnedMessage.senderId === 'object' && pinnedMessage.senderId !== null ? pinnedMessage.senderId.name : 'User'}:</span>
              <span className="truncate">{pinnedMessage.body || 'Attachment'}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
