'use client';

import React from 'react';
import { IConversationPreview, useChatStore } from '../../store/useChatStore';
import Avatar from '../ui/Avatar';
import { formatRelativeTime } from '../../utils/formatDate';
import { cn } from '../../utils/cn';

interface ChatListItemProps {
  conversation: IConversationPreview;
  isActive: boolean;
  isOnline: boolean;
  onClick: () => void;
}

const EMPTY_TYPING: string[] = [];

function ChatListItem({
  conversation,
  isActive,
  isOnline,
  onClick,
}: ChatListItemProps) {
  const activeTyping = useChatStore((state) => state.typingUsers[conversation._id] || EMPTY_TYPING);
  const lastMessage = conversation.lastMessage;
  const unreadCount = conversation.unreadCount;

  // Find the other user details for direct chats
  const chatName = conversation.name || conversation.members[0]?.name || 'Chat';
  const chatImage = conversation.image || conversation.members[0]?.image;

  // Check if someone is currently typing in this conversation
  const isTyping = activeTyping.length > 0;

  // Format message preview
  let messagePreview = '';
  let isTypingPreview = false;

  if (isTyping) {
    isTypingPreview = true;
    if (conversation.type === 'direct') {
      messagePreview = 'typing...';
    } else {
      messagePreview = `${activeTyping[0]} is typing...`;
    }
  } else if (lastMessage && typeof lastMessage === 'object' && 'type' in lastMessage && lastMessage.type) {
    if (lastMessage.type === 'text') {
      messagePreview = lastMessage.body || '';
    } else {
      messagePreview = `[${lastMessage.type.toUpperCase()}] media file`;
    }
  } else {
    messagePreview = conversation.description || 'No messages yet';
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 px-4 py-3 hover:bg-bg-input cursor-pointer border-b border-border-default/40 select-none transition-all duration-200',
        isActive && 'bg-bg-input border-l-4 border-brand-green border-b-transparent pl-3'
      )}
    >
      <Avatar
        src={chatImage}
        name={chatName}
        size="lg"
        showOnlineIndicator={conversation.type === 'direct'}
        isOnline={isOnline}
      />
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-text-primary truncate pr-2">
            {chatName}
          </h4>
          <div className="flex items-center gap-1.5 shrink-0">
            {conversation.isPinned && <span className="text-xs text-amber-400" title="Pinned Chat">📌</span>}
            <span className="text-[10px] text-text-muted">
              {lastMessage ? formatRelativeTime(lastMessage.createdAt) : ''}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const ok = useChatStore.getState().togglePinConversation(conversation._id);
                if (!ok) {
                  alert('You can only pin up to 3 chats like WhatsApp.');
                }
              }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-primary transition text-xs"
              title={conversation.isPinned ? 'Unpin Chat' : 'Pin Chat (Max 3)'}
            >
              📌
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className={cn(
            "text-xs truncate pr-2",
            isTypingPreview
              ? "text-[#00a884] font-medium animate-pulse"
              : unreadCount > 0
                ? "text-text-primary font-medium"
                : "text-text-secondary"
          )}>
            {lastMessage && conversation.type === 'group' && !isTypingPreview && (
              <span className="text-text-muted mr-1">{lastMessage.senderId.name}:</span>
            )}
            {messagePreview}
          </p>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center bg-brand-green text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ChatListItem);
