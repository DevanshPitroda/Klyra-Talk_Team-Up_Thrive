'use client';

import React from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
  className?: string;
}

export default function Avatar({
  src,
  name,
  size = 'md',
  showOnlineIndicator = false,
  isOnline = false,
  className,
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const statusSizeClasses = {
    sm: 'w-2.5 h-2.5 border-1.5',
    md: 'w-3 h-3 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4.5 h-4.5 border-2.5',
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return fullName.charAt(0).toUpperCase();
  };

  return (
    <div className={cn('relative shrink-0 select-none', className)}>
      {/* Avatar Container */}
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center font-bold bg-bg-input text-text-primary border border-border-default',
          sizeClasses[size]
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image on error to fallback to initials
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {/* Online indicator badge dot */}
      {showOnlineIndicator && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full bg-online-dot border-bg-secondary',
            statusSizeClasses[size],
            isOnline ? 'bg-online-dot animate-pulse' : 'bg-text-muted'
          )}
        />
      )}
    </div>
  );
}
export type { AvatarProps };
