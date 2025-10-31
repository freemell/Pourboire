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

    // Batch tips by sender-to-recipient pairs to combine multiple tips into single transactions
    type BatchedTip = {
      tweet: any;
      senderHandle: string;
      recipientHandle: string;
      amount: number;
      token: string;
      tweetId: string;
    };
    
    const batchedTips = new Map<string, BatchedTip[]>();
    
    // First pass: parse all tips and group by sender->recipient
    for (const t of tweets) {
      const parsed = parseTip(t.text || '');
      if (!parsed) continue;

      // Try to get sender username from tweet metadata
      let senderHandle = `@unknown_${t.author_id}`;
      try {
        if ((t as any).author?.username) {
          senderHandle = `@${(t as any).author.username}`;
        } else if ((t as any).username) {
          senderHandle = `@${(t as any).username}`;
        }
      } catch {}

      const recipientHandle = parsed.recipientHandle;
      const batchKey = `${senderHandle}->${recipientHandle}`;
      
      if (!batchedTips.has(batchKey)) {
        batchedTips.set(batchKey, []);
      }
      batchedTips.get(batchKey)!.push({
        tweet: t,
        senderHandle,
        recipientHandle,
        amount: parsed.amount,
        token: parsed.token,
        tweetId: t.id
      });
    }

    let processed = 0;
    
    // Process batched tips (multiple tips from same sender to same recipient = one transaction)
    for (const [batchKey, tips] of batchedTips.entries()) {
      if (tips.length === 0) continue;
      
      // Use first tip for lookup (sender/recipient are the same across batch)
      const firstTip = tips[0];
      const t = firstTip.tweet;
      
      const senderHandle = firstTip.senderHandle;
      const recipientHandle = firstTip.recipientHandle;
      const recipientUsername = recipientHandle.replace(/^@/, '');
      const senderUsername = senderHandle.replace(/^@/, '');
      
      // Calculate total amount for batched tips
      const totalAmount = tips.reduce((sum, tip) => sum + tip.amount, 0);
      const token = tips[0].token; // All tips in batch should have same token
      
      console.log(`Processing ${tips.length} tip(s) batched: sender=${senderHandle}, recipient=${recipientHandle}, total amount=${totalAmount} ${token}`);

      // Check if recipient exists (already signed up) or is new (needs wallet created)
      // Normalize recipient handle to ensure consistent lookup
      const normalizedRecipientHandle = recipientHandle.startsWith('@') ? recipientHandle : `@${recipientHandle}`;
      let recipient = await User.findOne({ handle: normalizedRecipientHandle });
      
      // If not found, try without @ prefix
      if (!recipient) {
        recipient = await User.findOne({ handle: normalizedRecipientHandle.replace(/^@/, '') });
      }
      
      const recipientIsExistingUser = !!recipient && !!recipient.walletAddress && !!recipient.encryptedPrivateKey;
      
      console.log(`Recipient check: handle=${normalizedRecipientHandle}, found=${!!recipient}, existing=${recipientIsExistingUser}, wallet=${recipient?.walletAddress || 'N/A'}`);
      
      // Check if sender is registered (has custodial wallet)
      // Look up sender by handle (normalized with @)
      const normalizedSenderHandle = senderHandle.startsWith('@') ? senderHandle : `@${senderHandle}`;
      let sender = await User.findOne({ handle: normalizedSenderHandle });
      
      // If not found by handle, try without @ prefix
      if (!sender) {
        const handleWithoutAt = normalizedSenderHandle.replace(/^@/, '');
        sender = await User.findOne({ handle: { $in: [handleWithoutAt, `@${handleWithoutAt}`] } });
      }
      
      // Also try to find by Twitter ID if we have the author_id
      if (!sender && t.author_id) {
        sender = await User.findOne({ twitterId: t.author_id });
      }
      
      const senderIsRegistered = !!sender && !!sender.encryptedPrivateKey && !!sender.walletAddress;
      
      console.log(`Sender check: handle=${normalizedSenderHandle}, author_id=${t.author_id}, found=${!!sender}, registered=${senderIsRegistered}, wallet=${sender?.walletAddress || 'N/A'}`);

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
            recipient = await User.findOne({ handle: normalizedRecipientHandle });
            if (!recipient) {
              recipient = await User.findOne({ handle: normalizedRecipientHandle.replace(/^@/, '') });
            }
            console.log(`Recipient wallet created/retrieved: handle=${normalizedRecipientHandle}, wallet=${recipient?.walletAddress || 'N/A'}`);
          }
        } catch (e) {
          console.error('Failed to create recipient wallet:', e);
        }
      }

      // Always attempt transfer if sender is registered and recipient has wallet
      // If sender is not registered, we can't transfer yet (no sender wallet)
      // But we still generate recipient wallet and record pending claim
      if (senderIsRegistered && recipient && recipient.walletAddress && token === 'SOL') {
        try {
          // Decrypt sender's private key
          const sk = decryptPrivateKey(sender.encryptedPrivateKey!);
          const kp = Keypair.fromSecretKey(sk);
          
          // Check sender balance before attempting transfer (for total batched amount)
          const senderBalance = await conn.getBalance(kp.publicKey);
          const requestedLamports = Math.floor(totalAmount * LAMPORTS_PER_SOL);
          const estimatedFee = 5000; // Rough estimate for transaction fee (single transaction for all batched tips)
          
          if (senderBalance < requestedLamports + estimatedFee) {
            throw new Error(`Insufficient balance. Available: ${(senderBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL, Requested: ${totalAmount} SOL (batched ${tips.length} tip(s))`);
          }
          
          // Get recent blockhash
          const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
          
          // Create single transaction for all batched tips (one transfer with total amount)
          const tx = new Transaction({
            feePayer: kp.publicKey,
            blockhash,
            lastValidBlockHeight
          }).add(
            SystemProgram.transfer({
              fromPubkey: kp.publicKey,
              toPubkey: new PublicKey(recipient.walletAddress), // Always uses the same custodial wallet
              lamports: requestedLamports // Total amount for all batched tips
            })
          );
          
          console.log(`Transferring ${totalAmount} SOL (${tips.length} tip(s) batched) from ${sender.walletAddress} to ${recipient.walletAddress} (recipient handle: ${normalizedRecipientHandle})`);

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

          // Record in both users' history (one entry for the batched transaction)
          sender.history.push({
            type: 'transfer',
            amount: totalAmount,
            token: token,
            counterparty: recipientHandle,
            txHash: sig,
            date: new Date()
          });
          recipient.history.push({
            type: 'tip',
            amount: totalAmount,
            token: token,
            counterparty: senderHandle,
            txHash: sig,
            date: new Date()
          });

          // Remove all pending claims for batched tips
          const tweetIds = tips.map(tip => tip.tweetId);
          recipient.pendingClaims = recipient.pendingClaims.filter(
            (p: any) => !(tweetIds.includes(p.fromTx) && p.sender === senderHandle)
          );

          await sender.save();
          await recipient.save();

          // Post success message with Solscan link - transfer succeeded
          // Recipient wallet was generated and SOL was transferred immediately (even if recipient hasn't signed up yet)
          // When recipient signs up, they'll see the SOL already in their wallet
          // Format: "@recipient pay from @sender A X SOL tip(s) have been sent to your wallet! You will see it when you create an account on pourboire.tips. Tx: https://solscan.io/tx/..."
          const tipText = tips.length === 1 
            ? `A ${totalAmount} ${token} tip has been sent to your wallet!`
            : `${tips.length} tips totaling ${totalAmount} ${token} have been sent to your wallet!`;
          const replyText = `@${recipientUsername} pay from @${senderUsername} ${tipText} You will see it when you create an account on pourboire.tips. Tx: https://solscan.io/tx/${sig}`;
          const replyId = await postTweet(replyText, t.id);
          if (!replyId) {
            console.error(`Failed to post reply to tweet ${t.id}`);
          }
          
        } catch (e: any) {
          console.error('Failed to send batched tip on-chain:', e);
          // Transfer failed - record all tips as pending claims, no Solscan link yet
          if (recipient) {
            for (const tip of tips) {
              const existingClaim = recipient.pendingClaims.find(
                (p: any) => p.fromTx === tip.tweetId && p.sender === senderHandle
              );
              if (!existingClaim) {
                recipient.pendingClaims.push({
                  amount: tip.amount,
                  token: tip.token,
                  fromTx: tip.tweetId,
                  sender: senderHandle
                });
              }
            }
            await recipient.save();
          }
          const message = `@${recipientUsername} pay from @${senderUsername} ${tips.length === 1 ? `A ${totalAmount} ${token} tip` : `${tips.length} tips totaling ${totalAmount} ${token}`} ${tips.length === 1 ? 'has' : 'have'} been recorded for you! Claim ${tips.length === 1 ? 'it' : 'them'} to receive the Solscan link:`;
          const replyId = await postTweet(message, t.id);
          if (!replyId) {
            console.error(`Failed to post reply to tweet ${t.id} (transfer failed)`);
          }
        }
      } else {
        // Sender not registered - can't transfer yet (no sender wallet)
        // Sender needs to sign up on pourboire.tips first to create a custodial wallet
        // Generate recipient wallet and record pending claims for all tips
        // When sender signs up and funds their wallet, they can claim and send the tips
        console.log(`Sender ${normalizedSenderHandle} not registered - recording ${tips.length} pending claim(s)`);
        if (recipient) {
          for (const tip of tips) {
            const existingClaim = recipient.pendingClaims.find(
              (p: any) => p.fromTx === tip.tweetId && p.sender === normalizedSenderHandle
            );
            if (!existingClaim) {
              recipient.pendingClaims.push({
                amount: tip.amount,
                token: tip.token,
                fromTx: tip.tweetId,
                sender: normalizedSenderHandle
              });
            }
          }
          await recipient.save();
        }
        // Format: "@recipient pay from @sender A X SOL tip has been recorded for you! Claim it to receive the Solscan link:"
        // Note: Sender must sign up on pourboire.tips first to fund their wallet before the tip can be sent
        const message = `@${recipientUsername} pay from @${senderUsername} ${tips.length === 1 ? `A ${totalAmount} ${token} tip` : `${tips.length} tips totaling ${totalAmount} ${token}`} ${tips.length === 1 ? 'has' : 'have'} been recorded for you! The sender needs to sign up on pourboire.tips first. Claim ${tips.length === 1 ? 'it' : 'them'} to receive the Solscan link:`;
        const replyId = await postTweet(message, t.id);
        if (!replyId) {
          console.error(`Failed to post reply to tweet ${t.id} (sender not registered)`);
        }
      }

      processed += tips.length; // Count all tips in the batch
    }

    return NextResponse.json({ success: true, processed });
  } catch (e: any) {
    const msg = e?.message || String(e);
    console.error('twitter/poll error', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


