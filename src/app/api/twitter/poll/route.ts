import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { searchMentions, postTweet } from '@/lib/twitter';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { decryptPrivateKey } from '@/lib/crypto';

const BOT_HANDLE = '@Pourboireonsol';

function parseTip(text: string): { amount: number; token: 'SOL'|'USDC'; recipientHandle: string } | null {
  // More flexible parsing - handles formats like:
  // "@Pourboireonsol tip 0.01 sol @username"
  // "@Pourboireonsol tip 0.01 @username"
  // "@Pourboireonsol tip 0.01SOL @username"
  // "@Pourboireonsol tip @username 0.01 sol"
  
  // First try: standard format with token before recipient
  let re = /@pourboireonsol\s+tip\s+(\d+(?:\.\d+)?)\s*(sol|usdc)?\s+@([a-z0-9_]+)/i;
  let m = text.match(re);
  if (m) {
    const amount = Number(m[1]);
    const token = (m[2]?.toUpperCase() as 'SOL'|'USDC') || 'SOL';
    const recipientHandle = `@${m[3]}`;
    return { amount, token, recipientHandle };
  }
  
  // Second try: format with recipient before amount
  re = /@pourboireonsol\s+tip\s+@([a-z0-9_]+)\s+(\d+(?:\.\d+)?)\s*(sol|usdc)?/i;
  m = text.match(re);
  if (m) {
    const amount = Number(m[2]);
    const token = (m[3]?.toUpperCase() as 'SOL'|'USDC') || 'SOL';
    const recipientHandle = `@${m[1]}`;
    return { amount, token, recipientHandle };
  }
  
  // Third try: amount without explicit token (default to SOL), recipient anywhere
  re = /@pourboireonsol\s+tip\s+(\d+(?:\.\d+)?)\s+@([a-z0-9_]+)/i;
  m = text.match(re);
  if (m) {
    const amount = Number(m[1]);
    const token = 'SOL';
    const recipientHandle = `@${m[2]}`;
    return { amount, token, recipientHandle };
  }
  
  return null;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { sinceId } = await req.json().catch(() => ({ sinceId: undefined }));

      // Pull recent mentions of the bot
      const tweets = await searchMentions(`${BOT_HANDLE} -is:retweet`, sinceId);
      if (!tweets.length) {
        return NextResponse.json({ success: true, processed: 0, message: 'No new mentions found' });
      }

    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const conn = new Connection(rpc);

    let processed = 0;
    for (const t of tweets) {
      const parsed = parseTip(t.text || '');
      if (!parsed) continue;

      // Try to get sender username from tweet metadata, fallback to author_id
      let senderHandle = `@unknown_${t.author_id}`;
      try {
        // If tweet includes user info, extract username
        if ((t as any).author?.username) {
          senderHandle = `@${(t as any).author.username}`;
        } else if ((t as any).username) {
          senderHandle = `@${(t as any).username}`;
        }
      } catch {}

      const recipientHandle = parsed.recipientHandle;
      const recipientUsername = recipientHandle.replace(/^@/, '');
      const senderUsername = senderHandle.replace(/^@/, '');

      // Check if recipient exists (already signed up) or is new (needs wallet created)
      let recipient = await User.findOne({ handle: recipientHandle });
      const recipientIsExistingUser = !!recipient && !!recipient.walletAddress && !!recipient.encryptedPrivateKey;
      
      // Check if sender is registered (has custodial wallet)
      const sender = await User.findOne({ handle: senderHandle });
      const senderIsRegistered = !!sender && !!sender.encryptedPrivateKey && !!sender.walletAddress;

      // Only create wallet for non-existing users (don't create new wallet for existing users)
      if (!recipient || !recipient.walletAddress || !recipient.encryptedPrivateKey) {
        // Non-existing user - create wallet for them so we can send SOL
        const base = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        try {
          const createRes = await fetch(`${base}/api/wallet/create-custodial`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              handle: recipientHandle,
              twitterId: `temp_${Date.now()}` // Temporary ID until they sign up
            })
          });
          
          // Refresh recipient after creation
          if (createRes.ok) {
            recipient = await User.findOne({ handle: recipientHandle });
          }
        } catch (e) {
          console.error('Failed to create recipient wallet:', e);
        }
      }

      // Always attempt transfer if sender is registered and recipient has wallet
      // If sender is not registered, we can't transfer yet (no sender wallet)
      // But we still generate recipient wallet and record pending claim
      if (senderIsRegistered && recipient && recipient.walletAddress && parsed.token === 'SOL') {
        try {
          // Decrypt sender's private key
          const sk = decryptPrivateKey(sender.encryptedPrivateKey!);
          const kp = Keypair.fromSecretKey(sk);
          
          // Check sender balance before attempting transfer
          const senderBalance = await conn.getBalance(kp.publicKey);
          const requestedLamports = Math.floor(parsed.amount * LAMPORTS_PER_SOL);
          const estimatedFee = 5000; // Rough estimate for transaction fee
          
          if (senderBalance < requestedLamports + estimatedFee) {
            throw new Error(`Insufficient balance. Available: ${(senderBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL, Requested: ${parsed.amount} SOL`);
          }
          
          // Get recent blockhash
          const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
          
          // Create transaction
          const tx = new Transaction({
            feePayer: kp.publicKey,
            blockhash,
            lastValidBlockHeight
          }).add(
            SystemProgram.transfer({
              fromPubkey: kp.publicKey,
              toPubkey: new PublicKey(recipient.walletAddress),
              lamports: requestedLamports
            })
          );

          // Sign and send with skipPreflight to avoid blockhash expiry
          tx.sign(kp);
          const sig = await conn.sendRawTransaction(tx.serialize(), {
            skipPreflight: true,  // Skip preflight since we've validated balance
            maxRetries: 3
          });

          // Wait for confirmation
          let confirmed = false;
          const startTime = Date.now();
          while (Date.now() - startTime < 60000) {
            const status = await conn.getSignatureStatus(sig);
            if (status?.value?.err) {
              throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
            }
            if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
              confirmed = true;
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
          }

          if (!confirmed) {
            throw new Error('Transaction confirmation timeout');
          }

          // Record in both users' history
          sender.history.push({
            type: 'transfer',
            amount: parsed.amount,
            token: parsed.token,
            counterparty: recipientHandle,
            txHash: sig,
            date: new Date()
          });
          recipient.history.push({
            type: 'tip',
            amount: parsed.amount,
            token: parsed.token,
            counterparty: senderHandle,
            txHash: sig,
            date: new Date()
          });

          // Remove from pending claims if it exists
          recipient.pendingClaims = recipient.pendingClaims.filter(
            (p: any) => !(p.fromTx === t.id && p.sender === senderHandle)
          );

          await sender.save();
          await recipient.save();

          // Post success message with Solscan link - transfer succeeded
          // Recipient wallet was generated and SOL was transferred immediately (even if recipient hasn't signed up yet)
          // When recipient signs up, they'll see the SOL already in their wallet
          // Format: "@recipient pay from @sender A X SOL tip has been sent to your wallet! You will see it when you create an account on pourboire.tips. Tx: https://solscan.io/tx/..."
          await postTweet(`@${recipientUsername} pay from @${senderUsername} A ${parsed.amount} ${parsed.token} tip has been sent to your wallet! You will see it when you create an account on pourboire.tips. Tx: https://solscan.io/tx/${sig}`, t.id);
          
        } catch (e: any) {
          console.error('Failed to send tip on-chain:', e);
          // Transfer failed - record as pending claim, no Solscan link yet
          if (recipient) {
            const existingClaim = recipient.pendingClaims.find(
              (p: any) => p.fromTx === t.id && p.sender === senderHandle
            );
            if (!existingClaim) {
              recipient.pendingClaims.push({
                amount: parsed.amount,
                token: parsed.token,
                fromTx: t.id,
                sender: senderHandle
              });
              await recipient.save();
            }
          }
          const message = `@${recipientUsername} pay from @${senderUsername} A ${parsed.amount} ${parsed.token} tip has been recorded for you! Claim it to receive the Solscan link:`;
          await postTweet(message, t.id);
        }
      } else {
        // Sender not registered - can't transfer yet (no sender wallet)
        // Generate recipient wallet and record pending claim
        // When sender signs up, they can then send the tip
        if (recipient) {
          const existingClaim = recipient.pendingClaims.find(
            (p: any) => p.fromTx === t.id && p.sender === senderHandle
          );
          if (!existingClaim) {
            recipient.pendingClaims.push({
              amount: parsed.amount,
              token: parsed.token,
              fromTx: t.id,
              sender: senderHandle
            });
            await recipient.save();
          }
        }
        // Format: "@recipient pay from @sender A X SOL tip has been recorded for you! Claim it to receive the Solscan link:"
        const message = `@${recipientUsername} pay from @${senderUsername} A ${parsed.amount} ${parsed.token} tip has been recorded for you! Claim it to receive the Solscan link:`;
        await postTweet(message, t.id);
      }

      processed += 1;
    }

    return NextResponse.json({ success: true, processed });
  } catch (e: any) {
    const msg = e?.message || String(e);
    console.error('twitter/poll error', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


