'use client';

import React from 'react';

interface ToolbarProps {
  micMuted: boolean;
  videoOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  activeCenterTab: 'video' | 'whiteboard' | 'notes' | 'presentation';
  activeSidebarTab: 'none' | 'chat' | 'polls' | 'participants' | 'ai';
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onChangeCenterTab: (tab: 'video' | 'whiteboard' | 'notes' | 'presentation') => void;
  onToggleSidebarTab: (tab: 'chat' | 'polls' | 'participants' | 'ai') => void;
}

export default function Toolbar({
  micMuted,
  videoOff,
  isScreenSharing,
  isHandRaised,
  activeCenterTab,
  activeSidebarTab,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHand,
  onChangeCenterTab,
  onToggleSidebarTab,
}: ToolbarProps) {
  return (
    <div className="min-h-16 py-2 bg-bg-secondary border-t border-border-default/50 px-3 md:px-6 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 shrink-0 select-none z-20 overflow-x-auto no-scrollbar transition-colors">

      {/* Left: Quick Audio / Video Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleMic}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-extrabold shadow-sm border ${
            micMuted
              ? 'bg-bg-input hover:bg-red-500/15 text-red-600 dark:text-red-400 border-border-default/40'
              : 'bg-brand-green hover:bg-brand-hover text-white border-brand-green'
          }`}
          title={micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          <span>{micMuted ? '🔇 Mic Off' : '🎙️ Mic On'}</span>
        </button>

        <button
          onClick={onToggleVideo}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-extrabold shadow-sm border ${
            videoOff
              ? 'bg-bg-input hover:bg-red-500/15 text-red-600 dark:text-red-400 border-border-default/40'
              : 'bg-brand-green hover:bg-brand-hover text-white border-brand-green'
          }`}
          title={videoOff ? 'Start Camera' : 'Stop Camera'}
        >
          <span>{videoOff ? '🚫 Cam Off' : '📹 Cam On'}</span>
        </button>

        <button
          onClick={onToggleScreenShare}
          className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm ${
            isScreenSharing
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-bg-input border border-border-default/40 text-text-primary hover:bg-border-default/30'
          }`}
          title="Share Screen (Entire Screen, App Window, or Browser Tab)"
        >
          <span>{isScreenSharing ? '🖥️ Stop Share' : '🖥️ Share Screen'}</span>
        </button>

        <button
          onClick={onToggleHand}
          className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm ${
            isHandRaised
              ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
              : 'bg-bg-input border border-border-default/40 text-text-primary hover:bg-border-default/30'
          }`}
          title="Raise Hand to Speak"
        >
          <span>✋ {isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
        </button>
      </div>

      {/* Center: Main Workspace Tool Tabs */}
      <div className="flex items-center bg-bg-input rounded-2xl p-1 border border-border-default/40 shrink-0 gap-1 shadow-inner">
        <button
          onClick={() => onChangeCenterTab('video')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeCenterTab === 'video'
              ? 'bg-brand-green hover:bg-brand-hover text-white shadow-md scale-105'
              : 'text-text-primary hover:text-text-primary hover:bg-bg-secondary/60'
          }`}
        >
          <span>📹</span> Video Grid
        </button>

        <button
          onClick={() => onChangeCenterTab('whiteboard')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeCenterTab === 'whiteboard'
              ? 'bg-brand-green hover:bg-brand-hover text-white shadow-md scale-105'
              : 'text-text-primary hover:text-text-primary hover:bg-bg-secondary/60'
          }`}
        >
          <span>📊</span> Whiteboard
        </button>

        <button
          onClick={() => onChangeCenterTab('notes')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeCenterTab === 'notes'
              ? 'bg-brand-green hover:bg-brand-hover text-white shadow-md scale-105'
              : 'text-text-primary hover:text-text-primary hover:bg-bg-secondary/60'
          }`}
        >
          <span>📝</span> Notes
        </button>

        <button
          onClick={() => onChangeCenterTab('presentation')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeCenterTab === 'presentation'
              ? 'bg-brand-green hover:bg-brand-hover text-white shadow-md scale-105'
              : 'text-text-primary hover:text-text-primary hover:bg-bg-secondary/60'
          }`}
        >
          <span>📈</span> PPT Slides
        </button>
      </div>

      {/* Right: Sidebar Toggle Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onToggleSidebarTab('participants')}
          className={`p-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shadow-sm border ${
            activeSidebarTab === 'participants'
              ? 'bg-brand-green border-brand-green text-white shadow-md'
              : 'bg-bg-input border-border-default/40 text-text-primary hover:bg-bg-secondary'
          }`}
          title="Participants List"
        >
          👥
        </button>

        <button
          onClick={() => onToggleSidebarTab('chat')}
          className={`p-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shadow-sm border ${
            activeSidebarTab === 'chat'
              ? 'bg-brand-green border-brand-green text-white shadow-md'
              : 'bg-bg-input border-border-default/40 text-text-primary hover:bg-bg-secondary'
          }`}
          title="In-Meeting Chat"
        >
          💬
        </button>

        <button
          onClick={() => onToggleSidebarTab('polls')}
          className={`p-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shadow-sm border ${
            activeSidebarTab === 'polls'
              ? 'bg-brand-green border-brand-green text-white shadow-md'
              : 'bg-bg-input border-border-default/40 text-text-primary hover:bg-bg-secondary'
          }`}
          title="Live Polls"
        >
          📊
        </button>

        <button
          onClick={() => onToggleSidebarTab('ai')}
          className={`p-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shadow-sm border ${
            activeSidebarTab === 'ai'
              ? 'bg-brand-green border-brand-green text-white shadow-md'
              : 'bg-bg-input border-border-default/40 text-text-primary hover:bg-bg-secondary'
          }`}
          title="AI Assistant & Transcripts"
        >
          🤖
        </button>
      </div>

    </div>
  );
}
