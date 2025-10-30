import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com');

export async function POST(req: NextRequest) {
  try {
    const { address, amount } = await req.json();
    if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });
    const pubkey = new PublicKey(address);
    // Only allow on devnet
    const rpc = (process.env.NEXT_PUBLIC_SOLANA_RPC_URL || '').toLowerCase();
    if (!rpc.includes('devnet')) {
      return NextResponse.json({ error: 'Airdrop allowed only on devnet' }, { status: 400 });
    }
    const lamports = Math.floor((Number(amount) || 1) * LAMPORTS_PER_SOL);
    const sig = await connection.requestAirdrop(pubkey, lamports);
    await connection.confirmTransaction(sig, 'confirmed');
    return NextResponse.json({ success: true, signature: sig });
  } catch (e: any) {
    console.error('airdrop error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


