import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Message from '@/models/Message';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { messageId } = await params;

  try {
    await connectDB();

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    if (!message.viewOnce) {
      return NextResponse.json({ success: false, error: 'Not a view-once message' }, { status: 400 });
    }

    // Only the recipient can mark it as seen (not the sender)
    if (message.senderId.toString() === session.user.id) {
      return NextResponse.json({ success: false, error: 'Sender cannot mark their own view-once' }, { status: 403 });
    }

    message.viewOnceSeen = true;
    // Remove attachment URLs so they can't be replayed
    message.attachments = [];
    await message.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[view-once] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
