import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { decryptPrivateKey } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  try {
    // Only allow in development to avoid leaking keys in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    await connectDB();
    const { handle } = await req.json();
    if (!handle) {
      return NextResponse.json({ error: 'handle required' }, { status: 400 });
    }

    const user = await User.findOne({ handle });
    if (!user) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }
    if (!user.encryptedPrivateKey) {
      return NextResponse.json({ error: 'no custodial key to export' }, { status: 400 });
    }

    const secretKeyBytes = decryptPrivateKey(user.encryptedPrivateKey);
    // Return hex to avoid extra deps; client can convert if needed
    const secretKeyHex = Buffer.from(secretKeyBytes).toString('hex');

    return NextResponse.json({ success: true, walletAddress: user.walletAddress, privateKeyHex: secretKeyHex });
  } catch (e) {
    console.error('export wallet error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


