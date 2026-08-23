'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useStudyRoomStore } from '../store/useStudyRoomStore';
import { getSocket } from '@/hooks/useSocket';
import { useChatStore } from '@/store/useChatStore';

interface MeetingHeaderProps {
  onLeave: () => void;
  onEndMeeting?: () => void;
}

export default function MeetingHeader({ onLeave, onEndMeeting }: MeetingHeaderProps) {
  const { data: session } = useSession();
  const currentRoom = useStudyRoomStore((state) => state.currentRoom);
  const currentUserRole = useStudyRoomStore((state) => state.currentUserRole);
  const members = useStudyRoomStore((state) => state.members);
  const activeMeetingRoomId = useChatStore((state) => state.activeMeetingRoomId);
  const [seconds, setSeconds] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const isHost =
    currentUserRole === 'host' ||
    currentUserRole === 'co-host' ||
    (session?.user?.id && (currentRoom as any)?.createdBy === session?.user?.id) ||
    (session?.user?.id && (currentRoom as any)?.hostId === session?.user?.id) ||
    members.some((m) => m.userId === session?.user?.id && (m.role === 'host' || m.role === 'co-host')) ||
    members.length <= 1;

  // Synchronized room duration counter based on room creation timestamp
  useEffect(() => {
    const updateTimer = () => {
      if (currentRoom?.createdAt) {
        const start = new Date(currentRoom.createdAt).getTime();
        const now = Date.now();
        const elapsed = Math.max(0, Math.floor((now - start) / 1000));
        setSeconds(elapsed);
      } else {
        setSeconds((s) => s + 1);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [currentRoom?.createdAt]);

  const formatDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyLink = () => {
    const code = currentRoom?.roomId || '';
    const text = `${window.location.origin}/chat?joinRoom=${code}`;
    navigator.clipboard?.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEndMeeting = () => {
    if (!confirm('End the meeting for all participants?')) return;
    if (activeMeetingRoomId) {
      getSocket()?.emit('meeting:end', { roomId: activeMeetingRoomId });
    }
    onEndMeeting?.();
    onLeave();
  };

  return (
    <div className="min-h-14 py-2 bg-bg-secondary border-b border-border-default/50 px-4 md:px-5 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 shrink-0 select-none z-20 transition-colors">
      
      {/* Left: Room Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center text-brand-green font-bold text-sm shrink-0">
            🎓
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-extrabold text-text-primary truncate">
              {currentRoom?.name || 'General Study Room'}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-text-secondary mt-0.5">
              <span className="font-mono bg-bg-input px-2 py-0.5 rounded-md text-brand-green font-bold border border-brand-green/20">
                {currentRoom?.roomId || 'ROOM'}
              </span>
              {currentRoom?.isLocked && (
                <span className="text-amber-400 font-semibold flex items-center gap-1">🔒 Locked</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={copyLink}
          className="px-3.5 py-1.5 bg-brand-green hover:bg-brand-hover text-white text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
          title="Copy Shareable Link"
        >
          {copiedLink ? '✓ Link Copied' : '🔗 Share Link'}
        </button>
      </div>

      {/* Center: Meeting Duration & Participants */}
      <div className="flex items-center gap-2.5">
        {/* Timer */}
        <div className="flex items-center gap-1.5 bg-bg-input border border-border-default/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-text-primary">
          <span className="text-xs">⏱️</span>
          <span>{formatDuration(seconds)}</span>
        </div>

        {/* Participant Count */}
        <div className="flex items-center gap-1.5 bg-bg-input border border-border-default/40 px-3 py-1.5 rounded-xl text-xs font-bold text-text-primary">
          <span>👥</span>
          <span>{members.length} {members.length === 1 ? 'Member' : 'Members'}</span>
        </div>
      </div>

      {/* Right: Exit / End Controls */}
      <div className="flex items-center gap-2">
        {/* Leave Button */}
        <button
          onClick={onLeave}
          className="px-3.5 py-1.5 bg-bg-input hover:bg-red-500/15 text-red-600 dark:text-red-400 border border-border-default/40 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
        >
          <span>❌</span> Leave
        </button>

        {/* End Meeting — Host Only */}
        {isHost && (
          <button
            onClick={handleEndMeeting}
            className="px-3.5 py-1.5 bg-bg-input hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-border-default/40 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
            title="End meeting for everyone"
          >
            <span>🛑</span> End Meeting
          </button>
        )}
      </div>

    </div>
  );
}
