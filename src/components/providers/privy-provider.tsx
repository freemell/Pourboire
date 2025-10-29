'use client';

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import { FC, ReactNode, useEffect, useState } from 'react';

interface PrivyProviderProps {
  children: ReactNode;
}

export const PrivyProvider: FC<PrivyProviderProps> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{children}</>;
  }

  if (!appId) {
    console.warn('NEXT_PUBLIC_PRIVY_APP_ID is not set. Privy authentication will not work.');
    return <>{children}</>;
  }

  try {
    return (
      <PrivyProviderBase
        appId={appId}
        config={{
        // Configure login methods
        loginMethods: ['twitter', 'email', 'wallet'],
          
          // Configure embedded wallets
          embeddedWallets: {
            solana: {
              createOnLogin: 'all-users',
            },
            ethereum: {
              createOnLogin: 'all-users',
            },
          },
          
          // Configure appearance
          appearance: {
            theme: 'dark',
            accentColor: '#3B82F6',
          },
          
        // Configure supported chains - Solana devnet
        supportedChains: [
          {
            id: 1399811149, // Solana devnet chain ID
            name: 'Solana Devnet',
            network: 'devnet',
            nativeCurrency: {
              name: 'SOL',
              symbol: 'SOL',
              decimals: 9,
            },
            rpcUrls: {
              default: {
                http: ['https://api.devnet.solana.com'],
              },
              public: {
                http: ['https://api.devnet.solana.com'],
              },
            },
          }
        ],
        }}
      >
        {children}
      </PrivyProviderBase>
    );
  } catch (error) {
    console.error('Privy initialization error:', error);
    return <>{children}</>;
  }
};


