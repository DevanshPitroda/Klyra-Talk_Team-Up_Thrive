'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../hooks/useSocket';
import { useSession } from 'next-auth/react';

interface SharedNotesProps {
  conversationId: string;
}

export default function SharedNotes({ conversationId }: SharedNotesProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [lastEditor, setLastEditor] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let activeSocket: ReturnType<typeof getSocket> = null;

    const bindListeners = () => {
      const socket = getSocket();
      if (!socket) return;
      activeSocket = socket;

      if (conversationId) {
        socket.emit('join_room', conversationId);
      }

      socket.off('note_update', handleRemoteUpdate);
      socket.on('note_update', handleRemoteUpdate);
      socket.on('connect', bindListeners);
    };

    const handleRemoteUpdate = ({ noteContent, editorName }: any) => {
      // Only overwrite if the local user is NOT actively typing
      if (!isTypingRef.current) {
        setContent(noteContent);
        setLastEditor(editorName);
      }
    };

    bindListeners();

    const timer = setInterval(() => {
      if (!activeSocket) bindListeners();
    }, 500);

    return () => {
      clearInterval(timer);
      if (activeSocket) {
        activeSocket.off('note_update', handleRemoteUpdate);
        activeSocket.off('connect', bindListeners);
      }
    };
  }, [conversationId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setContent(nextVal);
    setLastEditor('You');

    isTypingRef.current = true;

    // Emit live text update
    const socket = getSocket();
    if (socket) {
      socket.emit('note_update', {
        conversationId,
        noteContent: nextVal,
        editorName: session?.user?.name || 'Anonymous',
      });
    }

    // Debounce the typing state toggle back to false
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary rounded-2xl border border-border-default/40 overflow-hidden shadow-lg transition-colors">
      
      {/* Editor Header info */}
      <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border-default/40 shrink-0 select-none">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
          <span>📝 Shared Meeting Notes</span>
        </div>
        {lastEditor && (
          <span className="text-[10px] text-text-secondary font-mono">
            Last edit by: <span className="text-brand-green font-bold">{lastEditor}</span>
          </span>
        )}
      </div>

      {/* Text Area pad */}
      <div className="flex-1 p-4 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          placeholder="Collaborate on lecture notes, meeting summary, actions, or homework details here..."
          className="w-full h-full bg-transparent border-none outline-none resize-none text-sm text-text-primary placeholder-text-muted select-text leading-relaxed font-sans"
        />
      </div>

    </div>
  );
}
