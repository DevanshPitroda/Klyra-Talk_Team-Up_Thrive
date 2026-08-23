'use client';

import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import Avatar from '../ui/Avatar';

interface SidebarHeaderProps {
  onSearchClick: () => void;
}

import RoomCreationModal from '@/features/study-room/components/RoomCreationModal';
import JoinRoomModal from '@/features/study-room/components/JoinRoomModal';
import { useStudyRoomStore } from '@/features/study-room/store/useStudyRoomStore';
import CreateGroupModal from '../group/CreateGroupModal';
import ProfileModal from '../profile/ProfileModal';
import ThemeSwitcher from '../theme/ThemeSwitcher';

export default function SidebarHeader({ onSearchClick }: SidebarHeaderProps) {
  const { data: session } = useSession();
  const { setIsCreationModalOpen } = useStudyRoomStore();
  const [isJoinModalOpen, setIsJoinModalOpen] = React.useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [isThemeSwitcherOpen, setIsThemeSwitcherOpen] = React.useState(false);

  return (
    <>
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      <ThemeSwitcher
        isOpen={isThemeSwitcherOpen}
        onClose={() => setIsThemeSwitcherOpen(false)}
      />

      <div className="h-16 bg-bg-secondary border-b border-border-default flex items-center justify-between px-4 shrink-0 shadow-sm">
        {/* Current User details */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="focus:outline-none hover:opacity-80 transition-opacity"
            title="Profile Settings"
          >
            <Avatar
              src={session?.user?.image || undefined}
              name={session?.user?.name || 'User'}
              size="md"
              showOnlineIndicator={true}
              isOnline={true}
            />
          </button>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold text-text-primary leading-tight truncate max-w-[120px]">
              {session?.user?.name}
            </span>
            <span className="text-[11px] text-brand-green font-medium">Online</span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          {/* 🎨 Theme Switcher Button */}
          <button
            onClick={() => setIsThemeSwitcherOpen(true)}
            className="p-2 hover:bg-bg-input rounded-full text-text-secondary hover:text-brand-green transition cursor-pointer text-base"
            title="Change Theme"
          >
            🎨
          </button>

          {/* New Group Button */}
          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="p-2 hover:bg-bg-input rounded-full text-text-secondary hover:text-brand-green transition cursor-pointer text-base"
            title="Create New Group"
          >
            👥
          </button>

          {/* Create Study Room Button */}
          <button
            onClick={() => setIsCreationModalOpen(true)}
            className="p-2 hover:bg-bg-input rounded-full text-text-secondary hover:text-brand-green transition cursor-pointer text-base"
            title="Create Study & Meeting Room"
          >
            🎓
          </button>

          {/* Join Room with Code Button */}
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="p-2 hover:bg-bg-input rounded-full text-text-secondary hover:text-brand-green transition cursor-pointer text-base"
            title="Join Room with Code or Link"
          >
            🔑
          </button>



          {/* Sign Out Button */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2 hover:bg-bg-input rounded-full text-text-secondary hover:text-text-primary transition cursor-pointer"
            title="Sign Out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
              />
            </svg>
          </button>
        </div>

        {/* Modals */}
        <RoomCreationModal />
        <JoinRoomModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
      </div>
    </>
  );
}
