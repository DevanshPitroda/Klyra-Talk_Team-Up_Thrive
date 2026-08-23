import { NextResponse } from 'next/server';
import { auth } from '../../../../../lib/auth';
import { connectDB } from '../../../../../lib/db';
import Message from '../../../../../models/Message';
import Conversation from '../../../../../models/Conversation';
import ConversationMember from '../../../../../models/ConversationMember';
import Poll from '../../../../../models/Poll';
import mongoose from 'mongoose';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized session' } },
      { status: 401 }
    );
  }

  const { conversationId } = await params;
  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_ID', message: 'Invalid conversation ID' } },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const convId = new mongoose.Types.ObjectId(conversationId);

    // 1. Verify user membership in conversation
    const memberRecord = await ConversationMember.findOne({ conversationId: convId, userId });
    if (!memberRecord) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You are not a member of this conversation' } },
        { status: 403 }
      );
    }

    // 2. Fetch latest messages (ordered descending by creation time for cursor pagination logic)
    const messages = await Message.find({ conversationId: convId, isDeleted: false })
      .populate('senderId', 'name email image')
      .sort({ createdAt: -1 })
      .limit(50); // Set default limit page size

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized session' } },
      { status: 401 }
    );
  }

  const { conversationId } = await params;
  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_ID', message: 'Invalid conversation ID' } },
      { status: 400 }
    );
  }

  try {
    const { body, type, attachments, replyToId, viewOnce, pollData } = await req.json();
    await connectDB();

    const senderId = new mongoose.Types.ObjectId(session.user.id);
    const convId = new mongoose.Types.ObjectId(conversationId);

    // 1. Verify user membership
    const memberRecord = await ConversationMember.findOne({ conversationId: convId, userId: senderId });
    if (!memberRecord) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You are not a member of this conversation' } },
        { status: 403 }
      );
    }

    // 1.5 Fetch conversation to check disappearing timer
    const conversation = await Conversation.findById(convId);
    if (!conversation) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } }, { status: 404 });
    }

    let finalViewOnce = viewOnce || false;
    let finalExpiresAt = undefined;

    if (conversation.disappearingTimer === 'view_once') {
      finalViewOnce = true;
    } else if (conversation.disappearingTimer === '24h') {
      finalExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // 2. Create message log
    const newMessage = await Message.create({
      conversationId: convId,
      senderId,
      body,
      type: type || 'text',
      attachments: attachments || [],
      viewOnce: finalViewOnce,
      expiresAt: finalExpiresAt,
      replyToId: replyToId ? new mongoose.Types.ObjectId(replyToId) : undefined,
      seenBy: [{ userId: senderId, timestamp: new Date() }],
      deliveredTo: [],
    });

    // 3. Create poll if applicable
    if (type === 'poll' && pollData) {
      const poll = await Poll.create({
        messageId: newMessage._id,
        conversationId: convId,
        question: pollData.question,
        options: pollData.options.map((optText: string) => ({ text: optText, votes: [] })),
      });
      newMessage.body = poll._id.toString();
      await newMessage.save();
    }

    // 4. Update parent conversation reference meta
    conversation.lastMessageId = newMessage._id;
    conversation.lastMessageAt = newMessage.createdAt;
    await conversation.save();

    // Increment unread counts for all *other* members
    await ConversationMember.updateMany(
      { conversationId: convId, userId: { $ne: senderId } },
      { $inc: { unreadCount: 1 } }
    );

    // Populate sender details for immediate UI injection
    const populatedMessage = await Message.findById(newMessage._id).populate(
      'senderId',
      'name email image'
    );

    return NextResponse.json({ success: true, data: populatedMessage });
  } catch (error: any) {
    console.error('Failed to post message:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized session' } },
      { status: 401 }
    );
  }

  const { conversationId } = await params;
  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_ID', message: 'Invalid conversation ID' } },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const convId = new mongoose.Types.ObjectId(conversationId);

    // Verify membership
    const memberRecord = await ConversationMember.findOne({ conversationId: convId, userId });
    if (!memberRecord) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You are not a member' } },
        { status: 403 }
      );
    }

    // Mark all messages in this conversation as deleted
    await Message.updateMany({ conversationId: convId }, { isDeleted: true, body: '', attachments: [] });

    return NextResponse.json({ success: true, message: 'Chat history cleared' });
  } catch (error: any) {
    console.error('Failed to clear messages:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
