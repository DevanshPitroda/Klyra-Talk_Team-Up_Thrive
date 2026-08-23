/**
 * Safely resolves senderId whether it is a populated object or a raw string.
 */
export function getSenderId(senderId: string | { _id: string; name?: string; image?: string }): string {
  if (!senderId) return '';
  if (typeof senderId === 'string') return senderId;
  return senderId._id || '';
}

export function getSenderName(senderId: string | { _id: string; name?: string; image?: string }): string {
  if (!senderId) return 'User';
  if (typeof senderId === 'string') return 'User';
  return senderId.name || 'User';
}

export function getSenderImage(senderId: string | { _id: string; name?: string; image?: string }): string | undefined {
  if (!senderId || typeof senderId === 'string') return undefined;
  return senderId.image;
}
