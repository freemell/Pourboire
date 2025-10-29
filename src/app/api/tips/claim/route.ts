import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { decryptPrivateKey } from '@/lib/crypto';

const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com');

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { userId, tipId } = await request.json();
    
    if (!userId || !tipId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the pending claim
    const pendingClaim = user.pendingClaims.find(claim => claim._id?.toString() === tipId);
    if (!pendingClaim) {
      return NextResponse.json(
        { error: 'Pending claim not found' },
        { status: 404 }
      );
    }

    // Check if user has embedded wallet (can receive funds)
    if (!user.isEmbedded || !user.walletAddress) {
      return NextResponse.json(
        { error: 'User must have an embedded wallet to claim tips' },
        { status: 400 }
      );
    }

    // For custodial wallets, we need to transfer from the custodial address
    // For now, we'll simulate the transfer and update the database
    // In a real implementation, you would:
    // 1. Get the custodial wallet's private key
    // 2. Create a transaction to transfer funds to the user's embedded wallet
    // 3. Sign and send the transaction

    // Mock transaction hash (in real implementation, this would be the actual tx hash)
    const txHash = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add to transaction history
    user.history.push({
      type: 'tip',
      amount: pendingClaim.amount,
      token: pendingClaim.token as 'SOL' | 'USDC',
      counterparty: pendingClaim.sender,
      txHash: txHash,
      date: new Date()
    });

    // Remove from pending claims
    user.pendingClaims = user.pendingClaims.filter(claim => claim._id?.toString() !== tipId);

    await user.save();

    return NextResponse.json({
      success: true,
      txHash: txHash,
      message: 'Tip claimed successfully'
    });

  } catch (error) {
    console.error('Claim tip error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


