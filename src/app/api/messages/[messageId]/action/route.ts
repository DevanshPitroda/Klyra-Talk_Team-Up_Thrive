import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Message from '@/models/Message';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { action, emoji } = await req.json();
    await connectDB();

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    const userId = session.user.id;
    const userName = session.user.name || 'User';

    if (action === 'reaction') {
      if (!emoji) {
        return NextResponse.json({ success: false, error: 'Emoji required' }, { status: 400 });
      }

      // Check if user already reacted with this emoji (toggle off) or another emoji (replace)
      const existingIdx = message.reactions.findIndex((r) => r.userId.toString() === userId);

      if (existingIdx > -1) {
        if (message.reactions[existingIdx].emoji === emoji) {
          // Remove reaction if clicking same emoji
          message.reactions.splice(existingIdx, 1);
        } else {
          // Replace emoji
          message.reactions[existingIdx].emoji = emoji;
        }
      } else {
        // Add new reaction
        message.reactions.push({ emoji, userId: userId as any, userName });
      }

      await message.save();
      return NextResponse.json({ success: true, data: { reactions: message.reactions } });
    }

    if (action === 'pin') {
      message.isPinned = !message.isPinned;
      message.pinnedAt = message.isPinned ? new Date() : undefined;
      await message.save();
      return NextResponse.json({ success: true, data: { isPinned: message.isPinned, pinnedAt: message.pinnedAt } });
    }

    if (action === 'star') {
      const starredIdx = message.starredBy.findIndex((id) => id.toString() === userId);
      if (starredIdx > -1) {
        message.starredBy.splice(starredIdx, 1);
      } else {
        message.starredBy.push(userId as any);
      }
      await message.save();
      return NextResponse.json({ success: true, data: { starredBy: message.starredBy } });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
