import { create } from 'zustand';

export interface IReceiptPreview {
  userId: string;
  timestamp: string;
}

export interface IMessagePreview {
  _id: string;
  body?: string;
  senderId: {
    _id: string;
    name: string;
  };
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system' | 'location' | 'poll' | 'meeting';
  createdAt: string;
  deliveredTo?: IReceiptPreview[];
  seenBy?: IReceiptPreview[];
}

export interface IMemberPreview {
  _id: string;
  name: string;
  image?: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface IConversationPreview {
  _id: string;
  type: 'direct' | 'group';
  name?: string;
  image?: string;
  description?: string;
  members: IMemberPreview[];
  lastMessage?: IMessagePreview;
  unreadCount: number;
  updatedAt: string;
  disappearingTimer?: 'off' | '24h' | 'view_once';
  isPinned?: boolean;
}

export interface IReactionDetail {
  emoji: string;
  userId: string;
  userName: string;
}

export interface IMessageDetails {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    name: string;
    image?: string;
  };
  body?: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system' | 'location' | 'poll' | 'meeting';
  attachments: Array<{
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }>;
  viewOnce?: boolean;
  viewOnceSeen?: boolean;
  pollId?: string;
  replyToId?: string;
  reactions?: IReactionDetail[];
  isPinned?: boolean;
  pinnedAt?: string;
  starredBy?: string[];
  createdAt: string;
  isEdited: boolean;
  isDeleted: boolean;
  deliveredTo?: IReceiptPreview[];
  seenBy?: IReceiptPreview[];
}

interface ChatState {
  conversations: IConversationPreview[];
  activeConversationId: string | null;
  activeMeetingRoomId: string | null;
  messages: Record<string, IMessageDetails[]>;
  onlineUserIds: Set<string>;
  typingUsers: Record<string, string[]>; // conversationId -> userNames

