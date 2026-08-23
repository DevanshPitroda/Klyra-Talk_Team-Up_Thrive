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
  const [timer, setTimer] = useState<'off' | '24h' | 'view_once'>(currentTimer || 'off');
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disappearingTimer: timer }),
      });
      const data = await res.json();
      
      if (data.success) {
        const store = useChatStore.getState();
        store.setConversations(
          store.conversations.map((c) => (c._id === conversationId ? { ...c, disappearingTimer: timer } : c))
        );
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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm select-none" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-bg-secondary w-full max-w-sm rounded-2xl shadow-2xl border border-border-default/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border-default/40 flex justify-between items-center bg-bg-primary/40">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            ⚙️ Chat Settings
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-bg-input text-text-secondary hover:text-text-primary rounded-lg text-lg transition cursor-pointer">&times;</button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-text-primary mb-1 flex items-center gap-1.5">
              🕛 Disappearing Messages
            </h3>
            <p className="text-[11px] text-text-secondary mb-3 leading-relaxed">
              New messages in this chat will disappear after the selected duration.
            </p>
            
            <div className="flex flex-col gap-2">
              {/* Option 1: Off */}
              <button
                type="button"
                onClick={() => setTimer('off')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  timer === 'off'
                    ? 'border-brand-green bg-brand-green/10 text-brand-green font-bold'
                    : 'border-border-default/40 bg-bg-primary hover:bg-bg-input text-text-primary'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${timer === 'off' ? 'border-brand-green bg-brand-green' : 'border-border-default'}`}>
                  {timer === 'off' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-xs font-semibold">Off (Keep messages permanently)</span>
              </button>

              {/* Option 2: 24 Hours */}
              <button
                type="button"
                onClick={() => setTimer('24h')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  timer === '24h'
                    ? 'border-brand-green bg-brand-green/10 text-brand-green font-bold'
                    : 'border-border-default/40 bg-bg-primary hover:bg-bg-input text-text-primary'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${timer === '24h' ? 'border-brand-green bg-brand-green' : 'border-border-default'}`}>
                  {timer === '24h' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <span className="text-xs font-semibold block">24 Hours</span>
                  <span className="text-[10px] text-text-secondary block font-normal">Messages self-destruct 24h after sending.</span>
                </div>
              </button>

              {/* Option 3: View Once */}
              <button
                type="button"
                onClick={() => setTimer('view_once')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  timer === 'view_once'
                    ? 'border-brand-green bg-brand-green/10 text-brand-green font-bold'
                    : 'border-border-default/40 bg-bg-primary hover:bg-bg-input text-text-primary'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${timer === 'view_once' ? 'border-brand-green bg-brand-green' : 'border-border-default'}`}>
                  {timer === 'view_once' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <span className="text-xs font-semibold block">After Viewing (View Once)</span>
                  <span className="text-[10px] text-text-secondary block font-normal">Messages disappear immediately after reading.</span>
                </div>
              </button>
            </div>
          </div>

          {/* Clear Chat Button Section */}
          <div className="pt-3 border-t border-border-default/40">
            <button
              type="button"
              onClick={handleClearChat}
              disabled={isClearing}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>🗑️</span>
              <span>{isClearing ? 'Clearing...' : 'Clear Chat History'}</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-bg-primary/40 border-t border-border-default/40 flex justify-end gap-2">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-3.5 py-1.5 rounded-xl text-text-secondary hover:bg-bg-input transition-colors font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-4 py-1.5 rounded-xl bg-brand-green hover:bg-brand-hover text-white transition-all font-bold text-xs cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
