'use client';

import React, { useState, useEffect, useRef } from 'react';
import Avatar from '../ui/Avatar';
import { useChatStore } from '../../store/useChatStore';

interface ContactSearchProps {
  onClose: () => void;
}

interface IUserSearchItem {
  _id: string;
  name: string;
  email: string;
  image?: string;
  about: string;
  isOnline: boolean;
}

export default function ContactSearch({ onClose }: ContactSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IUserSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const setConversations = useChatStore((state) => state.setConversations);
  const conversations = useChatStore((state) => state.conversations);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.data);
        }
      } catch (err) {
        console.error('Failed to search contacts:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleStartChat = async (userId: string) => {
    try {
      // 1. Check if direct chat already exists in store
      const existing = conversations.find(
        (c) => c.type === 'direct' && c.members.some((m) => m._id === userId)
      );

      if (existing) {
        setActiveConversationId(existing._id);
        onClose();
        return;
      }

      // 2. Otherwise create on backend
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'direct',
          participants: [userId],
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Append newly created conversation to front of store
        setConversations([data.data, ...conversations]);
        setActiveConversationId(data.data._id);
        onClose();
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  return (
    <div className="absolute inset-0 bg-bg-primary z-30 flex flex-col animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="h-16 bg-bg-secondary border-b border-border-default flex items-center px-4 shrink-0 gap-4">
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-bg-input rounded-full text-text-secondary hover:text-text-primary transition cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
        </button>
        <span className="text-sm font-semibold text-text-primary">New Chat</span>
      </div>

      {/* Search Input Box */}
      <div className="p-3 bg-bg-primary shrink-0 border-b border-border-default/40">
        <div className="bg-bg-input flex items-center gap-3 px-3 py-1.5 rounded-xl border border-transparent focus-within:border-brand-green/30 transition">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4 text-text-muted"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-xs text-text-primary placeholder-text-muted"
          />
        </div>
      </div>

      {/* Results View */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-green border-t-transparent" />
          </div>
        ) : query.trim() !== '' && results.length === 0 ? (
          <p className="text-center text-xs text-text-secondary py-8">No contacts found</p>
        ) : query.trim() === '' ? (
          <div className="p-4 text-center text-xs text-text-muted">
            Type email address or name to locate users.
          </div>
        ) : (
          results.map((user) => (
            <div
              key={user._id}
              onClick={() => handleStartChat(user._id)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-bg-input cursor-pointer border-b border-border-default/40 select-none transition-all duration-200"
            >
              <Avatar src={user.image} name={user.name} size="lg" />
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="text-sm font-semibold text-text-primary truncate">
                  {user.name}
                </h4>
                <p className="text-xs text-text-secondary truncate mt-0.5">
                  {user.about}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
