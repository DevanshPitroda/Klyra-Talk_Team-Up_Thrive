'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Study & Code Assistant 🤖. How can I help you today? You can ask me to explain concepts, help with code, or summarize topics!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const promptText = textToSend || input;
    if (!promptText.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: promptText };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (data.success && data.text) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, I encountered an issue. Please try again!' },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please check your connection.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    '💡 Explain a concept',
    '📝 Summarize my topic',
    '❓ Generate a practice quiz',
    '💻 Code debugging help',
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-xl h-[600px] max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-base font-bold"
              style={{ background: 'var(--accent-green)' }}
            >
              🤖
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                AI Study Assistant
              </h2>
              <span className="text-[10px] font-medium" style={{ color: 'var(--accent-green)' }}>
                ● Online & Ready
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-base transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-input)' }}
          >
            ✕
          </button>
        </div>

        {/* Chat History Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex gap-2.5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {!isUser && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 text-white"
                    style={{ background: 'var(--accent-green)' }}
                  >
                    🤖
                  </div>
                )}
                <div
                  className="px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap select-text"
                  style={{
                    backgroundColor: isUser ? 'var(--accent-green)' : 'var(--bg-input)',
                    color: isUser ? '#ffffff' : 'var(--text-primary)',
                    borderTopRightRadius: isUser ? '4px' : '16px',
                    borderTopLeftRadius: !isUser ? '4px' : '16px',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 items-center">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                style={{ background: 'var(--accent-green)' }}
              >
                🤖
              </div>
              <div
                className="px-3.5 py-2 rounded-2xl text-xs flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent-green)' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.2s]" style={{ background: 'var(--accent-green)' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.4s]" style={{ background: 'var(--accent-green)' }} />
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div
          className="px-4 py-2 border-t flex items-center gap-1.5 overflow-x-auto shrink-0"
          style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-primary)' }}
        >
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt.slice(2))}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all hover:opacity-90 cursor-pointer border"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          className="p-3 border-t shrink-0 flex items-center gap-2"
          style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI Assistant anything..."
            className="flex-1 px-3.5 py-2 rounded-xl text-xs outline-none border"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity disabled:opacity-40 cursor-pointer"
            style={{ backgroundColor: 'var(--accent-green)' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
