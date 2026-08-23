'use client';

import React, { useState, useEffect } from 'react';
import Avatar from '../ui/Avatar';
import { useChatStore } from '../../store/useChatStore';

interface Contact {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const conversations = useChatStore((state) => state.conversations);
  const setConversations = useChatStore((state) => state.setConversations);
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);

  const [step, setStep] = useState<1 | 2>(1);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Step 2 Form
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupImage, setGroupImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available users/contacts on mount
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSelectedMembers([]);
    setGroupName('');
    setGroupDescription('');
    setError('');

    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setContacts(data.data || []);
        }
      })
      .catch(console.error);
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelectMember = (contact: Contact) => {
    const exists = selectedMembers.some((m) => m._id === contact._id);
    if (exists) {
      setSelectedMembers(selectedMembers.filter((m) => m._id !== contact._id));
    } else {
      setSelectedMembers([...selectedMembers, contact]);
    }
  };

  const handleNextStep = () => {
    if (selectedMembers.length === 0) {
      setError('Please select at least 1 member for the group.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'group',
          name: groupName.trim(),
          image: groupImage.trim() || undefined,
          description: groupDescription.trim() || undefined,
          participants: selectedMembers.map((m) => m._id),
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        // Update store with new group
        setConversations([data.data, ...conversations]);
        setActiveConversationId(data.data._id);
        onClose();
      } else {
        setError(data.error?.message || 'Failed to create group');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#182229] border border-border-default/40 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-text-primary flex flex-col max-h-[85vh]">

        {/* Modal Header */}
        <div className="px-5 py-4 bg-bg-secondary border-b border-border-default/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">👥</span>
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                {step === 1 ? 'Add Group Participants' : 'New Group Details'}
              </h3>
              <p className="text-[10px] text-text-secondary">
                {step === 1 ? `Step 1 of 2 · ${selectedMembers.length} selected` : 'Step 2 of 2 · Finalize Group'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-sm p-1.5 hover:bg-bg-input rounded-xl transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* STEP 1: Select Participants */}
        {step === 1 && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Selected Members Chips */}
            {selectedMembers.length > 0 && (
              <div className="p-3 border-b border-border-default/20 bg-bg-primary/40 flex items-center gap-2 overflow-x-auto shrink-0">
                {selectedMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center gap-1.5 bg-brand-green/20 border border-brand-green/40 px-2.5 py-1 rounded-full text-xs font-semibold text-brand-green shrink-0 animate-in zoom-in-50 duration-150"
                  >
                    <span>{member.name}</span>
                    <button
                      onClick={() => toggleSelectMember(member)}
                      className="hover:text-red-400 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="p-3 border-b border-border-default/20">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts by name or email..."
                className="w-full px-3 py-2 bg-bg-input border border-border-default/40 rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-green"
              />
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredContacts.length === 0 ? (
                <p className="text-xs text-text-secondary text-center py-8">No contacts found.</p>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedMembers.some((m) => m._id === contact._id);
                  return (
                    <div
                      key={contact._id}
                      onClick={() => toggleSelectMember(contact)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                        isSelected
                          ? 'bg-brand-green/15 border border-brand-green/40'
                          : 'hover:bg-bg-input/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={contact.image} name={contact.name} size="md" />
                        <div>
                          <p className="text-xs font-bold text-text-primary">{contact.name}</p>
                          <p className="text-[10px] text-text-secondary">{contact.email}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 accent-brand-green rounded cursor-pointer"
                      />
                    </div>
                  );
                })
              )}
            </div>

            {error && <p className="text-xs text-red-400 font-medium px-4 py-1">{error}</p>}

            {/* Footer Next Button */}
            <div className="p-4 border-t border-border-default/30 flex justify-end">
              <button
                onClick={handleNextStep}
                disabled={selectedMembers.length === 0}
                className="px-5 py-2.5 bg-brand-green hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition shadow cursor-pointer disabled:opacity-40 flex items-center gap-2"
              >
                <span>Next</span>
                <span>➜</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Group Name & Description */}
        {step === 2 && (
          <form onSubmit={handleCreateGroup} className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Group Avatar Preview */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-brand-green/20 border-2 border-brand-green flex items-center justify-center text-3xl font-black text-brand-green shadow-lg">
                  {groupName.trim() ? groupName.charAt(0).toUpperCase() : '👥'}
                </div>
                <span className="text-[10px] text-text-secondary">Group Avatar</span>
              </div>

              {/* Group Name Input */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                  Group Subject / Name *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Type group subject..."
                  maxLength={50}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-bg-input border border-border-default/40 rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-brand-green"
                />
                <p className="text-[9px] text-text-secondary text-right mt-1">{groupName.length}/50</p>
              </div>

              {/* Group Description Input */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                  Group Description (Optional)
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Add group description or rules..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-bg-input border border-border-default/40 rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-green resize-none"
                />
              </div>

              {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border-default/30">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 bg-bg-input hover:bg-border-default/40 text-text-secondary text-xs font-bold rounded-xl"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !groupName.trim()}
                className="flex-1 py-2.5 bg-brand-green hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition shadow cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating Group...' : '✓ Create Group'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
