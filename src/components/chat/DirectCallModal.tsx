'use client';

import React, { useState, useEffect, useRef } from 'react';
import Avatar from '../ui/Avatar';
import { useChatStore } from '@/store/useChatStore';
import { getSocket } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';

interface DirectCallModalProps {
  isOpen: boolean;
  type: 'audio' | 'video';
  targetUser: {
    _id: string;
    name: string;
    image?: string;
  };
  onClose: () => void;
  onUpgradeToGroup: (invitedUserIds: string[]) => void;
}

export default function DirectCallModal({
  isOpen,
  type,
  targetUser,
  onClose,
  onUpgradeToGroup,
}: DirectCallModalProps) {
  const { data: session } = useSession();
  const conversations = useChatStore((state) => state.conversations);

  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(type === 'audio');
  const [callDuration, setCallDuration] = useState(0);

  // Add People / Upgrade to Group Modal State
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // WebRTC Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Duration Timer
  useEffect(() => {
    if (!isOpen) return;
    setCallStatus('calling');
    setCallDuration(0);

    // Acquire local media
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: type === 'video' })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current && type === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        // Simulate connection after 2 seconds or socket acceptance
        const connectTimer = setTimeout(() => {
          setCallStatus('connected');
        }, 2000);

        return () => clearTimeout(connectTimer);
      })
      .catch((err) => {
        console.error('Media error in direct call:', err);
      });

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, [isOpen, type]);

  useEffect(() => {
    if (callStatus !== 'connected') return;
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [callStatus]);

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicMuted(!track.enabled);
    }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOff(!track.enabled);
    }
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    getSocket()?.emit('direct_call:end', { targetUserId: targetUser._id });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    onClose();
  };

  const handleConfirmAddPeople = () => {
    if (selectedUserIds.length === 0) return;
    onUpgradeToGroup(selectedUserIds);
    setShowAddPeople(false);
    onClose();
  };

  // Get available contacts from conversations to add
  const availableContacts = conversations
    .filter((c) => c.type === 'direct' && c.members[0] && c.members[0]._id !== targetUser._id)
    .map((c) => c.members[0]);

  return (
    <div className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#182229] border border-border-default/40 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-6 space-y-6 relative">

        {/* Top Header */}
        <div className="w-full flex items-center justify-between text-text-secondary text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            <span className="uppercase tracking-wider font-bold text-brand-green">
              {type === 'video' ? '📹 1-on-1 Video Call' : '📞 1-on-1 Audio Call'}
            </span>
          </div>
          <span>{callStatus === 'connected' ? formatDuration(callDuration) : 'Ringing...'}</span>
        </div>

        {/* Call Stage (Avatar or Video Grid) */}
        <div className="w-full h-64 bg-[#0b141a] rounded-2xl border border-border-default/30 flex items-center justify-center relative overflow-hidden">
          {type === 'video' && !camOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <Avatar src={targetUser.image} name={targetUser.name} size="xl" />
              <div className="text-center">
                <h3 className="text-base font-bold text-text-primary">{targetUser.name}</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {callStatus === 'calling' ? 'Calling...' : 'Connected'}
                </p>
              </div>
            </div>
          )}

          {/* Local PiP Preview in Video Call */}
          {type === 'video' && (
            <div className="absolute bottom-3 right-3 w-24 h-32 bg-[#182229] border border-border-default/40 rounded-xl overflow-hidden shadow-lg flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Add People Modal Overlay inside Call */}
        {showAddPeople && (
          <div className="absolute inset-0 z-30 bg-[#182229] p-6 flex flex-col justify-between animate-in slide-in-from-bottom duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-border-default/30 pb-3 mb-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span>👥 Add People to Group Call</span>
                </h3>
                <button
                  onClick={() => setShowAddPeople(false)}
                  className="text-text-secondary hover:text-text-primary text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-text-secondary mb-3">
                Select contacts to convert this call into a Group Call:
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableContacts.length === 0 ? (
                  <p className="text-xs text-text-secondary italic">No other active contacts found.</p>
                ) : (
                  availableContacts.map((contact) => {
                    const isSelected = selectedUserIds.includes(contact._id);
                    return (
                      <button
                        key={contact._id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedUserIds((prev) => prev.filter((id) => id !== contact._id));
                          } else {
                            setSelectedUserIds((prev) => [...prev, contact._id]);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-brand-green/20 border-brand-green text-text-primary'
                            : 'bg-bg-input border-border-default/30 text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar src={contact.image} name={contact.name} size="sm" />
                          <span className="text-xs font-semibold">{contact.name}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="accent-brand-green rounded"
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border-default/30">
              <button
                onClick={() => setShowAddPeople(false)}
                className="flex-1 py-2.5 bg-bg-input text-text-secondary hover:text-text-primary text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddPeople}
                disabled={selectedUserIds.length === 0}
                className="flex-1 py-2.5 bg-brand-green hover:bg-brand-hover text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                🚀 Start Group Call ({selectedUserIds.length})
              </button>
            </div>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="flex items-center gap-3">
          {/* Mute Mic */}
          <button
            onClick={toggleMic}
            className={`p-3.5 rounded-2xl transition cursor-pointer border ${
              micMuted
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-bg-input border-border-default/30 text-text-primary hover:bg-border-default/40'
            }`}
            title={micMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {micMuted ? '🔇' : '🎙️'}
          </button>

          {/* Toggle Camera */}
          <button
            onClick={toggleCam}
            className={`p-3.5 rounded-2xl transition cursor-pointer border ${
              camOff
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-bg-input border-border-default/30 text-text-primary hover:bg-border-default/40'
            }`}
            title={camOff ? 'Turn Cam On' : 'Turn Cam Off'}
          >
            {camOff ? '🚫' : '📹'}
          </button>

          {/* ➕ Add People / Convert to Group Call */}
          <button
            onClick={() => setShowAddPeople(true)}
            className="px-4 py-3.5 bg-brand-green/20 border border-brand-green/40 text-brand-green hover:bg-brand-green/30 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2"
            title="Add People to convert to Group Call"
          >
            <span>👥+</span>
            <span>Add People</span>
          </button>

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition cursor-pointer shadow-lg"
            title="End Call"
          >
            📞❌
          </button>
        </div>

      </div>
    </div>
  );
}
