'use client';

import React, { useState, useEffect } from 'react';
import { useChatStore, IMessageDetails, IConversationPreview } from '@/store/useChatStore';
import { useSession } from 'next-auth/react';
import Avatar from '@/components/ui/Avatar';
import { getSocket } from '@/hooks/useSocket';

interface ForwardMessageModalProps {
  message: IMessageDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ForwardMessageModal({ message, isOpen, onClose }: ForwardMessageModalProps) {
  const { data: session } = useSession();
  const conversations = useChatStore((state) => state.conversations);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateConversationLastMessage = useChatStore((state) => state.updateConversationLastMessage);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      setSearch('');
      setSuccessToast(null);
    }
  }, [isOpen]);

  if (!isOpen || !message) return null;

  const currentUserId = session?.user?.id;

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    let name = conv.name || '';
    if (conv.type === 'direct') {
      const otherMember = conv.members.find((m) => m._id !== currentUserId);
      name = otherMember?.name || 'User';
    }
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleForward = async () => {
    if (selectedIds.length === 0 || !message) return;
    setSending(true);

    try {
      const socket = getSocket();

      for (const targetConvId of selectedIds) {
        const bodyText = message.body ? `↪ Forwarded:\n${message.body}` : '↪ Forwarded Attachment';
        const payload = {
          body: bodyText,
          type: message.type || 'text',
          attachments: message.attachments || [],
        };

        const res = await fetch(`/api/conversations/${targetConvId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success && data.data) {
          const newMsg = data.data;
          addMessage(targetConvId, newMsg);
          updateConversationLastMessage(targetConvId, {
            _id: newMsg._id,
            body: newMsg.body,
            senderId: { _id: currentUserId || '', name: session?.user?.name || 'You' },
            type: newMsg.type,
            createdAt: newMsg.createdAt,
          });

          // Emit real-time socket event
          if (socket) {
            socket.emit('send_message', {
              conversationId: targetConvId,
              message: newMsg,
            });
          }
        }
      }

      setSuccessToast(`Forwarded to ${selectedIds.length} chat${selectedIds.length > 1 ? 's' : ''}`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to forward message:', err);
      alert('Failed to forward message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-bg-secondary border border-border-default/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] transition-colors">
        
        {/* Header */}
        <div className="p-4 border-b border-border-default/40 flex items-center justify-between bg-bg-secondary">
          <div className="flex items-center gap-2">
            <span className="text-lg">↪️</span>
            <h3 className="text-sm font-extrabold text-text-primary">Forward Message</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-bg-input hover:bg-border-default/30 flex items-center justify-center text-text-secondary hover:text-text-primary text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Message Preview Box */}
        <div className="p-3 bg-bg-input/50 border-b border-border-default/30 mx-4 mt-3 rounded-xl">
          <p className="text-[10px] font-bold text-brand-green uppercase tracking-wider mb-1">Preview Message to Forward</p>
          <p className="text-xs text-text-primary line-clamp-2 italic">
            {message.body || (message.attachments?.[0] ? `[File] ${message.attachments[0].filename}` : 'Media Content')}
          </p>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-border-default/30">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats or contacts..."
              className="w-full pl-9 pr-4 py-2 bg-bg-input border border-border-default/40 rounded-xl text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:border-brand-green font-medium"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[220px]">
          {filteredConversations.length === 0 ? (
            <div className="py-8 text-center text-text-secondary text-xs font-medium">
              No matching chats found
            </div>
          ) : (
            filteredConversations.map((conv: IConversationPreview) => {
              const isGroup = conv.type === 'group';
              const otherMember = conv.members.find((m) => m._id !== currentUserId);
              const name = isGroup ? conv.name || 'Group Chat' : otherMember?.name || 'User';
              const image = isGroup ? conv.image : otherMember?.image;
              const isSelected = selectedIds.includes(conv._id);

              return (
                <div
                  key={conv._id}
                  onClick={() => toggleSelect(conv._id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-brand-green/20 border border-brand-green/40'
                      : 'hover:bg-bg-input/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={name} src={image} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{name}</p>
                      <p className="text-[10px] text-text-secondary truncate mt-0.5">
                        {isGroup ? `Group · ${conv.members.length} members` : 'Direct Chat'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold transition shrink-0 ${
                      isSelected
                        ? 'bg-brand-green border-brand-green text-white shadow-sm'
                        : 'border-border-default/60 text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border-default/40 bg-bg-secondary flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-text-secondary">
            {selectedIds.length} {selectedIds.length === 1 ? 'chat' : 'chats'} selected
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 bg-bg-input hover:bg-border-default/30 text-text-primary text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleForward}
              disabled={selectedIds.length === 0 || sending}
              className="px-5 py-2 bg-brand-green hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-md flex items-center gap-1.5"
            >
              {sending ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <span>↪️</span> Forward
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-brand-green text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl animate-in zoom-in-95 duration-150 flex items-center gap-1.5">
            <span>✓</span> {successToast}
          </div>
        )}

      </div>
    </div>
  );
}
