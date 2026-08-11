import React, { useState } from 'react';
import { useChatStore } from '../../store/useChatStore';

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentTimer: 'off' | '24h' | 'view_once';
  onTimerChange: (newTimer: 'off' | '24h' | 'view_once') => void;
}

export default function ChatSettingsModal({ 
  isOpen, 
  onClose, 
  conversationId, 
  currentTimer,
  onTimerChange
}: ChatSettingsModalProps) {
  const [timer, setTimer] = useState(currentTimer || 'off');
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (timer === currentTimer) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disappearingTimer: timer }),
      });
      const data = await res.json();
      
      if (data.success) {
        onTimerChange(timer);
        onClose();
      } else {
        alert(data.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear all messages in this chat history?')) return;
    setIsClearing(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        useChatStore.getState().setMessages(conversationId, []);
        onClose();
      } else {
        alert(data.error?.message || 'Failed to clear chat');
      }
    } catch (err) {
      alert('Network error while clearing chat');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-bg-secondary w-full max-w-sm rounded-2xl shadow-xl border border-border-default overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-border-default flex justify-between items-center">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            ⚙️ Chat Settings
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl">&times;</button>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              🕛 Disappearing Messages
            </h3>
            <p className="text-xs text-text-secondary mb-3">
              Make new messages in this chat disappear after the selected time.
            </p>
            
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border-default bg-bg-primary hover:bg-bg-hover cursor-pointer transition-colors">
                <input 
                  type="radio" 
                  name="disappearingTimer" 
                  value="off"
                  checked={timer === 'off'}
                  onChange={() => setTimer('off')}
                  className="accent-brand-green w-4 h-4"
                />
                <span className="text-sm text-text-primary font-medium">Off (Never)</span>
              </label>
              
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border-default bg-bg-primary hover:bg-bg-hover cursor-pointer transition-colors">
                <input 
                  type="radio" 
                  name="disappearingTimer" 
                  value="24h"
                  checked={timer === '24h'}
                  onChange={() => setTimer('24h')}
                  className="accent-brand-green w-4 h-4"
                />
                <span className="text-sm text-text-primary font-medium">24 Hours</span>
              </label>
              
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border-default bg-bg-primary hover:bg-bg-hover cursor-pointer transition-colors">
                <input 
                  type="radio" 
                  name="disappearingTimer" 
                  value="view_once"
                  checked={timer === 'view_once'}
                  onChange={() => setTimer('view_once')}
                  className="accent-brand-green w-4 h-4"
                />
                <div>
                  <span className="text-sm text-text-primary font-medium block">After Viewing (View Once)</span>
                  <span className="text-xs text-text-secondary block">Messages will be hidden immediately after they are read.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Clear Chat Button Section */}
          <div className="pt-3 border-t border-border-default">
            <button
              onClick={handleClearChat}
              disabled={isClearing}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs border border-red-500/20 transition-colors cursor-pointer"
            >
              <span>🗑️</span>
              <span>{isClearing ? 'Clearing...' : 'Clear Chat History'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-bg-primary border-t border-border-default flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors font-medium text-sm">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-brand-green hover:bg-brand-hover text-white transition-colors font-semibold text-sm disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
