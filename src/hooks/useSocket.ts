'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useChatStore } from '../store/useChatStore';

let socketInstance: Socket | null = null;

export function useSocket() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    const SOCKET_URL =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

    // 1. Create EXACTLY ONE socket instance per application lifecycle
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
        reconnection: true,
        autoConnect: true,
      });
    }

    const socket = socketInstance;

    // ── Connection Status Handlers ─────────────────────────────────────
    const onConnect = () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
      setIsReconnecting(false);
      socket.emit('user_connected', session.user.id);
    };

    const onDisconnect = (reason: string) => {
      console.warn('[Socket] Disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    };

    const onConnectError = (err: Error) => {
      console.warn('[Socket] Connection attempt (retrying in background):', err.message);
      setIsConnected(false);
      setIsReconnecting(true);
    };

    const onReconnectAttempt = () => {
      setIsReconnecting(true);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.io.on('reconnect_attempt', onReconnectAttempt);

    if (socket.connected) {
      setIsConnected(true);
      socket.emit('user_connected', session.user.id);
    }

    // ── Presence events ────────────────────────────────────────────────
    const onOnlineUsers = (userIds: string[]) => {
      useChatStore.getState().setOnlineUserIds(userIds);
    };

    const onUserOnline = (userId: string) => {
      useChatStore.getState().addUserOnline(userId);
    };

    const onUserOffline = (userId: string) => {
      useChatStore.getState().removeUserOffline(userId);
    };

    // ── New incoming message ───────────────────────────────────────────
    const onNewMessage = ({ conversationId, message }: any) => {
      const store = useChatStore.getState();
      const isCurrentChat = conversationId === store.activeConversationId;

      store.addMessage(conversationId, message);
      store.updateConversationLastMessage(conversationId, {
        _id: message._id,
        body: message.body,
        senderId: message.senderId,
        type: message.type,
        createdAt: message.createdAt,
      });

      if (isCurrentChat) {
        socket.emit('mark_as_seen', {
          conversationId,
          messageId: message._id,
        });
      } else {
        store.incrementUnreadCount(conversationId);
      }
    };

    // ── Delivery & Seen receipts ───────────────────────────────────────
    const onMessagesDelivered = ({ conversationId, userId, timestamp }: any) => {
      useChatStore.getState().markMessagesAsDelivered(conversationId, userId, timestamp);
    };

    const onMessagesSeen = ({ conversationId, userId, timestamp }: any) => {
      const store = useChatStore.getState();
      store.markMessagesAsSeen(conversationId, userId, timestamp);
      if (userId === session.user.id) {
        store.resetUnreadCount(conversationId);
      }
    };

    // ── Message Reactions & Pins ───────────────────────────────────────
    const onMessageReaction = ({ conversationId, messageId, reactions }: any) => {
      useChatStore.getState().updateMessage(conversationId, messageId, { reactions });
    };

    const onMessagePin = ({ conversationId, messageId, isPinned, pinnedAt }: any) => {
      useChatStore.getState().updateMessage(conversationId, messageId, { isPinned, pinnedAt });
    };

    // ── Typing indicators ──────────────────────────────────────────────
    const onTypingStart = ({ conversationId, userName }: { conversationId: string; userName: string }) => {
      useChatStore.getState().setTyping(conversationId, userName, true);
    };

    const onTypingStop = ({ conversationId, userName }: { conversationId: string; userName: string }) => {
      useChatStore.getState().setTyping(conversationId, userName, false);
    };

    socket.on('online_users', onOnlineUsers);
    socket.on('user_online', onUserOnline);
    socket.on('user_offline', onUserOffline);
    socket.on('new_message', onNewMessage);
    socket.on('messages_delivered', onMessagesDelivered);
    socket.on('messages_seen', onMessagesSeen);
    socket.on('message_reaction', onMessageReaction);
    socket.on('message_pin', onMessagePin);
    socket.on('typing_start', onTypingStart);
    socket.on('typing_stop', onTypingStop);

    // ── Cleanup listeners on unmount (keep single socket alive) ──────
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.io.off('reconnect_attempt', onReconnectAttempt);

      socket.off('online_users', onOnlineUsers);
      socket.off('user_online', onUserOnline);
      socket.off('user_offline', onUserOffline);
      socket.off('new_message', onNewMessage);
      socket.off('messages_delivered', onMessagesDelivered);
      socket.off('messages_seen', onMessagesSeen);
      socket.off('message_reaction', onMessageReaction);
      socket.off('message_pin', onMessagePin);
      socket.off('typing_start', onTypingStart);
      socket.off('typing_stop', onTypingStop);
    };
  }, [session?.user?.id]);

  return { socket: socketInstance, isConnected, isReconnecting };
}

export function getSocket(): Socket | null {
  return socketInstance;
}
