'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useChatStore } from '../../store/useChatStore';
import { useStudyRoomStore } from '../../features/study-room/store/useStudyRoomStore';
import MeetingHeader from '../../features/study-room/components/MeetingHeader';
import Toolbar from '../../features/study-room/components/Toolbar';
import ParticipantList from '../../features/study-room/components/ParticipantList';
import MeetingChat from '../../features/study-room/components/MeetingChat';
import PollsPanel from '../../features/study-room/components/PollsPanel';
import AISummaryPanel from '../../features/study-room/components/AISummaryPanel';

import VideoCall from './VideoCall';
import Whiteboard from './Whiteboard';
import SharedNotes from './SharedNotes';
import PresentationViewer from './PresentationViewer';
import { studyRoomService } from '../../features/study-room/services/studyRoomService';
import { getSocket } from '@/hooks/useSocket';

interface StudyRoomProps {
  conversationId: string;
}

export default function StudyRoom({ conversationId }: StudyRoomProps) {
  const { data: session } = useSession();
  const setActiveMeetingRoomId = useChatStore((state) => state.setActiveMeetingRoomId);
  const setActiveMeetingRoomUrl = useChatStore((state) => state.setActiveMeetingRoomUrl);
  const setCurrentRoom = useStudyRoomStore((state) => state.setCurrentRoom);
  const setMembers = useStudyRoomStore((state) => state.setMembers);
  const resetRoomState = useStudyRoomStore((state) => state.resetRoomState);
  const updateMember = useStudyRoomStore((state) => state.updateMember);
  const removeMember = useStudyRoomStore((state) => state.removeMember);
  const currentUserRole = useStudyRoomStore((state) => state.currentUserRole);

  const [micMuted, setMicMuted] = useState(true);
  const [videoOff, setVideoOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  const [centerTab, setCenterTab] = useState<'video' | 'whiteboard' | 'notes' | 'presentation'>('video');
  const [sidebarTab, setSidebarTab] = useState<'none' | 'chat' | 'polls' | 'participants' | 'ai'>('participants');

  // ─── Load Room Details & Real-time Sync on Mount ───────────────────────────
  const loadDetails = useCallback(() => {
    studyRoomService.getRoomDetails(conversationId).then((res) => {
      if (res.success && res.data) {
        setCurrentRoom(res.data.room);
        setMembers(res.data.members || []);
      }
    });
  }, [conversationId, setCurrentRoom, setMembers]);

  useEffect(() => {
    if (!conversationId) return;

    // Call join API to ensure member document exists in MongoDB
    studyRoomService.joinRoom(conversationId).then(() => {
      loadDetails();
    });

    const socket = getSocket();
    if (!socket) return;

    const joinSocketRooms = () => {
      socket.emit('join_room', conversationId);
      socket.emit('join_conversation', conversationId);
      socket.emit('room:join', {
        roomId: conversationId,
        userId: (socket as any).userId || session?.user?.id,
        userName: session?.user?.name || 'Participant',
        userImage: session?.user?.image || undefined,
      });
    };

    // Join immediately
    joinSocketRooms();

    // Auto-rejoin if socket reconnects
    socket.on('connect', joinSocketRooms);

    // Event listeners
    socket.on('room_member_joined', loadDetails);
    socket.on('participant:joined', loadDetails);
    socket.on('participant:left', ({ userId }: any) => {
      if (userId) removeMember(userId);
      loadDetails();
    });

    socket.on('participant_media_state', ({ userId, micMuted: muted, videoOff: camOff }: any) => {
      if (userId) updateMember(userId, { isMuted: muted, isCameraOff: camOff });
    });

    socket.on('raise_hand_toggle', ({ userId, isHandRaised: raised }: any) => {
      if (userId) updateMember(userId, { isHandRaised: raised });
    });

    socket.on('host_mute_all', () => {
      if (currentUserRole !== 'host') {
        setMicMuted(true);
        if (session?.user?.id) {
          updateMember(session.user.id, { isMuted: true });
        }
      }
    });

    socket.on('host:kicked', () => {
      alert('You have been removed from the room by the host.');
      handleExit();
    });

    socket.on('meeting:ended', () => {
      alert('The host has ended the meeting.');
      handleExit();
    });

    return () => {
      socket.off('connect', joinSocketRooms);
      socket.off('room_member_joined', loadDetails);
      socket.off('participant:joined', loadDetails);
      socket.off('participant:left');
      socket.off('participant_media_state');
      socket.off('raise_hand_toggle');
      socket.off('host_mute_all');
      socket.off('host:kicked');
      socket.off('meeting:ended');

      socket.emit('leave_room', conversationId);
      socket.emit('room:leave', { roomId: conversationId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, session?.user?.id]);

  const handleExit = () => {
    getSocket()?.emit('room:leave', { roomId: conversationId });
    resetRoomState();
    setActiveMeetingRoomId(null);
    setActiveMeetingRoomUrl(null);
  };

  const toggleSidebar = (tab: 'chat' | 'polls' | 'participants' | 'ai') => {
    setSidebarTab((prev) => (prev === tab ? 'none' : tab));
  };

  const handleToggleMic = () => {
    const next = !micMuted;
    setMicMuted(next);
    if (session?.user?.id) {
      updateMember(session.user.id, { isMuted: next });
      getSocket()?.emit('participant_media_state', {
        conversationId,
        userId: session.user.id,
        micMuted: next,
        videoOff,
      });
    }
  };

  const handleToggleVideo = () => {
    const next = !videoOff;
    setVideoOff(next);
    if (session?.user?.id) {
      updateMember(session.user.id, { isCameraOff: next });
      getSocket()?.emit('participant_media_state', {
        conversationId,
        userId: session.user.id,
        micMuted,
        videoOff: next,
      });
    }
  };

  const handleToggleHand = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    if (session?.user?.id) {
      updateMember(session.user.id, { isHandRaised: next });
      getSocket()?.emit('raise_hand_toggle', {
        conversationId,
        userId: session.user.id,
        userName: session.user.name || 'Participant',
        isHandRaised: next,
      });
    }
  };

  const handleToggleScreenShare = () => {
    setIsScreenSharing((prev) => {
      const next = !prev;
      if (next) {
        setCenterTab('video');
      }
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary select-none z-10 relative overflow-hidden transition-colors">

      {/* Top Header */}
      <MeetingHeader
        onLeave={handleExit}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">

        {/* Left: Participants */}
        {sidebarTab === 'participants' && <ParticipantList />}

        {/* Center: Main workspace tab */}
        <div className="flex-1 h-full p-3 min-w-0 bg-bg-primary overflow-hidden transition-colors">
          {centerTab === 'video' ? (
            <VideoCall
              conversationId={conversationId}
              micMuted={micMuted}
              videoOff={videoOff}
              isScreenSharing={isScreenSharing}
              onScreenShareToggle={setIsScreenSharing}
            />
          ) : centerTab === 'whiteboard' ? (
            <Whiteboard conversationId={conversationId} />
          ) : centerTab === 'notes' ? (
            <SharedNotes conversationId={conversationId} />
          ) : (
            <PresentationViewer conversationId={conversationId} />
          )}
        </div>

        {/* Right: Chat / Polls / AI */}
        {sidebarTab === 'chat' ? (
          <MeetingChat conversationId={conversationId} />
        ) : sidebarTab === 'polls' ? (
          <PollsPanel />
        ) : sidebarTab === 'ai' ? (
          <AISummaryPanel />
        ) : null}

      </div>

      {/* Bottom Toolbar */}
      <Toolbar
        micMuted={micMuted}
        videoOff={videoOff}
        isScreenSharing={isScreenSharing}
        isHandRaised={isHandRaised}
        activeCenterTab={centerTab}
        activeSidebarTab={sidebarTab}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleHand={handleToggleHand}
        onChangeCenterTab={setCenterTab}
        onToggleSidebarTab={toggleSidebar}
      />

    </div>
  );
}
