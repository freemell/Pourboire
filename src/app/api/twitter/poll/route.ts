import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { searchMentions, postTweet } from '@/lib/twitter';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { decryptPrivateKey } from '@/lib/crypto';

const BOT_HANDLE = '@Pourboireonsol';

function parseTip(text: string): { amount: number; token: 'SOL'|'USDC'; recipientHandle: string } | null {
  // Example: "@Pourboireonsol tip 0.01 sol @username"
  const re = /@pourboireonsol\s+tip\s+(\d+(?:\.\d+)?)\s*(sol|usdc)?\s+(@[a-z0-9_]+)/i;
  const m = text.match(re);
  if (!m) return null;
  const amount = Number(m[1]);
  const token = (m[2]?.toUpperCase() as 'SOL'|'USDC') || 'SOL';
  const recipientHandle = m[3];
  return { amount, token, recipientHandle };
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { sinceId } = await req.json().catch(() => ({ sinceId: undefined }));

    // Pull recent mentions of the bot
    const tweets = await searchMentions(`${BOT_HANDLE} -is:retweet`, sinceId);
    if (!tweets.length) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const conn = new Connection(rpc);

    let processed = 0;
    for (const t of tweets) {
      const parsed = parseTip(t.text || '');
      if (!parsed) continue;

      const senderHandle = `@${t.author_id}`; // We will try to reconstruct proper handle later if needed
      // Prefer to treat author_id as unknown handle; users can still claim via recipient path

      const recipientHandle = parsed.recipientHandle;

      // Ensure recipient user exists with custodial wallet via internal API
      const base = process.env.NEXT_PUBLIC_BASE_URL || '';
      try {
        await fetch(`${base}/api/tips/ingest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senderHandle, recipientHandle, amount: parsed.amount, token: parsed.token, tweetId: t.id })
        });
      } catch {}

      // If sender is a custodial user in our DB, send on-chain immediately
      const sender = await User.findOne({ handle: senderHandle });
      const recipient = await User.findOne({ handle: recipientHandle });
      if (sender?.encryptedPrivateKey && recipient?.walletAddress && parsed.token === 'SOL') {
        try {
          const sk = decryptPrivateKey(sender.encryptedPrivateKey);
          const kp = Keypair.fromSecretKey(sk);
          const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: new PublicKey(recipient.walletAddress), lamports: Math.floor(parsed.amount * LAMPORTS_PER_SOL) }));
          const sig = await conn.sendTransaction(tx, [kp]);
          await conn.confirmTransaction(sig, 'confirmed');
          await postTweet(`@${recipientHandle.replace(/^@/, '')} ✅ tip sent: ${parsed.amount} ${parsed.token}. Tx: https://solscan.io/tx/${sig}`);
        } catch (e) {
          await postTweet(`@${recipientHandle.replace(/^@/, '')} a tip has been recorded for you, sign up and claim.`);
        }
      } else {
        await postTweet(`@${recipientHandle.replace(/^@/, '')} a tip has been recorded for you, sign up and claim.`);
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


