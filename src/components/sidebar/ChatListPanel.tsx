'use client';

import React, { useState } from 'react';
import { useChatStore, IConversationPreview } from '../../store/useChatStore';
import { useSession } from 'next-auth/react';
import Avatar from '../ui/Avatar';
import { cn } from '../../utils/cn';

function getConvName(conv: IConversationPreview, myId?: string) {
  if (conv.type === 'group') return conv.name || 'Group';
  const other = conv.members?.find((m) => m._id !== myId);
  return other?.name || 'Unknown';
}

function getConvImage(conv: IConversationPreview, myId?: string) {
  if (conv.type === 'group') return conv.image;
  const other = conv.members?.find((m) => m._id !== myId);
  return other?.image;
}

function getLastMsgPreview(conv: IConversationPreview) {
  if (!conv.lastMessage) return 'No messages yet';
  const body = conv.lastMessage.body;
  if (!body || body.length < 3) {
    const type = conv.lastMessage.type;
    if (type === 'audio') return '🎤 Voice message';
    if (type === 'image') return '📷 Photo';
    if (type === 'video') return '📹 Video';
    if (type === 'file') return '📄 File';
    return '...';
  }
  return body.length > 35 ? body.slice(0, 35) + '…' : body;
}

export default function ChatListPanel() {
  const { data: session } = useSession();
  const { conversations, activeConversationId, setActiveConversationId, onlineUserIds } = useChatStore();
  const [search, setSearch] = useState('');

  const myId = session?.user?.id;

  const filtered = conversations.filter((c) => {
    const name = getConvName(c, myId).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div
      className="hidden lg:flex flex-col shrink-0 border-r overflow-hidden"
      style={{
        width: '260px',
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <p className="text-xs font-bold mb-2 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Chats
        </p>
        <div
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
          style={{ background: 'var(--bg-input)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="bg-transparent text-xs flex-1 outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No conversations yet</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv._id === activeConversationId;
            const name = getConvName(conv, myId);
            const image = getConvImage(conv, myId);
            const preview = getLastMsgPreview(conv);
            const isOnline = conv.type === 'direct'
              ? conv.members?.some((m) => m._id !== myId && onlineUserIds.has(m._id))
              : false;
            const hasUnread = conv.unreadCount > 0;

            return (
              <button
                key={conv._id}
                onClick={() => setActiveConversationId(conv._id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-all text-left relative"
                style={{
                  background: isActive ? 'var(--bg-input)' : 'transparent',
                  borderLeft: isActive ? `3px solid var(--accent-green)` : '3px solid transparent',
                }}
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={image}
                    name={name}
                    size="sm"
                    showOnlineIndicator={conv.type === 'direct'}
                    isOnline={isOnline}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-xs font-semibold truncate"
                      style={{ color: isActive ? 'var(--accent-green)' : 'var(--text-primary)' }}
                    >
                      {name}
                    </span>
                    {hasUnread && (
                      <span
                        className="shrink-0 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center text-white"
                        style={{ background: 'var(--accent-green)' }}
                      >
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {preview}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
