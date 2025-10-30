import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { Keypair } from '@solana/web3.js';
import { encryptPrivateKey } from '@/lib/crypto';

// POST /api/tips/ingest
// Body: { senderHandle: string, recipientHandle: string, amount: number, token?: 'SOL'|'USDC', tweetId: string }
// Creates recipient if missing (custodial wallet), records a pending claim on recipient
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { senderHandle, recipientHandle, amount, token = 'SOL', tweetId } = await req.json();
    if (!senderHandle || !recipientHandle || !amount || !tweetId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const norm = (h: string) => (h.startsWith('@') ? h : `@${h}`);
    const senderH = norm(senderHandle);
    const recipientH = norm(recipientHandle);

    // Ensure sender exists (may be an app user or not). If not, create a shell record without custodial key
    let sender = await User.findOne({ handle: senderH });
    if (!sender) {
      sender = new User({
        twitterId: `temp_${Date.now()}`,
        handle: senderH,
        name: senderH.replace(/^@/, ''),
        profileImage: '',
        bio: '',
        walletAddress: '',
        isEmbedded: false,
        history: [],
        pendingClaims: []
      });
      await sender.save().catch(()=>{});
    }

    // Ensure recipient exists and has custodial wallet
    let recipient = await User.findOne({ handle: recipientH });
    if (!recipient) {
      const kp = Keypair.generate();
      const encrypted = encryptPrivateKey(kp.secretKey);
      recipient = new User({
        twitterId: `temp_${Date.now()}`,
        handle: recipientH,
        name: recipientH.replace(/^@/, ''),
        profileImage: '',
        bio: '',
        walletAddress: kp.publicKey.toString(),
        encryptedPrivateKey: encrypted,
        isEmbedded: false,
        history: [],
        pendingClaims: []
      });
      try { await recipient.save(); } catch (e: any) {
        if (e?.code === 11000) {
          recipient = await User.findOne({ handle: recipientH });
        } else {
          throw e;
        }
      }
    } else if (!recipient.walletAddress || !recipient.encryptedPrivateKey) {
      const kp = Keypair.generate();
      recipient.walletAddress = kp.publicKey.toString();
      recipient.encryptedPrivateKey = encryptPrivateKey(kp.secretKey);
      await recipient.save();
    }

    // Add pending claim to recipient
    recipient.pendingClaims.push({
      amount: Number(amount),
      token,
      fromTx: tweetId,
      sender: senderH
    });
    await recipient.save();

    return NextResponse.json({
      success: true,
      recipient: { id: recipient._id.toString(), handle: recipient.handle, walletAddress: recipient.walletAddress },
      pendingCount: recipient.pendingClaims.length
    });
  } catch (e: any) {
    const message = e?.message || String(e);
    console.error('tips/ingest error', message);
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


