import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAccount, getMint } from '@solana/spl-token';

// Create connection per request to use fresh RPC URL
function getConnection() {
  return new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const publicKey = new PublicKey(walletAddress);
    const connection = getConnection();
    
    // Get SOL balance
    const solBalance = await connection.getBalance(publicKey, 'confirmed');
    const solBalanceFormatted = solBalance / LAMPORTS_PER_SOL;

    // Get token accounts (for USDC and other SPL tokens)
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });

    const tokenBalances = [];
    
    for (const { account } of tokenAccounts.value) {
      const tokenInfo = account.data.parsed.info;
      const mintAddress = tokenInfo.mint;
      const amount = tokenInfo.tokenAmount.uiAmount;
      
      // Get token metadata
      try {
        const mintInfo = await getMint(connection, new PublicKey(mintAddress));
        const decimals = mintInfo.decimals;
        const symbol = await getTokenSymbol(mintAddress);
        
        tokenBalances.push({
          mint: mintAddress,
          symbol: symbol || 'UNKNOWN',
          amount: amount,
          decimals: decimals
        });
      } catch (error) {
        // Skip tokens we can't process
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      sol: {
        amount: solBalanceFormatted,
        symbol: 'SOL',
        decimals: 9
      },
      tokens: tokenBalances
    });

  } catch (error) {
    console.error('Get balance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}

// Helper function to get token symbol (simplified)
async function getTokenSymbol(mintAddress: string): Promise<string | null> {
  // In a real implementation, you would query a token registry or metadata service
  // For now, we'll return known symbols for common tokens
  const knownTokens: { [key: string]: string } = {
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC', // USDC on Solana
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT', // USDT on Solana
  };
  
  return knownTokens[mintAddress] || null;
}


