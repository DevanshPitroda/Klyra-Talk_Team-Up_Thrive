import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import StudyRoom from '@/models/StudyRoom';
import RoomMember from '@/models/RoomMember';
import bcrypt from 'bcryptjs';

// Helper to generate a 8-character code like "XH9K-7PQR"
function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${part1}-${part2}`;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      password,
      visibility = 'public',
      maxParticipants = 25,
      permissions = { allowCamera: true, allowMic: true, allowScreenShare: true, allowChat: true },
      autoAdmit = true,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Room name is required' }, { status: 400 });
    }

    await connectDB();

    // Generate unique Room ID
    let roomId = generateRoomId();
    let exists = await StudyRoom.findOne({ roomId });
    while (exists) {
      roomId = generateRoomId();
      exists = await StudyRoom.findOne({ roomId });
    }

    // Password hashing if provided
    let hashedPassword = undefined;
    let isPasswordProtected = false;
    if (password && password.trim().length > 0) {
      hashedPassword = await bcrypt.hash(password.trim(), 10);
      isPasswordProtected = true;
    }

    // Create Room
    const room = await StudyRoom.create({
      roomId,
      name: name.trim(),
      hostId: session.user.id,
      hostName: session.user.name || 'Anonymous Host',
      password: hashedPassword,
      isPasswordProtected,
      visibility,
      maxParticipants,
      permissions,
      autoAdmit,
    });

    // Create Host Member record
    await RoomMember.create({
      roomId: room.roomId,
      userId: session.user.id,
      userName: session.user.name || 'Anonymous Host',
      userImage: session.user.image || undefined,
      role: 'host',
      status: 'approved',
    });

    const roomData = room.toObject();
    delete roomData.password;

    return NextResponse.json({
      success: true,
      data: {
        ...roomData,
        shareLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${room.roomId}`,
      },
    });
  } catch (error: any) {
    console.error('Error creating study room:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const rooms = await StudyRoom.find({ hostId: session.user.id })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({ success: true, data: rooms });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
