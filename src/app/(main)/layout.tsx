'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '../../components/sidebar/Sidebar';
import LeftNav from '../../components/navigation/LeftNav';
import { useChatStore } from '../../store/useChatStore';
import { useUIStore } from '../../store/useUIStore';
import { cn } from '../../utils/cn';
import { useSocket } from '../../hooks/useSocket';

import PageTransition from '../../components/shared/PageTransition';

import JoinRoomModal from '@/features/study-room/components/JoinRoomModal';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { setConversations, setActiveConversationId } = useChatStore();
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  // Initialise Socket.IO connection for real-time events
  useSocket();

  // 1. Session Redirect checks
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // 2. Fetch all user conversations on startup
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/conversations');
        const data = await res.json();
        if (data.success) {
          setConversations(data.data);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      }
    };

    fetchConversations();
  }, [status, setConversations]);

  const [joinLinkCode, setJoinLinkCode] = useState<string | undefined>(undefined);

  // 3. Keep selected conversation matching pathname URL route or joinRoom searchParam link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const joinCode = searchParams.get('joinRoom');
      if (joinCode) {
        setJoinLinkCode(joinCode.toUpperCase());
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }
    }

    const parts = pathname.split('/');
    const chatIndex = parts.indexOf('chat');
    if (chatIndex !== -1 && parts[chatIndex + 1]) {
      setActiveConversationId(parts[chatIndex + 1]);
      setSidebarOpen(false); // Autofocus chat window on mobile viewport
    } else {
      setActiveConversationId(null);
      setSidebarOpen(true);
    }
  }, [pathname, setActiveConversationId, setSidebarOpen]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#111b21] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-green border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen h-screen w-screen overflow-hidden flex bg-bg-primary text-text-primary">
      <LeftNav />

      {/* 
        Multi-panel layout: 
        - Far Left: Navigation Bar (LeftNav)
        - Middle-Left: Conversations Sidebar
        - Middle-Right: Active Chat Thread (ChatWindow)
        - Far Right: Contact Details Drawer (RightInfoPanel)
      */}
      <div className="flex-1 flex h-full overflow-hidden relative">
        {/* Left column sidebar panel */}
        <aside
          className={cn(
            'absolute lg:relative z-20 h-full w-full lg:w-[380px] shrink-0 transition-transform duration-200 lg:translate-x-0 bg-bg-secondary border-r border-border-default',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <Sidebar />
        </aside>

        {/* Right column chat window panel */}
        <main
          className={cn(
            'flex-1 h-full overflow-hidden transition-all duration-200 z-10',
            isSidebarOpen ? 'hidden lg:flex flex-col' : 'flex flex-col w-full lg:w-auto'
          )}
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <JoinRoomModal
        isOpen={!!joinLinkCode}
        initialRoomCode={joinLinkCode}
        onClose={() => setJoinLinkCode(undefined)}
      />
    </div>
  );
}
