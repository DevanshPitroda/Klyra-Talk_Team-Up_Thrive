import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import StudyRoom from '@/models/StudyRoom';
import RoomMember from '@/models/RoomMember';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const room = await StudyRoom.findOne({ roomId }).select('-password');
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    const members = await RoomMember.find({ roomId });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'https://klyra-talk-team-up-thrive.vercel.app';

    return NextResponse.json({
      success: true,
      data: {
        room,
        members,
        shareLink: `${appUrl}/room/${room.roomId}`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
