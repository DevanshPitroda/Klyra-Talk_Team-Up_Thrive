import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';
import { connectDB } from '../../../../lib/db';
import Message from '../../../../models/Message';
import mongoose from 'mongoose';

// DELETE /api/messages/[messageId]?scope=me|everyone
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;
    const url = new URL(req.url);
    const scope = url.searchParams.get('scope') || 'me'; // 'me' | 'everyone'

    await connectDB();

    const message = await Message.findById(new mongoose.Types.ObjectId(messageId));
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    if (scope === 'everyone') {
      // Only the sender can delete for everyone
      const rawSender: any = message.senderId;
      const senderIdStr = typeof rawSender === 'object' && rawSender !== null
        ? (rawSender._id ? rawSender._id.toString() : rawSender.toString())
        : String(rawSender);

      if (senderIdStr !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'Only the sender can delete for everyone' },
          { status: 403 }
        );
      }
      // Soft-delete: mark as deleted, clear body and attachments
      message.isDeleted = true;
      message.body = '';
      message.attachments = [];
      await message.save();

      return NextResponse.json({
        success: true,
        scope: 'everyone',
        messageId,
      });
    }

    // scope === 'me' — client-side only, just return success
    // The frontend will remove it from local state without a DB write
    return NextResponse.json({ success: true, scope: 'me', messageId });
  } catch (error: any) {
    console.error('Failed to delete message:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
