'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getSocket } from '@/hooks/useSocket';
import Avatar from '@/components/ui/Avatar';

interface ChatMessage {
  id: string;
  senderName: string;
  senderImage?: string;
  text: string;
  timestamp: string;
  isCode?: boolean;
  isPinned?: boolean;
}

export default function MeetingChat({ conversationId }: { conversationId: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isCodeBlock, setIsCodeBlock] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_conversation', conversationId);

    const onMeetingMsg = (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('room_chat_message', onMeetingMsg);
    socket.on('meeting_chat_message', onMeetingMsg);
    return () => {
      socket.off('room_chat_message', onMeetingMsg);
      socket.off('meeting_chat_message', onMeetingMsg);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderName: session?.user?.name || 'Anonymous',
      senderImage: session?.user?.image || undefined,
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCode: isCodeBlock,
    };

    setMessages((prev) => [...prev, newMsg]);
    getSocket()?.emit('room_chat_message', { conversationId, message: newMsg });
    getSocket()?.emit('meeting_chat_message', { conversationId, message: newMsg });
    setInput('');
    setIsCodeBlock(false);
  };

  const togglePin = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isPinned: !m.isPinned } : m))
    );
  };

  const deleteMsg = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const pinnedMsgs = messages.filter((m) => m.isPinned);

  return (
    <div className="w-80 bg-bg-secondary border-l border-border-default/40 flex flex-col h-full shrink-0 select-none text-text-primary transition-colors">

      {/* Header */}
      <div className="p-3.5 border-b border-border-default/30 flex items-center justify-between">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
          <span>💬 Meeting Chat</span>
        </h3>
        <span className="text-[10px] text-text-secondary">In-Room</span>
      </div>

      {/* Pinned Messages Banner */}
      {pinnedMsgs.length > 0 && (
        <div className="p-2.5 bg-brand-green/10 border-b border-brand-green/20 space-y-1">
          <p className="text-[9px] font-bold text-brand-green uppercase tracking-wider">📌 Pinned Message</p>
          <p className="text-xs text-text-primary line-clamp-2">{pinnedMsgs[pinnedMsgs.length - 1].text}</p>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-text-secondary">
            <span className="text-2xl">💬</span>
            <p className="text-xs font-bold text-text-primary">No messages yet</p>
            <p className="text-[10px] text-text-secondary">Send a message to everyone in the room</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="group relative space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={msg.senderName} src={msg.senderImage} size="sm" />
                  <span className="text-xs font-bold text-text-primary">{msg.senderName}</span>
                </div>
                <span className="text-[9px] text-text-secondary">{msg.timestamp}</span>
              </div>

              <div
                className={`p-2.5 rounded-xl text-xs ${
                  msg.isCode
                    ? 'font-mono bg-bg-input text-brand-green border border-border-default/30 overflow-x-auto'
                    : 'bg-bg-input text-text-primary'
                }`}
              >
                {msg.text}
              </div>

              {/* Message Hover Actions */}
              <div className="hidden group-hover:flex items-center gap-1 absolute right-1 top-0 bg-bg-secondary border border-border-default/40 p-1 rounded-lg text-[10px]">
                <button
                  onClick={() => togglePin(msg.id)}
                  className="hover:text-brand-green cursor-pointer"
                  title="Pin message"
                >
                  📌
                </button>
                <button
                  onClick={() => deleteMsg(msg.id)}
                  className="hover:text-red-400 cursor-pointer"
                  title="Delete message"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-border-default/30 space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCodeBlock(!isCodeBlock)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
              isCodeBlock ? 'bg-brand-green text-white' : 'bg-bg-input text-text-secondary hover:text-text-primary'
            }`}
            title="Toggle Code Block"
          >
            {`</>`}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isCodeBlock ? 'Write code snippet...' : 'Type message...'}
            className="flex-1 px-3 py-2 bg-bg-input border border-border-default/30 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-green"
          />
          <button
            type="submit"
            className="p-2 bg-brand-green hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            ➤
          </button>
        </div>
      </form>

    </div>
  );
}
