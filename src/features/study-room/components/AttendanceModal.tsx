'use client';

import React from 'react';
import { useStudyRoomStore } from '../store/useStudyRoomStore';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AttendanceModal({ isOpen, onClose }: AttendanceModalProps) {
  const { members, currentRoom } = useStudyRoomStore();

  if (!isOpen) return null;

  const exportCSV = () => {
    const headers = ['User Name', 'Role', 'Status', 'Joined Time'];
    const rows = members.map((m) => [
      `"${m.userName}"`,
      m.role,
      m.status,
      new Date(m.joinedAt || Date.now()).toLocaleTimeString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_${currentRoom?.roomId || 'room'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#182229] border border-border-default/40 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-text-primary">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-bg-secondary border-b border-border-default/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📋</span>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Meeting Attendance Log</h3>
              <p className="text-[10px] text-text-secondary">Track join time & export report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-sm font-bold cursor-pointer p-1 hover:bg-bg-input rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Attendance Table */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-input text-text-secondary font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2.5 rounded-l-xl">Participant</th>
                <th className="p-2.5">Role</th>
                <th className="p-2.5">Joined At</th>
                <th className="p-2.5 rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/20">
              {members.map((m) => (
                <tr key={m.userId} className="hover:bg-bg-input/40 transition">
                  <td className="p-2.5 font-bold text-text-primary">{m.userName}</td>
                  <td className="p-2.5 capitalize text-brand-green font-semibold">{m.role}</td>
                  <td className="p-2.5 text-text-secondary font-mono text-[11px]">
                    {new Date(m.joinedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-2.5">
                    <span className="bg-brand-green/20 text-brand-green text-[10px] px-2 py-0.5 rounded-full font-bold">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-bg-secondary border-t border-border-default/30 flex items-center justify-between">
          <span className="text-xs text-text-secondary">Total Attendees: {members.length}</span>
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-brand-green hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition cursor-pointer shadow flex items-center gap-1.5"
          >
            📥 Export CSV Report
          </button>
        </div>

      </div>
    </div>
  );
}
