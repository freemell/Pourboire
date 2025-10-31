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
    let user;
    try {
      user = await User.findOne({ handle: userHandle });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (!user.encryptedPrivateKey) {
        return NextResponse.json({ error: 'User has no custodial wallet private key' }, { status: 404 });
      }
      if (!user.walletAddress) {
        return NextResponse.json({ error: 'User has no wallet address' }, { status: 404 });
      }
    } catch (e: any) {
      console.error('Error finding user:', e?.message);
      return NextResponse.json({ error: 'Database error while finding user', details: e?.message }, { status: 500 });
    }

    // Validate recipient address
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(toAddress);
    } catch (e: any) {
      return NextResponse.json({ error: 'Invalid recipient address', details: e?.message }, { status: 400 });
    }

    // Validate amount
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Decrypt private key
    let privateKeyBytes: Uint8Array;
    let walletKeypair: Keypair;
    try {
      if (!process.env.ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
      }
      privateKeyBytes = decryptPrivateKey(user.encryptedPrivateKey);
      if (!privateKeyBytes || privateKeyBytes.length !== 64) {
        throw new Error(`Invalid decrypted key length: ${privateKeyBytes?.length}, expected 64`);
      }
      walletKeypair = Keypair.fromSecretKey(privateKeyBytes);
    } catch (e: any) {
      console.error('Error decrypting private key:', e?.message);
      return NextResponse.json({ 
        error: 'Failed to decrypt private key', 
        details: e?.message 
      }, { status: 500 });
    }

    // Get balance
    let balance: number;
    let conn: Connection;
    try {
      const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
      conn = new Connection(rpc);
      balance = await conn.getBalance(walletKeypair.publicKey);
    } catch (e: any) {
      console.error('Error getting balance:', e?.message);
      return NextResponse.json({ 
        error: 'Failed to get wallet balance', 
        details: e?.message 
      }, { status: 500 });
    }
    
    const requestedLamports = Math.floor(amountNum * LAMPORTS_PER_SOL);
    
    // Estimate fee (roughly 5000 lamports)
    const estimatedFee = 5000;
    if (balance < requestedLamports + estimatedFee) {
      return NextResponse.json({ 
        error: `Insufficient balance. Available: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL, Requested: ${amountNum} SOL` 
      }, { status: 400 });
    }

    // Create and send transaction using sendTransaction which handles blockhash automatically
    let sig: string;
    try {
      // Create transaction (don't set blockhash, let sendTransaction handle it)
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: walletKeypair.publicKey,
          toPubkey: recipientPubkey,
          lamports: requestedLamports
        })
      );

      // Sign transaction
      tx.sign(walletKeypair);
      
      // Use sendTransaction which automatically fetches fresh blockhash
      // This is more reliable than sendRawTransaction with manual blockhash
      sig = await conn.sendTransaction(tx, [walletKeypair], {
        skipPreflight: false,
        maxRetries: 5,
        preflightCommitment: 'confirmed'
      });
      
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      console.error('Error creating/sending transaction:', errorMsg);
      
      // Try to get detailed error logs
      if (typeof e?.getLogs === 'function') {
        try {
          const logs = await e.getLogs();
          console.error('Transaction simulation logs:', logs);
          return NextResponse.json({ 
            error: 'Failed to create or send transaction', 
            details: errorMsg,
            logs: logs
          }, { status: 500 });
        } catch {}
      }
      
      return NextResponse.json({ 
        error: 'Failed to create or send transaction', 
        details: errorMsg
      }, { status: 500 });
    }

    // Wait for confirmation with retry logic
    try {
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
    } catch (e: any) {
      console.error('Error confirming transaction:', e?.message);
      return NextResponse.json({ 
        error: 'Failed to confirm transaction', 
        details: e?.message,
        txHash: sig 
      }, { status: 500 });
    }

    // Record in history
    try {
      user.history.push({
        type: 'transfer',
        amount: amountNum,
        token: 'SOL',
        counterparty: toAddress,
        txHash: sig,
        date: new Date()
      });
      await user.save();
    } catch (e: any) {
      console.error('Error saving transaction history:', e?.message);
      // Don't fail the request if history save fails, but log it
    }

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
    
    // Always return error details for debugging (even in production)
    return NextResponse.json({ 
      error: 'Withdrawal failed', 
      details: message,
      stack: process.env.NODE_ENV !== 'production' ? stack : undefined
    }, { status: 500 });
  }
}

