import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';
import { connectDB } from '../../../../lib/db';
import User from '../../../../models/User';

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { image },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { image: updatedUser.image } });
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
