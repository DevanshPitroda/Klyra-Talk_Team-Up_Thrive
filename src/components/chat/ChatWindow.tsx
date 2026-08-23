'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useChatStore, IMessageDetails } from '../../store/useChatStore';
import ChatHeader from './ChatHeader';
import ChatBubble from './ChatBubble';
import DateDivider from './DateDivider';
import ChatInput from './ChatInput';
import StudyRoom from './StudyRoom';
import RightInfoPanel from './RightInfoPanel';
import ForwardMessageModal from './ForwardMessageModal';
import { formatRelativeTime } from '../../utils/formatDate';
import { getSocket } from '../../hooks/useSocket';

export default function ChatWindow() {
  const { data: session } = useSession();
  const { activeConversationId, messages, setMessages, addMessage, activeMeetingRoomId, messageSearchQuery } = useChatStore();
  const [loading, setLoading] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<IMessageDetails | null>(null);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  const displayMessages = useMemo(() => {
    if (!messageSearchQuery.trim()) return activeMessages;
    const q = messageSearchQuery.toLowerCase();
    return activeMessages.filter((m) => {
      const bodyMatch = m.body?.toLowerCase().includes(q);
      const senderName = typeof m.senderId === 'object' && m.senderId !== null ? m.senderId.name : '';
      const senderMatch = senderName.toLowerCase().includes(q);
      const fileMatch = m.attachments?.some((a) => a.filename?.toLowerCase().includes(q));
      return bodyMatch || senderMatch || fileMatch;
    });
  }, [activeMessages, messageSearchQuery]);

  // 1. Fetch conversation messages on chat switch
  useEffect(() => {
    if (!activeConversationId) return;
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/conversations/${activeConversationId}/messages`);
        const data = await res.json();
        if (data.success) {
          setMessages(activeConversationId, [...data.data].reverse());
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [activeConversationId, setMessages]);

  // 2. Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && !messageSearchQuery) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages, messageSearchQuery]);

  const handleSendMessage = async (
    text: string,
    attachments?: any[],
    extra?: {
      type?: string;
      viewOnce?: boolean;
      pollData?: { question: string; options: string[] };
      locationData?: { lat: number; lng: number; label: string };
    }
  ) => {
    if (!activeConversationId) return;

    let messageType = extra?.type || 'text';
    let requestBody = text;

    if (!extra?.type) {
      if (attachments && attachments.length > 0) {
        const mime: string = attachments[0].mimeType ?? '';
        if (mime.startsWith('image/')) messageType = 'image';
        else if (mime.startsWith('video/')) messageType = 'video';
        else if (mime.startsWith('audio/')) messageType = 'audio';
        else messageType = 'file';
      }
    }

    if (extra?.type === 'location' && extra.locationData) {
      requestBody = JSON.stringify(extra.locationData);
    }

    try {
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: requestBody,
          type: messageType,
          attachments: attachments ?? [],
          viewOnce: extra?.viewOnce ?? false,
          pollData: extra?.pollData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const socket = getSocket();
        if (socket) {
          socket.emit('send_message', {
            conversationId: activeConversationId,
            message: data.data,
          });
        } else {
          addMessage(activeConversationId, data.data);
        }
      }
    } catch (err) {
      console.error('Failed to post message:', err);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!activeConversationId || !session?.user?.name) return;
    const socket = getSocket();
    if (!socket) return;
    const event = isTyping ? 'typing_start' : 'typing_stop';
    socket.emit(event, {
      conversationId: activeConversationId,
      userName: session.user.name,
    });
  };

  if (activeMeetingRoomId) {
    return <StudyRoom conversationId={activeMeetingRoomId} />;
  }

  const renderMessages = () => {
    if (messageSearchQuery && displayMessages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center text-text-secondary select-none my-auto">
          <span className="text-3xl mb-2">🔍</span>
          <p className="text-sm font-semibold text-text-primary">No messages found</p>
          <p className="text-xs text-text-secondary mt-1">No messages match &quot;{messageSearchQuery}&quot;</p>
        </div>
      );
    }

    let lastDate = '';
    return displayMessages.map((msg, index) => {
      const messageDate = formatRelativeTime(msg.createdAt).split(' at ')[0];
      let divider = null;
      if (messageDate !== lastDate) {
        divider = <DateDivider key={`date-${msg._id}`} date={messageDate} />;
        lastDate = messageDate;
      }
      const prevSender = displayMessages[index - 1]?.senderId;
      const prevSenderId = prevSender
        ? (typeof prevSender === 'object' && prevSender !== null ? prevSender._id : String(prevSender))
        : null;
      const currentSenderId = typeof msg.senderId === 'object' && msg.senderId !== null ? msg.senderId._id : String(msg.senderId || '');
      const shouldShowSenderName = index === 0 || prevSenderId !== currentSenderId;

      return (
        <React.Fragment key={msg._id}>
          {divider}
          <ChatBubble
            message={msg}
            showSenderName={shouldShowSenderName}
            onForward={(message) => {
              setForwardMsg(message);
              setIsForwardOpen(true);
            }}
          />
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden relative" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {!activeConversationId ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center border mb-6"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-default)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-11 h-11" style={{ color: 'var(--accent-green)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379L12 21l3.62-3.62c1.153-.086 2.294-.213 3.423-.379 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Select a chat to start messaging</h3>
            <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Choose a conversation from the list or search for a new contact.
            </p>
          </div>
        ) : (
          <>
            <ChatHeader />

            {/* Message scroll area with adaptive WhatsApp doodle background */}
            <div className="flex-1 relative overflow-hidden flex flex-col" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="chat-doodle-bg" />

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 flex flex-col gap-1.5 scroll-smooth select-text relative z-10 overscroll-y-contain transform-gpu webkit-overflow-scrolling-touch"
              >
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: 'var(--accent-green)', borderTopColor: 'transparent' }} />
                  </div>
                ) : activeMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
                    <p className="text-xs px-3 py-1.5 rounded-lg shadow-sm" style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
                      Messages are encrypted end-to-end. Send the first message!
                    </p>
                  </div>
                ) : (
                  renderMessages()
                )}
              </div>
            </div>

            <ChatInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
          </>
        )}
      </div>

      {/* Right Details Panel */}
      <RightInfoPanel />

      {/* Forward Message Modal */}
      <ForwardMessageModal
        message={forwardMsg}
        isOpen={isForwardOpen}
        onClose={() => setIsForwardOpen(false)}
      />
    </div>
  );
}
