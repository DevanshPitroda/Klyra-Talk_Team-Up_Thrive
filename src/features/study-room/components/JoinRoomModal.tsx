'use client';

import React, { useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useUIStore } from '@/store/useUIStore';
import { studyRoomService } from '../services/studyRoomService';
import { useSession } from 'next-auth/react';
import { getSocket } from '@/hooks/useSocket';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomCode?: string;
}

export default function JoinRoomModal({ isOpen, onClose, initialRoomCode }: JoinRoomModalProps) {
  const { data: session } = useSession();
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [displayName, setDisplayName] = useState(session?.user?.name || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialRoomCode) setRoomCode(initialRoomCode);
    if (session?.user?.name && !displayName) setDisplayName(session.user.name);
  }, [initialRoomCode, session?.user?.name, displayName, isOpen]);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    let input = roomCode.trim();
    if (!input) {
      setError('Please enter a room code or link');
      return;
    }

    // Extract room ID if user pasted a full link like http://localhost:3000/chat?joinRoom=XH9K-7PQR or /room/XH9K-7PQR
    let finalCode = input;
    if (input.toLowerCase().includes('/room/')) {
      const parts = input.split(/\/room\//i);
      if (parts[1]) {
        finalCode = parts[1].split('/')[0].split('?')[0].split('#')[0];
      }
    } else if (input.toLowerCase().includes('joinroom=')) {
      const parts = input.split(/joinroom=/i);
      if (parts[1]) {
        finalCode = parts[1].split('&')[0].split('#')[0];
      }
    }

    finalCode = finalCode.trim().toUpperCase();

    if (!finalCode) {
      setError('Invalid Room Code or Link');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ✅ CRITICAL: Register user as a member in the DB before opening the room
      const res = await studyRoomService.joinRoom(finalCode, password || undefined, displayName.trim() || undefined);

      if (!res.success) {
        if (res.passwordRequired) {
          setPasswordRequired(true);
          setError('This room requires a password');
          setLoading(false);
          return;
        }
        setError(res.error || 'Failed to join room');
        setLoading(false);
        return;
      }

      // ✅ Broadcast to existing room members that a new member joined
      const socket = getSocket();
      if (socket) {
        socket.emit('join_room', finalCode);
        socket.emit('join_conversation', finalCode);
        socket.emit('room_member_joined', { conversationId: finalCode });
      }

      onClose();
      useChatStore.getState().setActiveMeetingRoomId(finalCode);
      useUIStore.getState().setSidebarOpen(false);
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#182229] border border-border-default/40 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-text-primary p-6 space-y-4">
        
        <div className="flex items-center justify-between border-b border-border-default/30 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔑</span>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Join Study Room</h3>
              <p className="text-[10px] text-text-secondary">Enter 8-digit Room Code or paste Share Link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-sm font-bold cursor-pointer p-1 hover:bg-bg-input rounded-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-text-secondary">Your Display Name</label>
              {session?.user?.name && (
                <span className="text-[10px] text-brand-green font-semibold">
                  ✓ Pre-filled from account
                </span>
              )}
            </div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={session?.user?.name || 'Enter your name to join'}
              className="w-full px-3.5 py-2.5 bg-bg-input border border-border-default/40 rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Room Code or Link</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value);
                setError('');
                setPasswordRequired(false);
              }}
              placeholder="e.g. XH9K-7PQR or https://.../room/XH9K-7PQR"
              required
              autoFocus
              className="w-full px-3.5 py-2.5 bg-bg-input border border-border-default/40 rounded-xl text-xs font-mono font-bold tracking-wider text-text-primary focus:outline-none focus:border-brand-green uppercase"
            />
          </div>

          {passwordRequired && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Room Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter room password"
                autoFocus
                className="w-full px-3.5 py-2.5 bg-bg-input border border-border-default/40 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-green"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-bg-input hover:bg-border-default/40 text-text-secondary hover:text-text-primary rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-brand-green hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md disabled:opacity-60"
            >
              {loading ? '⏳ Joining...' : '🚀 Join Room'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
