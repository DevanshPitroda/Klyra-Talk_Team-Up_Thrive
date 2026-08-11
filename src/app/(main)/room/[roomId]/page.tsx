'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { studyRoomService } from '@/features/study-room/services/studyRoomService';
import { useStudyRoomStore } from '@/features/study-room/store/useStudyRoomStore';
import StudyRoom from '@/components/chat/StudyRoom';

export default function StandaloneRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { setCurrentRoom, setCurrentUserRole, isWaitingRoom, setIsWaitingRoom } = useStudyRoomStore();

  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isJoining, setIsJoining] = useState(true);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      attemptJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, roomId]);

  const attemptJoin = async (pwd?: string) => {
    setIsJoining(true);
    setErrorMsg('');

    try {
      const res = await studyRoomService.joinRoom(roomId, pwd || password);

      if (res.success && res.data) {
        setCurrentRoom(res.data.room);
        setCurrentUserRole(res.data.member.role);

        if (res.data.status === 'pending') {
          setIsWaitingRoom(true);
        } else {
          setIsWaitingRoom(false);
          setJoinedSuccess(true);
        }
        setPasswordRequired(false);
      } else {
        if (res.passwordRequired) {
          setPasswordRequired(true);
        } else {
          setErrorMsg(res.error || 'Failed to join room');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred joining the room');
    } finally {
      setIsJoining(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      attemptJoin(password);
    }
  };

  if (status === 'loading' || isJoining) {
    return (
      <div className="h-screen w-screen bg-[#0b141a] flex flex-col items-center justify-center gap-3 text-text-secondary select-none">
        <div className="w-10 h-10 border-3 border-brand-green border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Joining Study Room ({roomId})...</p>
      </div>
    );
  }

  // Password Prompt Screen
  if (passwordRequired) {
    return (
      <div className="h-screen w-screen bg-[#0b141a] flex items-center justify-center p-4 select-none">
        <div className="bg-[#182229] border border-border-default/40 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Password Protected Room</h3>
              <p className="text-[11px] text-text-secondary">Enter the room password to enter ({roomId})</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password..."
              required
              autoFocus
              className="w-full px-3 py-2 bg-bg-input border border-border-default/40 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-green"
            />

            {errorMsg && <p className="text-xs text-red-400 font-medium">{errorMsg}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push('/chat')}
                className="flex-1 py-2 bg-bg-input text-text-secondary hover:text-text-primary text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Back to Chat
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-brand-green hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Submit & Join
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Waiting Room Screen
  if (isWaitingRoom) {
    return (
      <div className="h-screen w-screen bg-[#0b141a] flex items-center justify-center p-4 select-none">
        <div className="bg-[#182229] border border-border-default/40 p-8 rounded-2xl w-full max-w-md text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-brand-green/15 text-brand-green rounded-full flex items-center justify-center text-3xl mx-auto animate-pulse">
            ⏳
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Waiting for Host Approval</h3>
            <p className="text-xs text-text-secondary mt-1">
              You are in the waiting room for <span className="font-semibold text-text-primary">{roomId}</span>.<br />
              The host will admit you shortly.
            </p>
          </div>
          <button
            onClick={() => router.push('/chat')}
            className="px-5 py-2 bg-bg-input hover:bg-border-default/40 text-text-secondary hover:text-text-primary text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Leave Waiting Room
          </button>
        </div>
      </div>
    );
  }

  // Error screen
  if (errorMsg) {
    return (
      <div className="h-screen w-screen bg-[#0b141a] flex items-center justify-center p-4 select-none">
        <div className="bg-[#182229] border border-border-default/40 p-6 rounded-2xl w-full max-w-md text-center shadow-2xl space-y-4">
          <span className="text-4xl">⚠️</span>
          <div>
            <h3 className="text-sm font-bold text-red-400">Could Not Join Room</h3>
            <p className="text-xs text-text-secondary mt-1">{errorMsg}</p>
          </div>
          <button
            onClick={() => router.push('/chat')}
            className="px-5 py-2 bg-brand-green text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Return to Chat
          </button>
        </div>
      </div>
    );
  }

  // Active Study Room Screen
  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b141a]">
      <StudyRoom conversationId={roomId} />
    </div>
  );
}
