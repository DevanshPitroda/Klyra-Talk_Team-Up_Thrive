'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useChatStore } from '../store/useChatStore';

let socketInstance: Socket | null = null;

export function useSocket() {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);

  const {
    addMessage,
    updateConversationLastMessage,
    incrementUnreadCount,
    resetUnreadCount,
    setOnlineUserIds,
    addUserOnline,
    removeUserOffline,
    setTyping,
    activeConversationId,
    markMessagesAsDelivered,
    markMessagesAsSeen,
  } = useChatStore();

  useEffect(() => {
    if (!session?.user?.id) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

    // Reuse existing connection if available
    if (!socketInstance || !socketInstance.connected) {
      socketInstance = io(SOCKET_URL, {
        transports:        ['websocket', 'polling'],
        reconnectionDelay: 1000,
        reconnection:      true,
      });
    }

    socketRef.current = socketInstance;
    const socket = socketInstance;

    // ── Register this user once connected ──────────────────────────────
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      socket.emit('user_connected', session.user.id);
    });

    // Register immediately if already connected
    if (socket.connected) {
      socket.emit('user_connected', session.user.id);
    }

    // ── Presence events ────────────────────────────────────────────────
    socket.on('online_users', (userIds: string[]) => {
      setOnlineUserIds(userIds);
    });

    socket.on('user_online', (userId: string) => {
      addUserOnline(userId);
    });

    socket.on('user_offline', (userId: string) => {
      removeUserOffline(userId);
    });

    // ── New incoming message ───────────────────────────────────────────
    socket.on('new_message', ({ conversationId, message }) => {
      const { activeConversationId: activeChatId } = useChatStore.getState();
      const isCurrentChat = conversationId === activeChatId;

      // Add to message list
      addMessage(conversationId, message);

      // Update sidebar last-message preview
      updateConversationLastMessage(conversationId, {
        _id:      message._id,
        body:     message.body,
        senderId: message.senderId,
        type:     message.type,
        createdAt: message.createdAt,
      });

      if (isCurrentChat) {
        // If chat is open, immediately mark as seen
        socket.emit('mark_as_seen', {
          conversationId,
          messageId: message._id,
        });
      } else {
        // Badge unread count if this isn't the active chat
        incrementUnreadCount(conversationId);
      }
    });

    // ── Delivery & Seen receipts ───────────────────────────────────────
    socket.on('messages_delivered', ({ conversationId, userId, timestamp }) => {
      markMessagesAsDelivered(conversationId, userId, timestamp);
    });

    socket.on('messages_seen', ({ conversationId, userId, timestamp }) => {
      markMessagesAsSeen(conversationId, userId, timestamp);
      if (userId === session.user.id) {
        resetUnreadCount(conversationId);
      }
    });

    // ── Message Reactions & Pins ───────────────────────────────────────
    socket.on('message_reaction', ({ conversationId, messageId, reactions }: any) => {
      useChatStore.getState().updateMessage(conversationId, messageId, { reactions });
    });

    socket.on('message_pin', ({ conversationId, messageId, isPinned, pinnedAt }: any) => {
      useChatStore.getState().updateMessage(conversationId, messageId, { isPinned, pinnedAt });
    });

    // ── Typing indicators ──────────────────────────────────────────────
    socket.on('typing_start', ({ conversationId, userName }: { conversationId: string; userName: string }) => {
      setTyping(conversationId, userName, true);
    });

    socket.on('typing_stop', ({ conversationId, userName }: { conversationId: string; userName: string }) => {
      setTyping(conversationId, userName, false);
    });

    // ── Cleanup listeners on unmount (keep socket alive) ──────────────
    return () => {
      socket.off('connect');
      socket.off('online_users');
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('new_message');
      socket.off('messages_delivered');
      socket.off('messages_seen');
      socket.off('typing_start');
      socket.off('typing_stop');
    };
  }, [
    session?.user?.id,
    addMessage,
    updateConversationLastMessage,
    incrementUnreadCount,
    setOnlineUserIds,
    addUserOnline,
    removeUserOffline,
    setTyping,
    markMessagesAsDelivered,
    markMessagesAsSeen,
  ]);

  // ── Join / leave conversation rooms when active chat changes ──────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConversationId) return;

    socket.emit('join_room', activeConversationId);

    return () => {
      socket.emit('leave_room', activeConversationId);
    };
  }, [activeConversationId]);

  return socketRef;
}

// Expose the socket instance so ChatInput can emit events
export function getSocket(): Socket | null {
  return socketInstance;
}
