import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import StudyRoom from '@/models/StudyRoom';
import RoomMember from '@/models/RoomMember';
import bcrypt from 'bcryptjs';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { password, userName } = body;

    await connectDB();

    // Fetch room including password for validation
    const room = await StudyRoom.findOne({ roomId }).select('+password');
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    // Check room lock
    if (room.isLocked && room.hostId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Room is locked by host' }, { status: 403 });
    }

    // Check max participants capacity
    const currentMemberCount = await RoomMember.countDocuments({ roomId, status: 'approved' });
    if (currentMemberCount >= room.maxParticipants && room.hostId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Room is at maximum capacity' }, { status: 403 });
    }

    // Check password if required and user is not host
    if (room.isPasswordProtected && room.hostId.toString() !== session.user.id) {
      if (!password) {
        return NextResponse.json(
          { success: false, error: 'Password required', passwordRequired: true },
          { status: 401 }
        );
      }

      const isMatch = await bcrypt.compare(password, room.password || '');
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: 'Incorrect room password', passwordRequired: true },
          { status: 401 }
        );
      }
    }

    const isHost = room.hostId.toString() === session.user.id;
    const initialStatus = isHost || room.autoAdmit ? 'approved' : 'pending';
    const role = isHost ? 'host' : 'participant';

    const finalName = userName?.trim() || session.user.name || 'Anonymous User';

    // Upsert member record
    const member = await RoomMember.findOneAndUpdate(
      { roomId, userId: session.user.id },
      {
        userName: finalName,
        userImage: session.user.image,
        role,
        status: initialStatus,
        joinedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    const roomData = room.toObject();
    delete roomData.password;

    return NextResponse.json({
      success: true,
      data: {
        room: roomData,
        member,
        status: initialStatus, // 'approved' or 'pending'
      },
    });
  } catch (error: any) {
    console.error('Error joining room:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
