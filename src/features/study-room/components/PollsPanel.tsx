'use client';

import React, { useState, useEffect } from 'react';
import { useStudyRoomStore } from '../store/useStudyRoomStore';
import { getSocket } from '@/hooks/useSocket';
import { useChatStore } from '@/store/useChatStore';
import { useSession } from 'next-auth/react';

interface PollOption {
  id: number;
  text: string;
  votes: number;
  voters: string[];
}

interface Poll {
  _id: string;
  roomId: string;
  question: string;
  options: PollOption[];
  isAnonymous: boolean;
  totalVotes: number;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  userVotedOption?: number; // client-side only
}

export default function PollsPanel() {
  const { data: session } = useSession();
  const currentUserRole = useStudyRoomStore((state) => state.currentUserRole);
  const activeMeetingRoomId = useChatStore((state) => state.activeMeetingRoomId);
  const isHost = currentUserRole === 'host' || currentUserRole === 'co-host';

  const [polls, setPolls] = useState<Poll[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load existing polls on mount
  useEffect(() => {
    if (!activeMeetingRoomId) return;
    fetch(`/api/study-rooms/${activeMeetingRoomId}/polls`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPolls(d.data);
      })
      .catch(console.error);
  }, [activeMeetingRoomId]);

  // Real-time socket sync
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onPollCreated = (poll: Poll) => {
      setPolls((prev) => [poll, ...prev.filter((p) => p._id !== poll._id)]);
    };

    const onPollUpdated = (poll: Poll) => {
      setPolls((prev) =>
        prev.map((p) =>
          p._id === poll._id ? { ...poll, userVotedOption: p.userVotedOption } : p
        )
      );
    };

    socket.on('poll:created', onPollCreated);
    socket.on('poll:updated', onPollUpdated);
    return () => {
      socket.off('poll:created', onPollCreated);
      socket.off('poll:updated', onPollUpdated);
    };
  }, []);

  const handleAddOption = () => {
    if (options.length < 5) setOptions([...options, '']);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !activeMeetingRoomId) return;
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/study-rooms/${activeMeetingRoomId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), options: validOptions, isAnonymous }),
      });
      const data = await res.json();
      if (data.success) {
        setPolls((prev) => [data.data, ...prev]);
        // Broadcast to room via socket
        getSocket()?.emit('poll:create', { conversationId: activeMeetingRoomId, poll: data.data });
        setIsCreating(false);
        setQuestion('');
        setOptions(['', '']);
      }
    } catch (err) {
      console.error('Failed to create poll:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (poll: Poll, optionId: number) => {
    if (poll.userVotedOption !== undefined || !activeMeetingRoomId) return;

    try {
      const res = await fetch(
        `/api/study-rooms/${activeMeetingRoomId}/polls/${poll._id}/vote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optionId }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setPolls((prev) =>
          prev.map((p) =>
            p._id === poll._id ? { ...data.data, userVotedOption: optionId } : p
          )
        );
        // Broadcast live vote update
        getSocket()?.emit('poll:vote', { conversationId: activeMeetingRoomId, poll: data.data });
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  return (
    <div className="w-80 bg-bg-secondary border-l border-border-default/40 flex flex-col h-full shrink-0 select-none text-text-primary transition-colors">

      {/* Header */}
      <div className="p-3.5 border-b border-border-default/30 flex items-center justify-between">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
          <span>📊 Live Polls</span>
          {polls.length > 0 && (
            <span className="bg-bg-input px-1.5 py-0.5 rounded text-[10px] text-brand-green font-bold">
              {polls.length}
            </span>
          )}
        </h3>
        {isHost && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-2.5 py-1 bg-brand-green hover:bg-brand-hover text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
          >
            + Create Poll
          </button>
        )}
      </div>

      {/* Create Poll Form */}
      {isCreating && (
        <form onSubmit={handleCreatePoll} className="p-4 space-y-3 border-b border-border-default/30 bg-bg-primary/30">
          <div>
            <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your question..."
              required
              autoFocus
              className="w-full px-3 py-2 bg-bg-input border border-border-default/40 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-green"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-text-secondary uppercase">Options</label>
            {options.map((opt, i) => (
              <input
                key={i}
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[i] = e.target.value;
                  setOptions(newOpts);
                }}
                placeholder={`Option ${i + 1}`}
                className="w-full px-3 py-2 bg-bg-input border border-border-default/40 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-green"
              />
            ))}
            {options.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="text-[10px] text-brand-green hover:underline cursor-pointer font-bold"
              >
                + Add option
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            <span className="text-[10px] text-text-secondary font-semibold">Anonymous votes</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="flex-1 py-2 bg-bg-input text-text-secondary text-[10px] font-bold rounded-lg cursor-pointer hover:bg-border-default/40 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-brand-green text-white text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-60 transition"
            >
              {loading ? 'Creating...' : '🚀 Launch Poll'}
            </button>
          </div>
        </form>
      )}

      {/* Polls List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {polls.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-text-secondary">
            <span className="text-2xl">📊</span>
            <p className="text-xs font-semibold">No polls yet</p>
            {isHost && (
              <p className="text-[10px] text-text-secondary">Create a poll to engage participants</p>
            )}
          </div>
        ) : (
          polls.map((poll) => {
            const hasVoted = poll.userVotedOption !== undefined;
            return (
              <div
                key={poll._id}
                className="bg-bg-primary rounded-xl p-3 border border-border-default/20 space-y-3"
              >
                <p className="text-xs font-bold text-text-primary leading-tight">{poll.question}</p>

                <div className="space-y-2">
                  {poll.options.map((opt) => {
                    const pct =
                      poll.totalVotes > 0
                        ? Math.round((opt.votes / poll.totalVotes) * 100)
                        : 0;
                    const isChosen = poll.userVotedOption === opt.id;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleVote(poll, opt.id)}
                        disabled={hasVoted}
                        className={`w-full text-left rounded-xl overflow-hidden border transition cursor-pointer disabled:cursor-default ${
                          isChosen
                            ? 'border-brand-green bg-brand-green/10'
                            : 'border-border-default/30 bg-bg-input hover:border-brand-green/40'
                        }`}
                      >
                        <div className="relative px-3 py-2">
                          {hasVoted && (
                            <div
                              className="absolute inset-0 bg-brand-green/10 rounded-xl transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          )}
                          <div className="relative flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-text-primary">{opt.text}</span>
                            {hasVoted && (
                              <span className="text-[10px] font-bold text-brand-green">{pct}%</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[10px] text-text-secondary">
                  {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
                  {poll.isAnonymous ? ' · Anonymous' : ''}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
