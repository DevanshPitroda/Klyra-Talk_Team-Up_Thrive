'use client';

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Avatar from '../ui/Avatar';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { data: session, update } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // 1. Upload to Cloudinary (using our existing media upload logic if any, or a generic one)
      // We will read as DataURL and send to a general upload endpoint if it exists, or handle it via Cloudinary directly.
      // Assuming we have /api/upload endpoint for uploading media to cloudinary
      const formData = new FormData();
      formData.append('file', file);
      
      // Let's use our existing /api/upload endpoint
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Failed to upload image');
      }

      const imageUrl = uploadData.url;

      // 2. Update user profile in DB
      const updateRes = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl }),
      });
      const updateData = await updateRes.json();

      if (!updateData.success) {
        throw new Error(updateData.error || 'Failed to update profile');
      }

      // 3. Update next-auth session
      await update({ image: imageUrl });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-bg-secondary w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-border-default animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-border-default flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Profile</h2>
          <button 
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => !isUploading && fileInputRef.current?.click()}>
            <Avatar 
              src={session?.user?.image || undefined} 
              name={session?.user?.name || 'User'} 
              size="xl" 
            />
            <div className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-white text-2xl">📷</span>
              )}
            </div>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          <div className="text-center">
            <h3 className="text-xl font-semibold text-text-primary">{session?.user?.name}</h3>
            <p className="text-sm text-text-secondary">{session?.user?.email}</p>
          </div>

          {error && (
            <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded w-full text-center">
              {error}
            </div>
          )}

          <p className="text-xs text-text-secondary text-center mt-2">
            Click your profile picture to upload a new one.
          </p>
        </div>
      </div>
    </div>
  );
}
