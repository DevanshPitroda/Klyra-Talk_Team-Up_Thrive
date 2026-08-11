import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Poll from '@/models/Poll';
import mongoose from 'mongoose';

// POST /api/polls/[pollId]/vote — Toggle vote on an option
export async function POST(
  req: Request,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { pollId } = await params;
  const { optionIndex } = await req.json();

  if (typeof optionIndex !== 'number') {
    return NextResponse.json({ success: false, error: 'optionIndex is required' }, { status: 422 });
  }

  try {
    await connectDB();
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return NextResponse.json({ success: false, error: 'Poll not found' }, { status: 404 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Remove user's existing votes from all options (one vote per user)
    poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter((v) => v.toString() !== session.user!.id);
    });

    // Toggle: if already voted on this option, remove it (unvote). Otherwise add vote.
    const alreadyVoted = poll.options[optionIndex]?.votes.some(
      (v) => v.toString() === session.user!.id
    );

    if (!alreadyVoted && poll.options[optionIndex]) {
      poll.options[optionIndex].votes.push(userId);
    }

    await poll.save();

    return NextResponse.json({ success: true, data: poll });
  } catch (err: any) {
    console.error('[poll vote] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
