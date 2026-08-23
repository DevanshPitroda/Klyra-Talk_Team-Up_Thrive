'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  GraduationCap,
  Bot,
  Settings,
  LogOut,
  Palette,
  Users,
  Key,
  Sparkles,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useUIStore } from '../../store/useUIStore';
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import ProfileModal from '../profile/ProfileModal';
import ThemeSwitcher from '../theme/ThemeSwitcher';
import AIAssistantModal from '../ai/AIAssistantModal';
import RoomCreationModal from '@/features/study-room/components/RoomCreationModal';
import JoinRoomModal from '@/features/study-room/components/JoinRoomModal';
import { useStudyRoomStore } from '@/features/study-room/store/useStudyRoomStore';
import CreateGroupModal from '../group/CreateGroupModal';

export default function LeftNav() {
  const { data: session } = useSession();
  const conversations = useChatStore((state) => state.conversations);
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const setIsCreationModalOpen = useStudyRoomStore((state) => state.setIsCreationModalOpen);
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState<string>('chats');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Total unread count
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageSquare, badge: totalUnread > 0 ? totalUnread : null },
    { id: 'rooms', label: 'Study Rooms', icon: GraduationCap },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'logout') {
      signOut({ callbackUrl: '/login' });
      return;
    }
    setActiveNavItem(id);
    if (id === 'chats') {
      setActiveTab('chats');
    } else if (id === 'rooms') {
      setIsCreationModalOpen(true);
    } else if (id === 'ai') {
      setIsAIOpen(true);
    } else if (id === 'settings') {
      setIsThemeOpen(true);
    }
  };

  return (
    <>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <ThemeSwitcher isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
      <AIAssistantModal isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
      <RoomCreationModal />
      <JoinRoomModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />

      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 68 : 210 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="hidden md:flex flex-col h-full shrink-0 border-r select-none justify-between p-2.5 relative transition-colors z-30"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Top Section */}
        <div className="flex flex-col gap-4">
          {/* Brand Header & Toggle Collapse Button */}
          <div className="flex items-center justify-between px-1 py-1 relative">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg relative overflow-hidden shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-hover))' }}
              >
                <GraduationCap className="w-5 h-5" />
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col min-w-0 overflow-hidden whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <h1 className="text-xs font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Klyra
                      </h1>
                      <Sparkles className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Talk, Team-Up, Thrive
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Collapse/Expand Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="p-1.5 rounded-lg border border-border-default/40 hover:border-brand-green/40 transition-colors cursor-pointer text-text-secondary hover:text-brand-green shrink-0"
              style={{ background: 'var(--bg-input)' }}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </motion.button>
          </div>

          {/* Navigation Links with Floating Hover Badges */}
          <nav className="flex flex-col gap-1 relative">
            {navItems.map((item) => {
              const isActive = activeNavItem === item.id;
              const Icon = item.icon;
              return (
                <div key={item.id} className="relative group/nav">
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`relative w-full flex items-center ${
                      isCollapsed ? 'justify-center py-3' : 'justify-between px-3 py-2.5'
                    } rounded-xl text-xs font-semibold transition-colors duration-150 text-left cursor-pointer`}
                    style={{
                      color: isActive ? 'var(--accent-green)' : 'var(--text-secondary)',
                    }}
                  >
                    {/* Active Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-pill"
                        className="absolute inset-0 rounded-xl shadow-sm"
                        style={{ background: 'var(--bg-input)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}

                    <div className={`relative z-10 flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                      <Icon className={`w-4 h-4 transition-transform group-hover/nav:scale-110 ${isActive ? 'text-[var(--accent-green)]' : ''}`} />
                      {!isCollapsed && <span className="font-semibold whitespace-nowrap">{item.label}</span>}
                    </div>

                    {item.badge && !isCollapsed && (
                      <span
                        className="relative z-10 px-1.5 py-0.5 rounded-full text-[9px] font-black text-white shadow-sm"
                        style={{ background: 'var(--accent-green)' }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.badge && isCollapsed && (
                      <span
                        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                        style={{ background: 'var(--accent-green)' }}
                      />
                    )}
                  </button>

                  {/* Floating Glassmorphic Hover Popover Badge (Collapsed State) */}
                  {isCollapsed && (
                    <div className="absolute left-[56px] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/nav:opacity-100 group-hover/nav:translate-x-0 -translate-x-2 transition-all duration-200 ease-out whitespace-nowrap">
                      <div
                        className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl border backdrop-blur-md flex items-center gap-1.5"
                        style={{
                          background: 'var(--bg-primary)',
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span
                            className="px-1.5 py-0.2 rounded-full text-[9px] font-black text-white"
                            style={{ background: 'var(--accent-green)' }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
          {/* Quick Action Icons with Floating Hover Popovers */}
          <div
            className={`flex items-center ${
              isCollapsed ? 'flex-col gap-2 py-2' : 'justify-around py-1'
            } px-1 rounded-xl transition-all`}
            style={{ background: 'var(--bg-primary)' }}
          >
            {/* Dark / Light Toggle */}
            <div className="relative group/act">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                {mode === 'dark' ? (
                  <Sun className="w-4 h-4 hover:text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 hover:text-indigo-400" />
                )}
              </motion.button>
              {isCollapsed && (
                <div className="absolute left-[56px] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/act:opacity-100 group-hover/act:translate-x-0 -translate-x-2 transition-all duration-200 ease-out whitespace-nowrap">
                  <div
                    className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl border backdrop-blur-md"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {mode === 'dark' ? 'Switch to Light Mode ☀️' : 'Switch to Dark Mode 🌙'}
                  </div>
                </div>
              )}
            </div>




            {/* Create Group Button */}
            <div className="relative group/act">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsGroupModalOpen(true)}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Users className="w-4 h-4 hover:text-[var(--accent-green)]" />
              </motion.button>
              {isCollapsed && (
                <div className="absolute left-[56px] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/act:opacity-100 group-hover/act:translate-x-0 -translate-x-2 transition-all duration-200 ease-out whitespace-nowrap">
                  <div
                    className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl border backdrop-blur-md"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Create New Group 👥
                  </div>
                </div>
              )}
            </div>

            {/* Join Room Button */}
            <div className="relative group/act">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsJoinModalOpen(true)}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Key className="w-4 h-4 hover:text-[var(--accent-green)]" />
              </motion.button>
              {isCollapsed && (
                <div className="absolute left-[56px] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/act:opacity-100 group-hover/act:translate-x-0 -translate-x-2 transition-all duration-200 ease-out whitespace-nowrap">
                  <div
                    className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl border backdrop-blur-md"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Join Room with Code 🔑
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Profile Card with Floating Popover */}
          <div className="relative group/prof">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsProfileOpen(true)}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2' : 'gap-2.5 p-2'
              } rounded-xl text-left border border-transparent hover:border-border-default/40 transition-all cursor-pointer`}
              style={{ background: 'var(--bg-primary)' }}
            >
              <Avatar
                src={session?.user?.image || undefined}
                name={session?.user?.name || 'User'}
                size="sm"
                showOnlineIndicator={true}
                isOnline={true}
              />
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                  <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {session?.user?.name || 'User'}
                  </span>
                  <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: 'var(--accent-green)' }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-ping inline-block" style={{ background: 'var(--accent-green)' }} />
                    Online
                  </span>
                </div>
              )}
            </motion.button>
            {isCollapsed && (
              <div className="absolute left-[56px] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/prof:opacity-100 group-hover/prof:translate-x-0 -translate-x-2 transition-all duration-200 ease-out whitespace-nowrap">
                <div
                  className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl border backdrop-blur-md flex items-center gap-2"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span>{session?.user?.name || 'User Profile'}</span>
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] inline-block" />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
