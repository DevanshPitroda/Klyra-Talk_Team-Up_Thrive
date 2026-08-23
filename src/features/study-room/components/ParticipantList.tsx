'use client';

import React, { useEffect } from 'react';
import { useStudyRoomStore } from '../store/useStudyRoomStore';
import Avatar from '@/components/ui/Avatar';
import { getSocket } from '@/hooks/useSocket';
import { useChatStore } from '@/store/useChatStore';

export default function ParticipantList() {
  const members = useStudyRoomStore((state) => state.members);
  const currentUserRole = useStudyRoomStore((state) => state.currentUserRole);
  const updateMember = useStudyRoomStore((state) => state.updateMember);
  const activeMeetingRoomId = useChatStore((state) => state.activeMeetingRoomId);

  const isHostOrCoHost = currentUserRole === 'host' || currentUserRole === 'co-host';
  const raisedHandMembers = members.filter((m) => m.isHandRaised);

  // Sync real-time hand raise and media state events
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeMeetingRoomId) return;

    const onRaiseHandToggle = ({ userId, isHandRaised }: any) => {
      updateMember(userId, { isHandRaised });
    };

    const onMediaState = ({ userId, micMuted, videoOff }: any) => {
      updateMember(userId, { isMuted: micMuted, isCameraOff: videoOff });
    };

    socket.on('raise_hand_toggle', onRaiseHandToggle);
    socket.on('participant_media_state', onMediaState);

    return () => {
      socket.off('raise_hand_toggle', onRaiseHandToggle);
      socket.off('participant_media_state', onMediaState);
    };
  }, [activeMeetingRoomId, updateMember]);

  const handleLowerHand = (userId: string, userName: string) => {
    updateMember(userId, { isHandRaised: false });
    const socket = getSocket();
    if (socket && activeMeetingRoomId) {
      socket.emit('raise_hand_toggle', {
        conversationId: activeMeetingRoomId,
        userId,
        userName,
        isHandRaised: false,
      });
    }
  };

  const handleMuteAll = () => {
    members.forEach((m) => {
      if (m.role !== 'host') {
        updateMember(m.userId, { isMuted: true });
      }
    });

    const socket = getSocket();
    if (socket && activeMeetingRoomId) {
      socket.emit('host_mute_all', { conversationId: activeMeetingRoomId });
    }
  };

  return (
    <div className="w-64 bg-bg-secondary border-r border-border-default/50 flex flex-col h-full shrink-0 select-none text-text-primary transition-colors">

      {/* Header */}
      <div className="p-3.5 border-b border-border-default/40 flex items-center justify-between">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
          <span>👥 Participants</span>
          <span className="bg-bg-input border border-border-default/30 px-2 py-0.5 rounded text-[10px] text-brand-green font-bold">
            {members.length}
          </span>
        </h3>
      </div>

      {/* Host Controls Section */}
      {isHostOrCoHost && (
        <div className="p-3 border-b border-border-default/40 bg-bg-input/40 space-y-1.5">
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Host Controls</p>
          <div className="flex gap-2">
            <button
              onClick={handleMuteAll}
              className="flex-1 py-1.5 px-2 bg-bg-input hover:bg-red-500/15 border border-border-default/40 text-red-600 dark:text-red-400 text-[10px] font-extrabold rounded-xl transition cursor-pointer shadow-sm"
            >
              🔇 Mute All
            </button>
            {raisedHandMembers.length > 0 && (
              <button
                onClick={() => raisedHandMembers.forEach((m) => handleLowerHand(m.userId, m.userName))}
                className="flex-1 py-1.5 px-2 bg-bg-input hover:bg-amber-500/15 border border-border-default/40 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold rounded-xl transition cursor-pointer shadow-sm"
              >
                ✋ Lower Hands
              </button>
            )}
          </div>
        </div>
      )}

      {/* Raised Hands Queue */}
      {raisedHandMembers.length > 0 && (
        <div className="p-3 border-b border-border-default/40 bg-amber-500/10 space-y-2">
          <p className="text-[10px] font-bold text-amber-500 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <span>✋ Raised Hands Queue</span>
            <span className="bg-amber-500/20 px-1.5 rounded font-mono">{raisedHandMembers.length}</span>
          </p>
          <div className="space-y-1.5">
            {raisedHandMembers.map((member) => (
              <div key={member.userId} className="flex items-center justify-between bg-bg-input p-2 rounded-xl border border-amber-500/30">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={member.userName} src={member.userImage} size="sm" />
                  <span className="text-xs font-bold text-text-primary truncate">{member.userName}</span>
                </div>
                {isHostOrCoHost && (
                  <button
                    onClick={() => handleLowerHand(member.userId, member.userName)}
                    className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded font-bold transition cursor-pointer shrink-0 shadow-sm"
                  >
                    Lower
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-bg-input/60 transition group border border-transparent hover:border-border-default/20"
          >
            {/* Avatar & Name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <Avatar name={member.userName} src={member.userImage} size="sm" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-text-primary truncate">{member.userName}</span>
                  {member.role === 'host' && (
                    <span className="bg-brand-green text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shadow-sm">
                      Host
                    </span>
                  )}
                  {member.role === 'co-host' && (
                    <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shadow-sm">
                      Co-Host
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5 text-xs shrink-0">
              {member.isHandRaised && <span>✋</span>}
              <span className={member.isMuted ? 'text-red-400' : 'text-brand-green'}>
                {member.isMuted ? '🔇' : '🎙️'}
              </span>
              <span className={member.isCameraOff ? 'text-red-400' : 'text-brand-green'}>
                {member.isCameraOff ? '🚫' : '📹'}
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
