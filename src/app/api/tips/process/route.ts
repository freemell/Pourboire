import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { shouldUseX402, x402Server } from '@/lib/x402';
import { postTweet } from '@/lib/twitter';

const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com');

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { 
      senderHandle, 
      recipientHandle, 
      amount, 
      token, 
      tweetText,
      tweetId 
    } = await request.json();
    
    if (!senderHandle || !recipientHandle || !amount || !token) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Find sender
    const sender = await User.findOne({ handle: senderHandle });
    if (!sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      );
    }

    // Find or create recipient
    let recipient = await User.findOne({ handle: recipientHandle });
    if (!recipient) {
      // Create custodial wallet for unsigned user
      const createCustodialResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/wallet/create-custodial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twitterId: `temp_${Date.now()}`, // Temporary ID until user signs up
          handle: recipientHandle
        })
      });
      
      if (!createCustodialResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to create recipient wallet' },
          { status: 500 }
        );
      }
      
      const { walletAddress } = await createCustodialResponse.json();
      recipient = await User.findOne({ walletAddress });
    }

    // Check if we should use x402 for micropayments
    if (shouldUseX402(amount, token, tweetText)) {
      return x402Server.sendPaymentRequired(
        NextResponse,
        {
          amount: amount,
          currency: token === 'SOL' ? 'USDC' : token, // Convert SOL tips to USDC for x402
          facilitator: 'coinbase',
          description: `Tip from ${senderHandle} to ${recipientHandle}`
        }
      );
    }

    // Process regular Solana transfer
    const txHash = await processSolanaTransfer(sender, recipient, amount, token);

    // Add to both users' transaction history
    const transaction = {
      type: 'tip' as const,
      amount: amount,
      token: token as 'SOL' | 'USDC',
      counterparty: recipientHandle,
      txHash: txHash,
      date: new Date()
    };

    sender.history.push(transaction);
    await sender.save();

    // For unsigned recipients, add to pending claims
    if (!recipient.isEmbedded) {
      recipient.pendingClaims.push({
        amount: amount,
        token: token,
        fromTx: txHash,
        sender: senderHandle
      });
    } else {
      // For signed recipients, add to history
      recipient.history.push(transaction);
    }
    await recipient.save();

    // Post confirmation tweet
    const confirmationText = `✅ Tip sent! ${amount} ${token} to ${recipientHandle}\nTx: ${txHash}`;
    await postTweet(confirmationText);

    return NextResponse.json({
      success: true,
      txHash: txHash,
      message: 'Tip processed successfully'
    });

  } catch (error) {
    console.error('Process tip error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processSolanaTransfer(sender: any, recipient: any, amount: number, token: string): Promise<string> {
  // Mock transaction processing
  // In a real implementation, you would:
  // 1. Create a transaction
  // 2. Sign it with the sender's wallet
  // 3. Send it to the Solana network
  // 4. Return the transaction hash
  
  const mockTxHash = `sol_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return mockTxHash;
}


