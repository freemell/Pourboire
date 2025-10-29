import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { encryptPrivateKey } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { twitterId, handle } = await request.json();
    
    if (!twitterId || !handle) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Generate new Solana keypair
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    const privateKey = keypair.secretKey;

    // Encrypt the private key
    const encryptedPrivateKey = encryptPrivateKey(privateKey);

    // Check if user already exists
    let user = await User.findOne({ twitterId });
    
    if (user) {
      // Update existing user with custodial wallet
      user.walletAddress = publicKey;
      user.encryptedPrivateKey = encryptedPrivateKey;
      user.isEmbedded = false;
      await user.save();
    } else {
      // Create new user with custodial wallet
      user = new User({
        twitterId,
        handle,
        name: handle, // Will be updated when user logs in
        profileImage: '', // Will be updated when user logs in
        bio: '',
        walletAddress: publicKey,
        encryptedPrivateKey,
        isEmbedded: false,
        history: [],
        pendingClaims: []
      });
      await user.save();
    }

    return NextResponse.json({
      success: true,
      walletAddress: publicKey,
      isCustodial: true
    });

  } catch (error) {
    console.error('Create custodial wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


