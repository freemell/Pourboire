'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

// Note: CSS styles are handled globally in the app

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  // Prefer env-configured RPC and network
  const envRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  const envNet = (process.env.NEXT_PUBLIC_SOLANA_NETWORK_NAME || 'devnet').toLowerCase();
  const network = envNet.includes('main') ? WalletAdapterNetwork.Mainnet : envNet.includes('test') ? WalletAdapterNetwork.Testnet : WalletAdapterNetwork.Devnet;

  const endpoint = useMemo(() => {
    if (envRpc) return envRpc;
    if (network === WalletAdapterNetwork.Mainnet) return 'https://api.mainnet-beta.solana.com';
    if (network === WalletAdapterNetwork.Testnet) return 'https://api.testnet.solana.com';
    return 'https://api.devnet.solana.com';
  }, [envRpc, network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
