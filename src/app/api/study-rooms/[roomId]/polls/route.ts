import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import RoomPoll from '@/models/RoomPoll';

// GET — fetch all active polls for a room
export async function GET(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const polls = await RoomPoll.find({ roomId, isActive: true }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: polls });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// POST — create a new poll
export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { question, options, isAnonymous } = body;

    if (!question?.trim() || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ success: false, error: 'Invalid poll data' }, { status: 400 });
    }

    const validOptions = options.filter((o: string) => typeof o === 'string' && o.trim());
    if (validOptions.length < 2) {
      return NextResponse.json({ success: false, error: 'At least 2 non-empty options required' }, { status: 400 });
    }

    await connectDB();
    const poll = await RoomPoll.create({
      roomId,
      question: question.trim(),
      options: validOptions.map((text: string, idx: number) => ({
        id: idx,
        text: text.trim(),
        votes: 0,
        voters: [],
      })),
      isAnonymous: isAnonymous || false,
      createdBy: session.user.id,
    });

    return NextResponse.json({ success: true, data: poll });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
