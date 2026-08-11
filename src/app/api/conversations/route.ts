import { NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { connectDB } from '../../../lib/db';
import Conversation from '../../../models/Conversation';
import ConversationMember from '../../../models/ConversationMember';
import Message from '../../../models/Message';
import mongoose from 'mongoose';

// Helper to format conversation with members and unreadCount for the frontend
async function formatConversation(conv: any, currentUserId: mongoose.Types.ObjectId, memberships: any[]) {
  const membersList = await ConversationMember.find({ conversationId: conv._id })
    .populate('userId', 'name email image isOnline lastSeen about')
    .lean();

  // Separate current user out of member previews for display purposes (especially direct chats)
  const otherMembers = membersList
    .filter((m: any) => m.userId?._id.toString() !== currentUserId.toString())
    .map((m: any) => m.userId);

  const currentMemberData = memberships.find(
    (m) => m.conversationId.toString() === conv._id.toString()
  );

  let lastMessage = conv.lastMessageId;
  if (lastMessage && (mongoose.isValidObjectId(lastMessage) || lastMessage instanceof mongoose.Types.ObjectId)) {
    lastMessage = await Message.findById(lastMessage)
      .populate('senderId', 'name email')
      .lean();
  }

  return {
    _id: conv._id,
    type: conv.type,
    name: conv.name,
    image: conv.image,
    description: conv.description,
    members: otherMembers,
    lastMessage: lastMessage || undefined,
    unreadCount: currentMemberData?.unreadCount || 0,
    updatedAt: conv.updatedAt,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized session' } },
      { status: 401 }
    );
  }

  try {
    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    // 1. Get member details matching userId
    const memberships = await ConversationMember.find({ userId });
    const conversationIds = memberships.map((m) => m.conversationId);

    // 2. Fetch full conversation structures populated with details
    const conversations = await Conversation.find({
      _id: { $in: conversationIds },
      isArchived: false,
    })
      .populate('lastMessageId')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    // 3. Populate other members for each conversation
    const formattedConversations = await Promise.all(
      conversations.map((conv) => formatConversation(conv, userId, memberships))
    );

    return NextResponse.json({ success: true, data: formattedConversations });
  } catch (error: any) {
    console.error('Failed to get conversations:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized session' } },
      { status: 401 }
    );
  }

  try {
    const { type, participants, name, image, description } = await req.json();
    await connectDB();

    const creatorId = new mongoose.Types.ObjectId(session.user.id);

    // 1. Direct Chat creation logic
    if (type === 'direct') {
      if (!participants || participants.length !== 1) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Direct chat requires exactly 1 participant' } },
          { status: 422 }
        );
      }

      const otherUserId = new mongoose.Types.ObjectId(participants[0]);

      // Verify if direct chat exists
      const commonConversations = await ConversationMember.aggregate([
        { $match: { userId: { $in: [creatorId, otherUserId] } } },
        { $group: { _id: '$conversationId', count: { $sum: 1 } } },
        { $match: { count: 2 } }, // Matches both participants
      ]);

      let existingDirect = null;
      if (commonConversations.length > 0) {
        const commonConvIds = commonConversations.map((c) => c._id);
        existingDirect = await Conversation.findOne({
          _id: { $in: commonConvIds },
          type: 'direct',
        });
      }

      if (existingDirect) {
        const memberships = await ConversationMember.find({ userId: creatorId });
        const formatted = await formatConversation(existingDirect, creatorId, memberships);
        return NextResponse.json({ success: true, data: formatted });
      }

      // Create new direct conversation
      const newConversation = await Conversation.create({
        type: 'direct',
        createdBy: creatorId,
        lastMessageAt: new Date(),
      });

      // Insert both users into ConversationMember junction table
      const createdMembers = await ConversationMember.create([
        { conversationId: newConversation._id, userId: creatorId, role: 'owner' },
        { conversationId: newConversation._id, userId: otherUserId, role: 'member' },
      ]);

      const formatted = await formatConversation(newConversation, creatorId, createdMembers);
      return NextResponse.json({ success: true, data: formatted });
    }

    // 2. Group Chat creation logic
    if (type === 'group') {
      if (!name || name.trim() === '') {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Group name is required' } },
          { status: 422 }
        );
      }

      const newGroup = await Conversation.create({
        type: 'group',
        name,
        image: image || null,
        description: description || null,
        createdBy: creatorId,
        lastMessageAt: new Date(),
      });

      // Add creator as owner
      const memberInserts = [
        { conversationId: newGroup._id, userId: creatorId, role: 'owner' },
      ];

      // Add other participants
      if (participants && Array.isArray(participants)) {
        participants.forEach((pId: string) => {
          memberInserts.push({
            conversationId: newGroup._id,
            userId: new mongoose.Types.ObjectId(pId),
            role: 'member',
          });
        });
      }

      const createdMembers = await ConversationMember.insertMany(memberInserts);
      const formatted = await formatConversation(newGroup, creatorId, createdMembers);

      return NextResponse.json({ success: true, data: formatted });
    }

    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid conversation type' } },
      { status: 422 }
    );
  } catch (error: any) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
