import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import RoomPoll from '@/models/RoomPoll';

// POST — cast a vote on a poll option
export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string; pollId: string }> }
) {
  try {
    const { pollId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { optionId } = await req.json();
    if (typeof optionId !== 'number') {
      return NextResponse.json({ success: false, error: 'Invalid optionId' }, { status: 400 });
    }

    await connectDB();
    const poll = await RoomPoll.findById(pollId);
    if (!poll) {
      return NextResponse.json({ success: false, error: 'Poll not found' }, { status: 404 });
    }
    if (!poll.isActive) {
      return NextResponse.json({ success: false, error: 'Poll is closed' }, { status: 400 });
    }

    // Prevent duplicate votes
    const alreadyVoted = poll.options.some((o) => o.voters.includes(session.user!.id!));
    if (alreadyVoted) {
      return NextResponse.json({ success: false, error: 'Already voted' }, { status: 400 });
    }

    // Apply vote to the correct option
    let optionFound = false;
    poll.options = poll.options.map((o: any) => {
      const obj = o.toObject ? o.toObject() : { ...o };
      if (o.id === optionId) {
        optionFound = true;
        return { ...obj, votes: o.votes + 1, voters: [...o.voters, session.user!.id!] };
      }
      return obj;
    }) as typeof poll.options;

    if (!optionFound) {
      return NextResponse.json({ success: false, error: 'Option not found' }, { status: 404 });
    }

    poll.totalVotes += 1;
    await poll.save();

    return NextResponse.json({ success: true, data: poll });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
