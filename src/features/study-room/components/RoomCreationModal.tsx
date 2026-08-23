'use client';

import React, { useState } from 'react';
import { useStudyRoomStore } from '../store/useStudyRoomStore';
import { studyRoomService } from '../services/studyRoomService';
import { useChatStore } from '@/store/useChatStore';
import { useUIStore } from '@/store/useUIStore';
import { getSocket } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';

export default function RoomCreationModal() {
  const { data: session } = useSession();
  const isCreationModalOpen = useStudyRoomStore((state) => state.isCreationModalOpen);
  const setIsCreationModalOpen = useStudyRoomStore((state) => state.setIsCreationModalOpen);
  const setCurrentRoom = useStudyRoomStore((state) => state.setCurrentRoom);
  const setCurrentUserRole = useStudyRoomStore((state) => state.setCurrentUserRole);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const setActiveMeetingRoomId = useChatStore((state) => state.setActiveMeetingRoomId);

  const [name, setName] = useState(`${session?.user?.name || 'User'}'s Study Room`);
  const [password, setPassword] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [maxParticipants, setMaxParticipants] = useState(25);
  const [allowCamera, setAllowCamera] = useState(true);
  const [allowMic, setAllowMic] = useState(true);
  const [allowScreenShare, setAllowScreenShare] = useState(true);
  const [allowChat, setAllowChat] = useState(true);
  const [autoAdmit, setAutoAdmit] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isCreationModalOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const res = await studyRoomService.createRoom({
        name: name.trim(),
        password: password.trim() || undefined,
        visibility,
        maxParticipants: Number(maxParticipants),
        permissions: {
          allowCamera,
          allowMic,
          allowScreenShare,
          allowChat,
        },
        autoAdmit,
      });

      if (res.success && res.data) {
        setCreatedRoom(res.data);
        setCurrentRoom(res.data);
        setCurrentUserRole('host');
      }
    } catch (err) {
      console.error('Error creating room:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard?.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleEnterRoom = () => {
    if (createdRoom) {
      setActiveMeetingRoomId(createdRoom.roomId);
      useUIStore.getState().setSidebarOpen(false);
    }
    setIsCreationModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#182229] border border-border-default/40 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-text-primary">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-bg-secondary border-b border-border-default/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎓</span>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Create Study & Meeting Room</h3>
              <p className="text-[10px] text-text-secondary">Configure room settings & permissions</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreationModalOpen(false)}
            className="text-text-secondary hover:text-text-primary text-sm font-bold cursor-pointer transition p-1 hover:bg-bg-input rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        {!createdRoom ? (
          <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

            {/* Room Name */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Room Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Physics Study Session"
                required
                className="w-full px-3 py-2 bg-bg-input border border-border-default/30 rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-brand-green"
              />
            </div>

            {/* Password (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Optional Password <span className="text-[10px] opacity-70">(Leave blank for open access)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3 py-2 bg-bg-input border border-border-default/30 rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-brand-green"
              />
            </div>

            {/* Visibility & Max Participants */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e: any) => setVisibility(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-input border border-border-default/30 rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-brand-green cursor-pointer"
                >
                  <option value="public">🌐 Public (Listed)</option>
                  <option value="private">🔒 Private (Link Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Max Participants</label>
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-bg-input border border-border-default/30 rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-brand-green"
                />
              </div>
            </div>

            {/* Room Permissions Toggles */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-text-primary mb-2">Participant Default Permissions</label>
              <div className="grid grid-cols-2 gap-2.5 bg-bg-primary/40 p-3 rounded-xl border border-border-default/20">

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCamera}
                    onChange={(e) => setAllowCamera(e.target.checked)}
                    className="accent-brand-green rounded"
                  />
                  <span>📷 Allow Cameras</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowMic}
                    onChange={(e) => setAllowMic(e.target.checked)}
                    className="accent-brand-green rounded"
                  />
                  <span>🎙️ Allow Microphones</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowScreenShare}
                    onChange={(e) => setAllowScreenShare(e.target.checked)}
                    className="accent-brand-green rounded"
                  />
                  <span>🖥️ Allow Screen Share</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowChat}
                    onChange={(e) => setAllowChat(e.target.checked)}
                    className="accent-brand-green rounded"
                  />
                  <span>💬 Allow Meeting Chat</span>
                </label>

              </div>
            </div>

            {/* Auto Admit toggle */}
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoAdmit}
                onChange={(e) => setAutoAdmit(e.target.checked)}
                className="accent-brand-green rounded"
              />
              <span>⚡ Auto Admit (Skip waiting room for participants)</span>
            </label>

            {/* Submit CTA */}
            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setIsCreationModalOpen(false)}
                className="flex-1 py-2.5 bg-bg-input hover:bg-border-default/40 text-text-secondary hover:text-text-primary rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-brand-green hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>🚀 Create Room</span>
                )}
              </button>
            </div>

          </form>
        ) : (
          /* Created Success Screen */
          <div className="p-6 space-y-5 text-center">

            <div className="w-14 h-14 bg-brand-green/20 border border-brand-green/30 text-brand-green rounded-full flex items-center justify-center text-2xl mx-auto">
              ✨
            </div>

            <div>
              <h4 className="text-base font-bold text-text-primary">Room Ready!</h4>
              <p className="text-xs text-text-secondary mt-1">{createdRoom.name}</p>
            </div>

            {/* Room ID Badge */}
            <div className="bg-bg-input border border-border-default/40 p-4 rounded-xl space-y-2">
              <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Room Code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-black font-mono text-brand-green tracking-widest">
                  {createdRoom.roomId}
                </span>
                <button
                  onClick={() => copyToClipboard(createdRoom.roomId, 'code')}
                  className="px-3 py-1 bg-brand-green/20 hover:bg-brand-green/30 text-brand-green text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  {copiedCode ? '✓ Copied' : '📋 Copy Code'}
                </button>
              </div>
            </div>

            {/* Share Link */}
            <div className="bg-bg-input border border-border-default/40 p-3 rounded-xl space-y-1.5 text-left">
              <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Share Link</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-text-primary font-mono truncate">{createdRoom.shareLink}</span>
                <button
                  onClick={() => copyToClipboard(createdRoom.shareLink, 'link')}
                  className="px-3 py-1 bg-bg-secondary hover:bg-border-default/40 text-text-primary text-xs font-semibold rounded-lg transition cursor-pointer shrink-0"
                >
                  {copiedLink ? '✓ Copied' : '🔗 Copy Link'}
                </button>
              </div>
            </div>

            <button
              onClick={handleEnterRoom}
              className="w-full py-3 bg-brand-green hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
            >
              🎉 Enter Study Room Now
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
