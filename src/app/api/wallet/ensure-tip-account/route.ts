import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { encryptPrivateKey } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { handle, twitterId } = await req.json();
    if (!handle) {
      return NextResponse.json({ error: 'handle required' }, { status: 400 });
    }

    // Normalize handle to always include leading @
    const normalizedHandle = handle.startsWith('@') ? handle : `@${handle}`;

    // Try to find user by handle
    let user = await User.findOne({ handle: normalizedHandle });

    // If user exists and has a wallet (may have been created during Twitter poll for non-users), use it
    // This assigns the pre-created wallet to the user when they sign up
    if (user && user.walletAddress && user.encryptedPrivateKey) {
      return NextResponse.json({ success: true, walletAddress: user.walletAddress, created: false });
    }

    // If user exists but lacks a custodial tip wallet, create one
    if (user && (!user.encryptedPrivateKey || !user.walletAddress)) {
      const kp = Keypair.generate();
      const encrypted = encryptPrivateKey(kp.secretKey);
      user.walletAddress = kp.publicKey.toString();
      user.encryptedPrivateKey = encrypted;
      await user.save();
      return NextResponse.json({ success: true, walletAddress: user.walletAddress, created: true });
    }

    // User doesn't exist - check if there's a pre-created wallet for this handle (from Twitter poll)
    // This happens when someone tipped a non-user before they signed up
    const preCreatedUser = await User.findOne({ 
      handle: normalizedHandle,
      twitterId: { $regex: /^temp_/ } // Match temporary Twitter IDs from pre-creation
    });

    if (preCreatedUser && preCreatedUser.walletAddress && preCreatedUser.encryptedPrivateKey) {
      // Assign the pre-created wallet to the new user account
      // Update with real Twitter ID and user data from Privy
      preCreatedUser.twitterId = twitterId || preCreatedUser.twitterId;
      // Keep the existing walletAddress and encryptedPrivateKey (SOL is already in it)
      await preCreatedUser.save();
      return NextResponse.json({ success: true, walletAddress: preCreatedUser.walletAddress, created: false, wasPreCreated: true });
    }

    // No pre-created wallet found - create a new user with new wallet
    const kp = Keypair.generate();
    const encrypted = encryptPrivateKey(kp.secretKey);
    user = new User({
      twitterId: twitterId || `temp_${Date.now()}`,
      handle: normalizedHandle,
      name: normalizedHandle.replace(/^@/, ''),
      profileImage: '',
      bio: '',
      walletAddress: kp.publicKey.toString(),
      encryptedPrivateKey: encrypted,
      isEmbedded: false,
      history: [],
      pendingClaims: [],
    });
    try {
      await user.save();
    } catch (err: any) {
      // If a race created the user concurrently, fetch and return it
      if (err?.code === 11000) {
        const existing = await User.findOne({ handle: normalizedHandle });
        if (existing?.walletAddress) {
          return NextResponse.json({ success: true, walletAddress: existing.walletAddress, created: false });
        }
      }
      throw err;
    }
    return NextResponse.json({ success: true, walletAddress: user.walletAddress, created: true });
  } catch (e: any) {
    const message = e?.message || String(e);
    console.error('ensure-tip-account error', message);
    // In development, surface the message to speed up debugging
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


