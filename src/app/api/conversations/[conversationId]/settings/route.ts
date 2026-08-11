import { NextResponse } from 'next/server';
import { auth } from '../../../../../lib/auth';
import { connectDB } from '../../../../../lib/db';
import Conversation from '../../../../../models/Conversation';
import ConversationMember from '../../../../../models/ConversationMember';
import mongoose from 'mongoose';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { conversationId } = await params;
    const body = await req.json();
    const { disappearingTimer } = body;

    if (!['off', '24h', 'view_once'].includes(disappearingTimer)) {
      return NextResponse.json(
        { success: false, error: 'Invalid disappearingTimer value' },
        { status: 400 }
      );
    }

    await connectDB();
    const convId = new mongoose.Types.ObjectId(conversationId);
    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Verify membership
    const memberRecord = await ConversationMember.findOne({ conversationId: convId, userId });
    if (!memberRecord) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this conversation' },
        { status: 403 }
      );
    }

    // Update Conversation settings
    const updatedConv = await Conversation.findByIdAndUpdate(
      convId,
      { disappearingTimer },
      { new: true }
    );

    if (!updatedConv) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Since we don't have socket logic in this route directly, the client can use an optimistic update 
    // or trigger a socket event 'conversation_settings_updated' themselves via another route/mechanism.
    
    return NextResponse.json({ success: true, data: updatedConv });
  } catch (error: any) {
    console.error('Failed to update conversation settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
