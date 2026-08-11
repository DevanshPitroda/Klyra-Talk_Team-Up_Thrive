'use client';

import React, { useState } from 'react';
import { useStudyRoomStore } from '../store/useStudyRoomStore';

interface BreakoutRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BreakoutRoomsModal({ isOpen, onClose }: BreakoutRoomsModalProps) {
  const { members } = useStudyRoomStore();
  const [roomCount, setRoomCount] = useState(2);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);

  if (!isOpen) return null;

  const handleCreateRooms = () => {
    const newRooms = Array.from({ length: roomCount }).map((_, idx) => ({
      id: `room_${idx + 1}`,
      name: `Breakout Room ${String.fromCharCode(65 + idx)}`,
    }));
    setRooms(newRooms);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#182229] border border-border-default/40 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-text-primary p-6 space-y-4">

        <div className="flex items-center justify-between border-b border-border-default/30 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔀</span>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Breakout Rooms</h3>
              <p className="text-[10px] text-text-secondary">Split participants into smaller discussion groups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-sm font-bold cursor-pointer p-1 hover:bg-bg-input rounded-lg"
          >
            ✕
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Number of Breakout Rooms</label>
              <select
                value={roomCount}
                onChange={(e) => setRoomCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-bg-input border border-border-default/30 rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-brand-green"
              >
                <option value={2}>2 Breakout Rooms (Room A, Room B)</option>
                <option value={3}>3 Breakout Rooms (Room A, B, C)</option>
                <option value={4}>4 Breakout Rooms (Room A, B, C, D)</option>
              </select>
            </div>

            <button
              onClick={handleCreateRooms}
              className="w-full py-2.5 bg-brand-green hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition cursor-pointer shadow"
            >
              ⚡ Automatically Assign & Launch
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {rooms.map((room) => (
                <div key={room.id} className="bg-bg-input p-3 rounded-xl border border-border-default/30 space-y-1">
                  <h4 className="text-xs font-bold text-brand-green">{room.name}</h4>
                  <p className="text-[10px] text-text-secondary">Assigned: {Math.ceil(members.length / rooms.length)} users</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setRooms([])}
              className="w-full py-2 bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl cursor-pointer"
            >
              🔄 Return Everyone to Main Room
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
