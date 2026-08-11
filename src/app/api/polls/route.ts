import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Poll from '@/models/Poll';

// GET /api/polls?pollId=... — Fetch poll data
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pollId = searchParams.get('pollId');
  if (!pollId) {
    return NextResponse.json({ success: false, error: 'pollId is required' }, { status: 422 });
  }

  try {
    await connectDB();
    const poll = await Poll.findById(pollId).lean();
    if (!poll) {
      return NextResponse.json({ success: false, error: 'Poll not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: poll });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/polls — Create a new poll
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { messageId, conversationId, question, options } = await req.json();

  if (!question || !options || options.length < 2) {
    return NextResponse.json(
      { success: false, error: 'A poll requires a question and at least 2 options' },
      { status: 422 }
    );
  }

  try {
    await connectDB();
    const poll = await Poll.create({
      messageId,
      conversationId,
      question,
      options: options.map((text: string) => ({ text, votes: [] })),
    });
    return NextResponse.json({ success: true, data: poll }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
