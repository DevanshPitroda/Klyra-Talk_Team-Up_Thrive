import { NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { connectDB } from '../../../lib/db';
import User from '../../../models/User';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized session' } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query || query.trim() === '') {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    await connectDB();

    // Find users whose name or email matches the search query. Exclude the current user from results.
    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        },
        { _id: { $ne: session.user.id } },
        { isBanned: { $ne: true } },
      ],
    })
      .select('name email image about isOnline lastSeen')
      .limit(20);

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error('Failed to search users:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
