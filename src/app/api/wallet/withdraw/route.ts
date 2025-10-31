import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { decryptPrivateKey } from '@/lib/crypto';

// POST /api/wallet/withdraw
// Body: { handle: string, toAddress: string, amount: number }
// Withdraws SOL from custodial tip wallet to another address
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { handle, toAddress, amount } = await req.json();
    
    if (!handle || !toAddress || !amount) {
      return NextResponse.json({ error: 'Missing required fields: handle, toAddress, amount' }, { status: 400 });
    }

    const norm = (h: string) => (h.startsWith('@') ? h : `@${h}`);
    const userHandle = norm(handle);

    // Find user with custodial wallet
    const user = await User.findOne({ handle: userHandle });
    if (!user || !user.encryptedPrivateKey || !user.walletAddress) {
      return NextResponse.json({ error: 'User not found or no custodial wallet' }, { status: 404 });
    }

    // Validate recipient address
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(toAddress);
    } catch {
      return NextResponse.json({ error: 'Invalid recipient address' }, { status: 400 });
    }

    // Validate amount
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Decrypt private key
    const privateKeyBytes = decryptPrivateKey(user.encryptedPrivateKey);
    const walletKeypair = Keypair.fromSecretKey(privateKeyBytes);

    // Get balance
    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const conn = new Connection(rpc);
    const balance = await conn.getBalance(walletKeypair.publicKey);
    const requestedLamports = Math.floor(amountNum * LAMPORTS_PER_SOL);
    
    // Estimate fee (roughly 5000 lamports)
    const estimatedFee = 5000;
    if (balance < requestedLamports + estimatedFee) {
      return NextResponse.json({ 
        error: `Insufficient balance. Available: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL, Requested: ${amountNum} SOL` 
      }, { status: 400 });
    }

    // Get recent blockhash first
    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
    
    // Create and send transaction
    const tx = new Transaction({
      feePayer: walletKeypair.publicKey,
      blockhash,
      lastValidBlockHeight
    }).add(
      SystemProgram.transfer({
        fromPubkey: walletKeypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: requestedLamports
      })
    );

    // Sign and send
    tx.sign(walletKeypair);
    const sig = await conn.sendRawTransaction(tx.serialize(), { 
      skipPreflight: false,
      maxRetries: 3 
    });

    // Wait for confirmation with retry logic
    const startTime = Date.now();
    while (Date.now() - startTime < 60000) {
      const status = await conn.getSignatureStatus(sig);
      if (status?.value?.err) {
        return NextResponse.json({ error: 'Transaction failed', details: status.value.err }, { status: 500 });
      }
      if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Verify final status
    const finalStatus = await conn.getSignatureStatus(sig);
    if (finalStatus?.value?.err) {
      return NextResponse.json({ error: 'Transaction failed', details: finalStatus.value.err }, { status: 500 });
    }

    // Record in history
    user.history.push({
      type: 'transfer',
      amount: amountNum,
      token: 'SOL',
      counterparty: toAddress,
      txHash: sig,
      date: new Date()
    });
    await user.save();

    return NextResponse.json({
      success: true,
      txHash: sig,
      amount: amountNum,
      from: user.walletAddress,
      to: toAddress,
      solscanUrl: `https://solscan.io/tx/${sig}`
    });

  } catch (e: any) {
    const message = e?.message || String(e);
    const stack = e?.stack || '';
    console.error('wallet/withdraw error', message, stack);
    
    // Return detailed error in all environments for debugging
    return NextResponse.json({ 
      error: 'Withdrawal failed', 
      details: process.env.NODE_ENV !== 'production' ? message : 'Please check server logs',
      fullError: process.env.NODE_ENV !== 'production' ? { message, stack } : undefined
    }, { status: 500 });
  }
}

