import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ walletAddress });
    if (!user) {
      return NextResponse.json({ success: true, user: null, pending: [], history: [] });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        twitterId: user.twitterId,
        handle: user.handle,
        name: user.name,
        profileImage: user.profileImage,
        walletAddress: user.walletAddress,
        isEmbedded: user.isEmbedded,
      },
      pending: user.pendingClaims || [],
      history: user.history || [],
    });
  } catch (error: any) {
    const message = error?.message || String(error);
    console.error('Fetch pending tips error:', message);
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


