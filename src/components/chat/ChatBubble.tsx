'use client';

import React, { useState, useEffect } from 'react';
import { IMessageDetails, useChatStore } from '../../store/useChatStore';
import { useSession } from 'next-auth/react';
import { cn } from '../../utils/cn';
import { getSocket } from '../../hooks/useSocket';
import EmojiPicker from './EmojiPicker';

interface ChatBubbleProps {
  message: IMessageDetails;
  showSenderName: boolean;
  onForward?: (message: IMessageDetails) => void;
}

function ChatBubble({ message, showSenderName, onForward }: ChatBubbleProps) {
  const { data: session } = useSession();
  const updateMessage = useChatStore((state) => state.updateMessage);
  const removeMessage = useChatStore((state) => state.removeMessage);
  const setActiveMeetingRoomId = useChatStore((state) => state.setActiveMeetingRoomId);
  const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false);
  
  const isMe = session?.user?.id === message.senderId._id;
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // ─── View Once State ──────────────────────────────────────────────────────────
  const [showViewOnceModal, setShowViewOnceModal] = useState(false);

  // ─── Audio Transcription State ──────────────────────────────────────────────────
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [transcriptionError, setTranscriptionError] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('English');

  const handleTranscribe = async () => {
    const audioUrl = message.attachments?.[0]?.url || message.body;
    if (!audioUrl) return;
    
    setIsTranscribing(true);
    setTranscriptionError('');
    try {
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioDataUrl: audioUrl, targetLanguage })
      });
      const data = await res.json();
      if (data.success) {
        setTranscribedText(data.text);
      } else {
        setTranscriptionError(data.error || 'Failed to transcribe.');
      }
    } catch (err: any) {
      setTranscriptionError(err.message || 'Network error.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleOpenViewOnce = () => {
    if (isMe || message.viewOnceSeen) return;
    setShowViewOnceModal(true);
  };

  const handleCloseViewOnce = async () => {
    setShowViewOnceModal(false);
    if (!message.viewOnceSeen) {
      try {
        const res = await fetch(`/api/messages/${message._id}/view-once`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          // Immediately update store so UI updates without refresh
          updateMessage(message.conversationId, message._id, {
            viewOnceSeen: true,
            attachments: [],
          });
        }
      } catch (err) {
        console.error('Failed to mark view-once as seen:', err);
      }
    }
  };

  // ─── Poll State & Realtime Sync ──────────────────────────────────────────────
  const [poll, setPoll] = useState<any>(null);
  const [voting, setVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const handleDelete = async (scope: 'me' | 'everyone') => {
    setIsDeleting(true);
    setShowDeleteMenu(false);
    try {
      const res = await fetch(`/api/messages/${message._id}?scope=${scope}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (scope === 'me') {
          removeMessage(message.conversationId, message._id);
        } else {
          updateMessage(message.conversationId, message._id, { isDeleted: true, body: '' });
          getSocket()?.emit('message_deleted', {
            conversationId: message.conversationId,
            messageId: message._id,
          });
        }
      } else {
        alert(data.error || 'Failed to delete message');
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Network error while deleting message');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (message.type === 'poll' && message.body) {
      // 1. Fetch initial poll data
      fetch(`/api/polls?pollId=${message.body}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setPoll(data.data);
        })
        .catch((err) => console.error('Error fetching poll:', err));

      // 2. Setup socket listener for live votes
      const socket = getSocket();
      if (socket) {
        const handlePollUpdated = (eventData: any) => {
          if (eventData.pollId === message.body) {
            setPoll(eventData.poll);
          }
        };
        socket.on('poll_updated', handlePollUpdated);
        return () => {
          socket.off('poll_updated', handlePollUpdated);
        };
      }
    }
  }, [message.type, message.body]);

  const handleVote = async (optionIndex: number) => {
    if (!poll || voting) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/polls/${poll._id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIndex }),
      });
      const data = await res.json();
      if (data.success) {
        setPoll(data.data);
        
        // Broadcast vote to room members
        const socket = getSocket();
        if (socket) {
          socket.emit('poll_vote', {
            conversationId: message.conversationId,
            pollId: poll._id,
            poll: data.data,
          });
        }
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    } finally {
      setVoting(false);
    }
  };

  // ─── Location Parsing ────────────────────────────────────────────────────────
  let locationData: { lat: number; lng: number; label: string } | null = null;
  if (message.type === 'location' && message.body) {
    try {
      locationData = JSON.parse(message.body);
    } catch (err) {
      console.error('Failed to parse location body:', err);
    }
  }

  // ─── Renders ─────────────────────────────────────────────────────────────────
  const renderViewOnceContent = () => {
    const isMedia = message.attachments && message.attachments.length > 0;
    const viewOnceLabel = isMedia ? 'Photo' : 'Message';
    const viewOnceIcon = isMedia ? '📷' : '💬';

    if (message.viewOnceSeen) {
      return (
        <div className="flex items-center gap-2 py-1.5 px-2 text-text-secondary italic">
          <span className="text-base">{viewOnceIcon}</span>
          <span>Opened</span>
        </div>
      );
    }

    if (isMe) {
      return (
        <div className="flex items-center gap-2 py-1.5 px-2 text-text-secondary select-none">
          <span className="text-base text-brand-green">👁</span>
          <span>View Once {viewOnceLabel} Sent</span>
        </div>
      );
    }

    return (
      <button
        onClick={handleOpenViewOnce}
        className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-bg-primary/20 hover:bg-bg-primary/40 border border-border-default/20 transition text-left cursor-pointer w-full"
      >
        <span className="w-8 h-8 bg-brand-green/20 rounded-full flex items-center justify-center text-lg text-brand-green shrink-0">👁</span>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-text-primary text-xs">View Once {viewOnceLabel}</span>
          <span className="text-[10px] text-text-secondary mt-0.5">Tap to view</span>
        </div>
      </button>
    );
  };

  const renderLocationContent = () => {
    if (!locationData) return <p className="text-xs text-red-400">Invalid Location data</p>;
    const { lat, lng, label } = locationData;
    // Embed openstreetmap static map
    const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=260x130&maptype=mapnik&markers=${lat},${lng},red-pushpin`;

    return (
      <div className="flex flex-col rounded-xl overflow-hidden border border-border-default/20 bg-bg-primary/20 max-w-[260px]">
        <img src={mapUrl} alt="Location Map" className="w-full h-[130px] object-cover" />
        <div className="p-2 flex flex-col gap-1.5">
          <div className="flex items-start gap-1.5 min-w-0">
            <span className="text-base shrink-0">📍</span>
            <span className="text-[11px] font-medium text-text-primary truncate">{label}</span>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center py-1.5 bg-brand-green/15 hover:bg-brand-green/25 text-brand-green rounded-lg text-[10px] font-bold transition"
          >
            Open in Google Maps
          </a>
        </div>
      </div>
    );
  };

  const renderPollContent = () => {
    if (!poll) {
      return (
        <div className="flex items-center gap-2 py-3 px-6 justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-green border-t-transparent" />
          <span className="text-[11px] text-text-secondary">Loading poll...</span>
        </div>
      );
    }

    const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + opt.votes.length, 0);

    return (
      <div className="flex flex-col gap-3 p-1.5 max-w-[280px] min-w-[240px]">
        {/* Question */}
        <h4 className="text-xs font-bold text-text-primary flex items-start gap-1.5">
          <span className="text-base">📊</span>
          <span>{poll.question}</span>
        </h4>

        {/* Options */}
        <div className="space-y-2">
          {poll.options.map((opt: any, idx: number) => {
            const hasVoted = opt.votes.some((v: string) => v === session?.user?.id);
            const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;

            return (
              <button
                key={idx}
                onClick={() => handleVote(idx)}
                disabled={voting}
                className={cn(
                  'w-full text-left relative overflow-hidden rounded-xl border p-2.5 transition flex items-center justify-between gap-3 text-xs',
                  hasVoted
                    ? 'border-brand-green/50 bg-brand-green/10 text-brand-green'
                    : 'border-border-default/35 bg-bg-primary/10 hover:bg-bg-primary/20 text-text-primary'
                )}
              >
                {/* Progress fill layer */}
                <div
                  className={cn(
                    'absolute top-0 left-0 bottom-0 transition-all duration-500 -z-10',
                    hasVoted ? 'bg-brand-green/10' : 'bg-text-secondary/5'
                  )}
                  style={{ width: `${percentage}%` }}
                />

                <div className="flex items-center gap-2 min-w-0 z-10">
                  <span className={cn('text-[10px] w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition', hasVoted ? 'border-brand-green bg-brand-green text-white font-bold' : 'border-border-default text-transparent')}>✓</span>
                  <span className="truncate font-medium">{opt.text}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 z-10 font-mono text-[10px] text-text-secondary font-bold">
                  <span>{opt.votes.length}</span>
                  <span className="opacity-60">({percentage}%)</span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[9px] text-text-secondary font-mono mt-0.5 text-right">
          Total Votes: {totalVotes}
        </p>
      </div>
    );
  };

  const renderMeetingContent = () => {
    let inviteData: { roomId?: string; roomCode?: string; shareLink?: string; roomName?: string; initiator: string } | null = null;
    try {
      inviteData = JSON.parse(message.body || '{}');
    } catch {
      return <p className="text-xs text-red-400">Invalid Meeting Invite</p>;
    }

    if (!inviteData) return <p className="text-xs text-red-400">Invalid Meeting Invite</p>;

    const roomCode = inviteData.roomId || inviteData.roomCode;
    const { initiator, roomName } = inviteData;

    const handleJoin = () => {
      const targetRoomId = roomCode || message.conversationId;
      setActiveMeetingRoomId(targetRoomId);
    };

    return (
      <div className="flex flex-col gap-3 p-1.5 min-w-[240px] max-w-[280px]">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 bg-brand-green/20 rounded-full flex items-center justify-center text-lg shrink-0">📹</span>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-text-primary text-xs">Meeting & Study Room</span>
            <span className="text-[10px] text-text-secondary mt-0.5">Started by {initiator}</span>
          </div>
        </div>

        {/* Room Code Badge */}
        {roomCode && (
          <div className="flex items-center justify-between bg-bg-primary/30 border border-border-default/30 rounded-xl px-3 py-2">
            <div>
              <p className="text-[9px] text-text-secondary font-medium uppercase tracking-wider">Room Code</p>
              <p className="text-base font-black text-text-primary tracking-widest font-mono">{roomCode}</p>
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(roomCode)}
              className="p-1.5 hover:bg-bg-input rounded-lg text-text-secondary hover:text-text-primary transition cursor-pointer"
              title="Copy code"
            >
              📋
            </button>
          </div>
        )}

        {/* Join CTA */}
        <button
          onClick={handleJoin}
          className="w-full text-center py-2 bg-brand-green hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
        >
          🚀 Join Meeting
        </button>
      </div>
    );
  };

  const renderAttachments = () => {
    if (message.viewOnce) return null; // view once attachment is hidden/cleared when opened

    return (
      <div className="flex flex-col gap-1 mb-1">
        {message.attachments.map((file, idx) => {
          const mime: string = file.mimeType ?? '';
          const isImage = mime.startsWith('image/');
          const isVideo = mime.startsWith('video/');
          const isAudio = mime.startsWith('audio/');

          if (isImage) {
            return (
              <div key={idx} className="rounded-lg overflow-hidden border border-border-default/20 relative group cursor-pointer">
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="max-h-60 object-cover w-full hover:opacity-90 transition"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                  </div>
                </a>
              </div>
            );
          }

          if (isVideo) {
            return (
              <div key={idx} className="rounded-lg overflow-hidden border border-border-default/20 bg-black">
                <video src={file.url} controls className="max-h-60 w-full rounded-lg" preload="metadata" />
              </div>
            );
          }

          if (isAudio) {
            return (
              <div key={idx} className="rounded-lg bg-bg-primary/20 p-2 border border-border-default/20">
                <audio src={file.url} controls className="w-full h-8" />
                <p className="text-[10px] text-text-secondary mt-1 truncate">{file.filename}</p>
              </div>
            );
          }

          return (
            <div key={idx} className="rounded-lg overflow-hidden border border-border-default/20 bg-bg-primary/20">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 hover:bg-bg-primary/30 transition text-xs text-text-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
            className="w-5 h-5 text-brand-green shrink-0"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate font-medium">{file.filename}</span>
                  <span className="text-[10px] text-text-secondary mt-0.5">
                    {file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                    {' · '}
                    <span className="text-brand-green">Tap to download</span>
                  </span>
                </div>
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Reactions & Pinning Handlers ──────────────────────────────────────────
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = async (emoji: string) => {
    setShowPicker(false);
    setShowFullEmojiPicker(false);
    try {
      const res = await fetch(`/api/messages/${message._id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reaction', emoji }),
      });
      const data = await res.json();
      if (data.success) {
        updateMessage(message.conversationId, message._id, { reactions: data.data.reactions });
        getSocket()?.emit('message_reaction', {
          conversationId: message.conversationId,
          messageId: message._id,
          reactions: data.data.reactions,
        });
      }
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleTogglePin = async () => {
    try {
      const res = await fetch(`/api/messages/${message._id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pin' }),
      });
      const data = await res.json();
      if (data.success) {
        updateMessage(message.conversationId, message._id, {
          isPinned: data.data.isPinned,
          pinnedAt: data.data.pinnedAt,
        });
        getSocket()?.emit('message_pin', {
          conversationId: message.conversationId,
          messageId: message._id,
          isPinned: data.data.isPinned,
          pinnedAt: data.data.pinnedAt,
        });
      }
    } catch (err) {
      console.error('Failed to pin message:', err);
    }
  };

  const handleToggleStar = async () => {
    try {
      const res = await fetch(`/api/messages/${message._id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'star' }),
      });
      const data = await res.json();
      if (data.success) {
        updateMessage(message.conversationId, message._id, { starredBy: data.data.starredBy });
      }
    } catch (err) {
      console.error('Failed to star message:', err);
    }
  };

  const renderAudioContent = () => {
    const audioUrl = message.attachments?.[0]?.url || message.body;
    if (!audioUrl) return null;

    return (
      <div className="flex flex-col gap-2 py-1 select-none min-w-[200px]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎙️</span>
          <audio controls src={audioUrl} className="h-8 max-w-[220px] rounded-lg accent-brand-green" />
        </div>
        
        {/* Transcription UI */}
        <div className="mt-1">
          {!transcribedText && !isTranscribing && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleTranscribe} 
                className="text-xs text-brand-green hover:underline flex items-center gap-1 font-medium"
              >
                Aa Transcribe / Translate
              </button>
              <select 
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="text-xs bg-black/20 dark:bg-white/10 rounded px-1 py-0.5 outline-none border-none text-text-secondary cursor-pointer"
              >
                <option value="English">to English</option>
                <option value="Spanish">to Spanish</option>
                <option value="French">to French</option>
                <option value="German">to German</option>
                <option value="Hindi">to Hindi</option>
                <option value="Arabic">to Arabic</option>
                <option value="Chinese">to Chinese</option>
                <option value="Japanese">to Japanese</option>
                <option value="Original Language">Original</option>
              </select>
            </div>
          )}
          {isTranscribing && (
            <span className="text-xs text-text-secondary animate-pulse">Transcribing...</span>
          )}
          {transcriptionError && (
            <span className="text-xs text-red-500">{transcriptionError}</span>
          )}
          {transcribedText && (
            <div className="text-sm bg-black/10 dark:bg-white/10 p-2 rounded-lg mt-1 border-l-2 border-brand-green">
              <span className="text-xs text-text-secondary block mb-1 font-semibold">Transcription:</span>
              <p className="whitespace-pre-wrap text-text-primary">{transcribedText}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* View Once Fullscreen Modal overlay */}
      {showViewOnceModal && (message.attachments?.[0]?.url || message.body) && (
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col justify-between">
          <div className="p-4 flex items-center justify-between text-white bg-gradient-to-b from-black/70 to-transparent">
            <span className="text-sm font-semibold truncate">
              {message.attachments?.[0]?.filename || 'Secret Message'}
            </span>
            <button
              onClick={handleCloseViewOnce}
              className="px-4 py-2 bg-brand-green hover:bg-brand-hover text-white rounded-lg text-xs font-bold transition"
            >
              Close & Discard
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            {message.attachments?.[0]?.url ? (
              <img
                src={message.attachments[0].url}
                alt="view once"
                className="max-w-full max-h-[80vh] object-contain select-none"
                onContextMenu={(e) => e.preventDefault()}
              />
            ) : (
              <div className="max-w-2xl w-full text-center">
                <p className="text-2xl md:text-4xl text-white font-semibold leading-relaxed whitespace-pre-wrap select-none" style={{ WebkitUserSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
                  {message.body}
                </p>
              </div>
            )}
          </div>
          <div className="p-4 text-center text-[11px] text-text-secondary bg-gradient-to-t from-black/70 to-transparent select-none">
            This {message.attachments?.[0]?.url ? 'image' : 'message'} is View-Once. It will disappear permanently once closed.
          </div>
        </div>
      )}

      <div
        className={cn('flex w-full mb-2 group relative', isMe ? 'justify-end' : 'justify-start')}
        onMouseEnter={() => setShowPicker(true)}
        onMouseLeave={() => setShowPicker(false)}
      >
        {/* Full Emoji Picker Popover */}
        {showFullEmojiPicker && (
          <div
            className={cn(
              'absolute z-50 bottom-full mb-2 animate-in zoom-in-95 duration-150',
              isMe ? 'right-0 sm:right-2' : 'left-0 sm:left-2'
            )}
          >
            <EmojiPicker
              onSelectEmoji={(emoji) => handleReact(emoji)}
              onClose={() => setShowFullEmojiPicker(false)}
            />
          </div>
        )}

        {/* Hover Action Bar */}
        {showPicker && (
          <div
            className={cn(
              'absolute -top-8 z-30 border border-border-default/40 rounded-full px-2.5 py-1 flex items-center gap-1 shadow-xl animate-in fade-in duration-150 whitespace-nowrap',
              isMe ? 'right-0 sm:right-2' : 'left-0 sm:left-2'
            )}
            style={{ background: 'var(--bg-secondary)' }}
          >
            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="hover:scale-125 transition text-xs cursor-pointer p-0.5"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setShowFullEmojiPicker((v) => !v)}
              className="hover:scale-125 transition text-[11px] cursor-pointer p-0.5 font-bold text-text-secondary hover:text-brand-green"
              title="React with any emoji"
            >
              ➕
            </button>
            <div className="w-[1px] h-3 bg-border-default/40 mx-0.5" />
            <button
              onClick={handleTogglePin}
              className="text-[10px] text-text-secondary hover:text-amber-400 font-bold px-1 cursor-pointer"
              title={message.isPinned ? 'Unpin message' : 'Pin message'}
            >
              {message.isPinned ? '📌 Unpin' : '📌 Pin'}
            </button>
            <button
              onClick={() => onForward?.(message)}
              className="text-[10px] text-text-secondary hover:text-brand-green font-bold px-1 cursor-pointer"
              title="Forward message to another chat"
            >
              ↪️ Forward
            </button>
            <div className="w-[1px] h-3 mx-0.5" style={{ background: 'var(--border-default)' }} />
            {/* Delete button */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteMenu((v) => !v);
                }}
                className="text-[10px] font-bold px-1 hover:text-red-400 transition-colors cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
                title="Delete message"
              >
                🗑️
              </button>
              {showDeleteMenu && (
                <div
                  className="absolute z-50 rounded-xl shadow-2xl border overflow-hidden min-w-[165px]"
                  style={{
                    bottom: '100%',
                    [isMe ? 'right' : 'left']: 0,
                    marginBottom: '6px',
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-default)',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete('me');
                    }}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-left transition-colors font-semibold cursor-pointer"
                    style={{ color: 'var(--text-primary)', background: 'transparent' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-input)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>👤</span> Delete for Me
                  </button>
                  {isMe && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete('everyone');
                      }}
                      disabled={isDeleting}
                      className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-left transition-colors font-semibold border-t border-border-default/40 cursor-pointer"
                      style={{ color: '#ef4444', background: 'transparent' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-input)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span>🌐</span> Delete for Everyone
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div
          className={cn(
            'max-w-[70%] rounded-2xl px-3 py-1.5 shadow-sm relative text-sm select-text flex flex-col',
            isMe
              ? 'bg-bubble-sent text-text-primary rounded-tr-none'
              : 'bg-bubble-rcvd text-text-primary rounded-tl-none',
            message.isPinned && 'border-l-4 border-amber-400'
          )}
        >
          {message.isPinned && (
            <div className="flex items-center gap-1 text-[9px] text-amber-400 font-bold mb-0.5">
              <span>📌 Pinned Message</span>
            </div>
          )}

          {showSenderName && !isMe && (
            <span className="text-[11px] font-semibold text-brand-green/90 mb-0.5 truncate">
              {message.senderId.name}
            </span>
          )}

          {/* Dynamic Content Switching */}
          {message.isDeleted ? (
            <span className="italic text-xs opacity-50 flex items-center gap-1 py-0.5">
              🚫 This message was deleted
            </span>
          ) : message.viewOnce ? (
            renderViewOnceContent()
          ) : message.type === 'location' ? (
            renderLocationContent()
          ) : message.type === 'poll' ? (
            renderPollContent()
          ) : message.type === 'meeting' ? (
            renderMeetingContent()
          ) : message.type === 'audio' ? (
            renderAudioContent()
          ) : (
            renderAttachments()
          )}

          {/* Message Text Body & Timestamp Container */}
          <div className="flex flex-wrap items-end justify-between gap-x-2.5 gap-y-1 min-w-[75px] w-full">
            {message.body &&
              !message.viewOnce &&
              message.type !== 'location' &&
              message.type !== 'poll' &&
              message.type !== 'meeting' && (
                <p className="whitespace-pre-wrap break-words leading-relaxed text-[13.5px] flex-1 min-w-0">
                  {message.body}
                </p>
              )}

            {/* Timestamp Meta & Seen status ticks */}
            <div className="inline-flex items-center gap-1 select-none shrink-0 ml-auto self-end pt-0.5">
              <span className="text-[10px] text-[#8696a0] font-mono">{time}</span>
              {isMe &&
                (() => {
                  const senderId = message.senderId._id;
                  const isSeen = message.seenBy?.some((r) => r.userId !== senderId);
                  const isDelivered = message.deliveredTo?.some((r) => r.userId !== senderId);

                  if (isSeen) {
                    return (
                      <span className="text-[#53bdeb]" title="Seen">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 15"
                          width="16"
                          height="15"
                          fill="currentColor"
                          className="w-3.5 h-3.5"
                        >
                          <path d="M15.01 3.47a.75.75 0 0 0-1.02-.12l-7.39 5.56-3.1-2.48a.75.75 0 0 0-.96 1.15l3.6 2.88a.75.75 0 0 0 1-.06l7.75-6.83a.75.75 0 0 0 .12-1.1z" />
                          <path d="M11.01 3.47a.75.75 0 0 0-1.02-.12L6 6.32l-.46-.37a.75.75 0 1 0-.96 1.15l1 1a.75.75 0 0 0 1-.06l4.31-4.47a.75.75 0 0 0 .12-1.1z" />
                        </svg>
                      </span>
                    );
                  }

                  if (isDelivered) {
                    return (
                      <span className="text-[#8696a0]" title="Delivered">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 15"
                          width="16"
                          height="15"
                          fill="currentColor"
                          className="w-3.5 h-3.5"
                        >
                          <path d="M15.01 3.47a.75.75 0 0 0-1.02-.12l-7.39 5.56-3.1-2.48a.75.75 0 0 0-.96 1.15l3.6 2.88a.75.75 0 0 0 1-.06l7.75-6.83a.75.75 0 0 0 .12-1.1z" />
                          <path d="M11.01 3.47a.75.75 0 0 0-1.02-.12L6 6.32l-.46-.37a.75.75 0 1 0-.96 1.15l1 1a.75.75 0 0 0 1-.06l4.31-4.47a.75.75 0 0 0 .12-1.1z" />
                        </svg>
                      </span>
                    );
                  }

                  return (
                    <span className="text-[#8696a0]" title="Sent">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 15"
                        width="16"
                        height="15"
                        fill="currentColor"
                        className="w-3.5 h-3.5"
                      >
                        <path d="M15.01 3.47a.75.75 0 0 0-1.02-.12l-7.39 5.56-3.1-2.48a.75.75 0 0 0-.96 1.15l3.6 2.88a.75.75 0 0 0 1-.06l7.75-6.83a.75.75 0 0 0 .12-1.1z" />
                      </svg>
                    </span>
                  );
                })()}
            </div>
          </div>

          {/* Reactions Display Badges */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-border-default/10">
              {Object.entries(
                message.reactions.reduce((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([emoji, count]) => (
                <span
                  key={emoji}
                  className="bg-bg-input/60 px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-0.5 border border-border-default/20 font-bold"
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default React.memo(ChatBubble);