  setConversations: (conversations: IConversationPreview[]) => void;
  updateConversationLastMessage: (conversationId: string, message: IMessagePreview) => void;
  incrementUnreadCount: (conversationId: string) => void;
  resetUnreadCount: (conversationId: string) => void;
  setActiveConversationId: (id: string | null) => void;
  setActiveMeetingRoomId: (id: string | null) => void;
  setMessages: (conversationId: string, messages: IMessageDetails[]) => void;
  addMessage: (conversationId: string, message: IMessageDetails) => void;
  setOnlineUserIds: (ids: string[]) => void;
  addUserOnline: (id: string) => void;
  removeUserOffline: (id: string) => void;
  setTyping: (conversationId: string, userName: string, isTyping: boolean) => void;
  markMessagesAsDelivered: (conversationId: string, userId: string, timestamp: string) => void;
  markMessagesAsSeen: (conversationId: string, userId: string, timestamp: string) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<IMessageDetails>) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  updateConversation: (conversationId: string, updates: Partial<IConversationPreview>) => void;
  togglePinConversation: (conversationId: string) => boolean;
  activeMeetingRoomUrl: string | null;
  setActiveMeetingRoomUrl: (url: string | null) => void;
  messageSearchQuery: string;
  setMessageSearchQuery: (query: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  activeMeetingRoomId: null,
  activeMeetingRoomUrl: null,
  messageSearchQuery: '',
  messages: {},
  onlineUserIds: new Set(),
  typingUsers: {},

  setActiveMeetingRoomId: (id) => set({ activeMeetingRoomId: id }),
  setActiveMeetingRoomUrl: (url) => set({ activeMeetingRoomUrl: url }),
  setMessageSearchQuery: (query) => set({ messageSearchQuery: query }),

  setConversations: (conversations) => set({ conversations }),

  updateConversationLastMessage: (conversationId, message) =>
    set((state) => {
      const updated = state.conversations.map((c) => {
        if (c._id === conversationId) {
          return {
            ...c,
            lastMessage: message,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      });
      // Sort conversations so the active one goes to the top
      updated.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      return { conversations: updated };
    }),

  incrementUnreadCount: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId && c._id !== state.activeConversationId
          ? { ...c, unreadCount: c.unreadCount + 1 }
          : c
      ),
    })),

  resetUnreadCount: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    })),

  setActiveConversationId: (id) =>
    set((state) => {
      if (id) {
        const updated = state.conversations.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c));
        return { activeConversationId: id, activeMeetingRoomId: null, activeMeetingRoomUrl: null, messageSearchQuery: '', conversations: updated };
      }
      return { activeConversationId: id, activeMeetingRoomId: null, activeMeetingRoomUrl: null, messageSearchQuery: '' };
    }),

  setMessages: (conversationId, messageList) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messageList },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      // Prevent duplicate rendering
      if (existing.some((m) => m._id === message._id)) return {};
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message],
        },
      };
    }),

  setOnlineUserIds: (ids) => set({ onlineUserIds: new Set(ids) }),

  addUserOnline: (id) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      next.add(id);
      return { onlineUserIds: next };
    }),

  removeUserOffline: (id) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      next.delete(id);
      return { onlineUserIds: next };
    }),

  setTyping: (conversationId, userName, isTyping) =>
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      let updated: string[];
      if (isTyping) {
        updated = current.includes(userName) ? current : [...current, userName];
      } else {
        updated = current.filter((name) => name !== userName);
      }
      return {
        typingUsers: { ...state.typingUsers, [conversationId]: updated },
      };
    }),

  markMessagesAsDelivered: (conversationId, userId, timestamp) =>
    set((state) => {
      const chatMessages = state.messages[conversationId] || [];
      const updatedMessages = chatMessages.map((msg) => {
        if (msg.senderId._id !== userId) {
          const delivered = msg.deliveredTo || [];
          if (!delivered.some((d) => d.userId === userId)) {
            return {
              ...msg,
              deliveredTo: [...delivered, { userId, timestamp }],
            };
          }
        }
        return msg;
      });
      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedMessages,
        },
      };
    }),

  markMessagesAsSeen: (conversationId, userId, timestamp) =>
    set((state) => {
      const chatMessages = state.messages[conversationId] || [];
      const updatedMessages = chatMessages.map((msg) => {
        if (msg.senderId._id !== userId) {
          const seen = msg.seenBy || [];
          const delivered = msg.deliveredTo || [];
          
          let nextMsg = { ...msg };
          
          if (!seen.some((s) => s.userId === userId)) {
            nextMsg.seenBy = [...seen, { userId, timestamp }];
          }
          if (!delivered.some((d) => d.userId === userId)) {
            nextMsg.deliveredTo = [...delivered, { userId, timestamp }];
          }
          
          return nextMsg;
        }
        return msg;
      });
      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedMessages,
        },
      };
    }),

  updateMessage: (conversationId, messageId, updates) =>
    set((state) => {
      const chatMessages = state.messages[conversationId] || [];
      const updatedMessages = chatMessages.map((msg) =>
        msg._id === messageId ? { ...msg, ...updates } : msg
      );
      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedMessages,
        },
      };
    }),

  removeMessage: (conversationId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (msg) => msg._id !== messageId
        ),
      },
    })),

  updateConversation: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, ...updates } : c
      ),
    })),

  togglePinConversation: (conversationId) => {
    let success = true;
    set((state) => {
      const target = state.conversations.find((c) => c._id === conversationId);
      if (!target) return state;

      const currentPinnedCount = state.conversations.filter((c) => c.isPinned).length;
      if (!target.isPinned && currentPinnedCount >= 3) {
        success = false;
        return state;
      }

      return {
        conversations: state.conversations.map((c) =>
          c._id === conversationId ? { ...c, isPinned: !c.isPinned } : c
        ),
      };
    });
    return success;
  },
}));
export type { ChatState };
