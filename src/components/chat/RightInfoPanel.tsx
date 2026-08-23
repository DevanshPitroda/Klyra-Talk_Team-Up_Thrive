'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  FileText,
  Image as ImageIcon,
  Pin,
  X,
  Phone,
  Video,
  Star,
  Bell,
  VolumeX,
  ShieldCheck,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useUIStore } from '../../store/useUIStore';
import Avatar from '../ui/Avatar';

const EMPTY_MESSAGES: any[] = [];

export default function RightInfoPanel() {
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const conversations = useChatStore((state) => state.conversations);
  const onlineUserIds = useChatStore((state) => state.onlineUserIds);
  const chatMessages = useChatStore((state) =>
    state.activeConversationId ? state.messages[state.activeConversationId] || EMPTY_MESSAGES : EMPTY_MESSAGES
  );
  const isRightInfoOpen = useUIStore((state) => state.isRightInfoOpen);
  const setRightInfoOpen = useUIStore((state) => state.setRightInfoOpen);
  const [activeTab, setActiveTab] = useState<'info' | 'files' | 'media' | 'pinned'>('info');

  const [notifications, setNotifications] = useState(true);
  const [muteChat, setMuteChat] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isRightInfoOpen || !activeConversationId || !mounted) return null;

  const conv = conversations.find((c) => c._id === activeConversationId);
  if (!conv) return null;

  const chatName = conv.name || conv.members[0]?.name || 'Chat';
  const chatImage = conv.image || conv.members[0]?.image;

  const mediaMessages = chatMessages.filter(
    (m) => m.attachments && m.attachments.length > 0 && m.attachments[0].mimeType?.startsWith('image/')
  );
  const pinnedMessages = chatMessages.filter((m) => m.isPinned);

  const isOnline = conv.type === 'direct' && conv.members[0] ? onlineUserIds.has(conv.members[0]._id) : false;

  const tabs = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'pinned', label: 'Pinned', icon: Pin },
  ] as const;

  const panelContent = (
    <AnimatePresence>
      {/* Mobile Backdrop Overlay (< xl) */}
      <div
        className="xl:hidden fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setRightInfoOpen(false)}
      />

      <motion.aside
        initial={{ x: 320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 320, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="fixed inset-y-0 right-0 z-[9999] w-full max-w-[320px] sm:w-80 xl:static xl:z-auto flex flex-col h-full shrink-0 border-l overflow-hidden select-none relative shadow-2xl xl:shadow-none"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Header Bar */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[var(--accent-green)]" />
            <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              Details & Info
            </h3>
          </div>
          <button
            onClick={() => setRightInfoOpen(false)}
            className="p-1.5 rounded-xl border border-border-default/40 hover:border-brand-green/40 transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
            style={{ background: 'var(--bg-input)' }}
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sliding Tab Switcher */}
        <div
          className="px-3 py-2 border-b flex items-center justify-between shrink-0 relative"
          style={{ borderColor: 'var(--border-default)', background: 'var(--bg-primary)' }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                style={{
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="right-tab-pill"
                    className="absolute inset-0 rounded-xl shadow-sm"
                    style={{ background: 'var(--accent-green)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-white' : ''}`} />
                <span className="relative z-10 text-[11px] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'info' && (
            <>
              {/* Contact Profile Hero Card */}
              <div
                className="flex flex-col items-center text-center p-4 rounded-2xl border relative overflow-hidden"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-default)' }}
              >
                <div className="relative mb-2">
                  <div
                    className="p-1 rounded-full shadow-lg"
                    style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-hover))' }}
                  >
                    <Avatar src={chatImage} name={chatName} size="xl" />
                  </div>
                </div>

                <h3 className="text-sm font-bold truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
                  {chatName}
                </h3>
                <span className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {conv.type === 'group' ? `${conv.members.length} members` : 'Direct Conversation'}
                </span>

                <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold" style={{ color: 'var(--accent-green)' }}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>End-to-End Encrypted</span>
                </div>

                {/* Quick Action Icons */}
                <div className="flex items-center justify-center gap-3 mt-4 w-full pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 rounded-xl flex items-center justify-center text-xs font-bold transition-all"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    title="Audio Call"
                  >
                    <Phone className="w-4 h-4 text-[var(--accent-green)]" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 rounded-xl flex items-center justify-center text-xs font-bold transition-all"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    title="Video Call"
                  >
                    <Video className="w-4 h-4 text-[var(--accent-green)]" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMuteChat((v) => !v)}
                    className="p-2.5 rounded-xl flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: muteChat ? 'var(--accent-green)' : 'var(--bg-input)',
                      color: muteChat ? '#ffffff' : 'var(--text-primary)',
                    }}
                    title="Toggle Mute"
                  >
                    <VolumeX className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* About Section */}
              <div
                className="p-3.5 rounded-2xl border space-y-1"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-default)' }}
              >
                <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  About
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {conv.description || 'This is the beginning of your conversation with ' + chatName + '.'}
                </p>
              </div>

              {/* Shared Media Preview */}
              <div
                className="p-3.5 rounded-2xl border space-y-2"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-default)' }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Shared Media
                  </h4>
                  <button
                    onClick={() => setActiveTab('media')}
                    className="text-[10px] font-bold flex items-center gap-0.5 hover:underline"
                    style={{ color: 'var(--accent-green)' }}
                  >
                    See all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {mediaMessages.length === 0 ? (
                  <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                    No media shared yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {mediaMessages.slice(0, 6).map((m) => (
                      <img
                        key={m._id}
                        src={m.attachments[0].url}
                        alt="media"
                        className="w-full h-16 object-cover rounded-xl border transition-transform hover:scale-105"
                        style={{ borderColor: 'var(--border-default)' }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Participants Section */}
              <div
                className="p-3.5 rounded-2xl border space-y-2.5"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-default)' }}
              >
                <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Participants ({conv.members.length})
                </h4>
                <div className="space-y-2">
                  {conv.members.map((member) => {
                    const memberOnline = onlineUserIds.has(member._id);
                    return (
                      <div key={member._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={member.image} name={member.name} size="sm" showOnlineIndicator isOnline={memberOnline} />
                          <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                            {member.name}
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: memberOnline ? 'rgba(0, 168, 132, 0.15)' : 'var(--bg-input)',
                            color: memberOnline ? 'var(--accent-green)' : 'var(--text-muted)',
                          }}
                        >
                          {memberOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Toggle Settings (Shadcn Style) */}
              <div
                className="p-3.5 rounded-2xl border space-y-3"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-default)' }}
              >
                <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Chat Settings
                </h4>

                {/* Notifications Switch */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Notifications
                    </span>
                  </div>
                  <button
                    onClick={() => setNotifications((v) => !v)}
                    className="w-9 h-5 rounded-full transition-colors relative cursor-pointer"
                    style={{ backgroundColor: notifications ? 'var(--accent-green)' : 'var(--bg-input)' }}
                  >
                    <motion.div
                      animate={{ x: notifications ? 18 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5"
                    />
                  </button>
                </div>

                {/* Mute Switch */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Mute Chat
                    </span>
                  </div>
                  <button
                    onClick={() => setMuteChat((v) => !v)}
                    className="w-9 h-5 rounded-full transition-colors relative cursor-pointer"
                    style={{ backgroundColor: muteChat ? 'var(--accent-green)' : 'var(--bg-input)' }}
                  >
                    <motion.div
                      animate={{ x: muteChat ? 18 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5"
                    />
                  </button>
                </div>

                {/* Clear Chat Button */}
                <div className="pt-2 border-t border-border-default/40">
                  <button
                    onClick={async () => {
                      if (!confirm('Are you sure you want to clear all messages in this chat?')) return;
                      try {
                        const res = await fetch(`/api/conversations/${activeConversationId}/messages`, { method: 'DELETE' });
                        const data = await res.json();
                        if (data.success) {
                          useChatStore.getState().setMessages(activeConversationId, []);
                        } else {
                          alert(data.error?.message || 'Failed to clear chat');
                        }
                      } catch (err) {
                        alert('Network error while clearing chat');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs border border-red-500/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Chat History</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'media' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Shared Photos & Videos
              </h4>
              {mediaMessages.length === 0 ? (
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  No media found in this chat.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {mediaMessages.map((m) => (
                    <img
                      key={m._id}
                      src={m.attachments[0].url}
                      alt="shared"
                      className="w-full h-28 object-cover rounded-2xl border shadow-sm transition-transform hover:scale-105"
                      style={{ borderColor: 'var(--border-default)' }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pinned' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Pinned Messages
              </h4>
              {pinnedMessages.length === 0 ? (
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  No pinned messages.
                </p>
              ) : (
                pinnedMessages.map((m) => (
                  <div
                    key={m._id}
                    className="p-3 rounded-2xl border space-y-1 shadow-sm"
                    style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-default)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Pin className="w-3 h-3 text-amber-400" />
                      <span className="text-[11px] font-bold" style={{ color: 'var(--accent-green)' }}>
                        {typeof m.senderId === 'object' && m.senderId !== null ? m.senderId.name : 'User'}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {m.body || 'Media attachment'}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Shared Files & Documents
              </h4>
              <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                No document files shared in this chat.
              </p>
            </div>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );

  return createPortal(panelContent, document.body);
}
