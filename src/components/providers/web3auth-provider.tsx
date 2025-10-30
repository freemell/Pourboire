'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, IProvider } from '@web3auth/base';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { SolanaPrivateKeyProvider } from '@web3auth/solana-provider';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

type Web3AuthContextType = {
  isReady: boolean;
  provider: IProvider | null;
  publicAddress: string | null;
  balance: number | null;
  login: (loginProvider?: 'google' | 'twitter' | 'discord') => Promise<void>;
  logout: () => Promise<void>;
};

const Web3AuthContext = createContext<Web3AuthContextType | null>(null);

export function useWeb3Auth() {
  const ctx = useContext(Web3AuthContext);
  if (!ctx) throw new Error('useWeb3Auth must be used within Web3AuthProvider');
  return ctx;
}

export default function Web3AuthProvider({ children }: { children: React.ReactNode }) {
  const [web3auth, setWeb3Auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [publicAddress, setPublicAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize Web3Auth client-side
  useEffect(() => {
    const init = async () => {
      try {
        const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID as string;
        if (!clientId) {
          console.warn('NEXT_PUBLIC_WEB3AUTH_CLIENT_ID is missing');
        }

        const isDevnet = (process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK || 'sapphire_mainnet') === 'sapphire_devnet';

        const privateKeyProvider = new SolanaPrivateKeyProvider({
          config: {
            chainConfig: {
              chainNamespace: CHAIN_NAMESPACES.SOLANA,
              // Per Web3Auth docs: '0x1' mainnet, '0x3' devnet
              chainId: (isDevnet ? '0x3' : '0x1') as string,
              rpcTarget: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || (isDevnet ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com'),
              displayName: process.env.NEXT_PUBLIC_SOLANA_NETWORK_NAME || (isDevnet ? 'Solana Devnet' : 'Solana Mainnet'),
              ticker: 'SOL',
              tickerName: 'Solana',
            },
          },
        });

        const w3a = new Web3Auth({
          clientId,
          web3AuthNetwork: (process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK === 'sapphire_devnet' ? 'sapphire_devnet' : 'sapphire_mainnet'),
          privateKeyProvider: privateKeyProvider as unknown as any,
        });

        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            uxMode: 'popup',
          },
          loginSettings: { mfaLevel: 'optional' },
        });

        // Backward/forward compatible init across SDK versions
        try {
          // @ts-ignore - older SDKs
          if (typeof (w3a as any).configureAdapter === 'function') {
            // @ts-ignore
            (w3a as any).configureAdapter(openloginAdapter);
          }
          if (typeof (w3a as any).initModal === 'function') {
            await (w3a as any).initModal();
          } else if (typeof (w3a as any).init === 'function') {
            await (w3a as any).init();
          }
        } catch (e) {
          console.error('Web3Auth init error', e);
        }

        setWeb3Auth(w3a);
        setProvider(w3a.provider);

        // If already connected, fetch address and balance
        if (w3a.provider) {
          const address = await getAddress(w3a.provider);
          setPublicAddress(address);
          await refreshBalance(w3a.provider, address);
        }
      } catch (e) {
        console.error('Web3Auth init error', e);
      } finally {
        setIsReady(true);
      }
    };
    init();
  }, []);

  const getAddress = useCallback(async (prov: IProvider): Promise<string> => {
    // Web3Auth Solana provider exposes standard RPC
    const accs = (await prov.request({ method: 'solana_requestAccounts' })) as string[];
    return accs?.[0] || '';
  }, []);

  const refreshBalance = useCallback(async (prov: IProvider, address: string) => {
    try {
      const conn = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com');
      const lamports = await conn.getBalance(new PublicKey(address));
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (e) {
      console.warn('Balance fetch failed', e);
    }
  }, []);

  const login = useCallback(async (_loginProvider?: 'google' | 'twitter' | 'discord') => {
    if (!web3auth) return;
    const prov = (await web3auth.connect()) as IProvider;
    setProvider(prov);
    const address = await getAddress(prov);
    setPublicAddress(address);
    await refreshBalance(prov, address);
  }, [web3auth, getAddress, refreshBalance]);

  const logout = useCallback(async () => {
    if (!web3auth) return;
    await web3auth.logout();
    setProvider(null);
    setPublicAddress(null);
    setBalance(null);
  }, [web3auth]);

  const contextValue = useMemo<Web3AuthContextType>(() => ({
    isReady,
    provider,
    publicAddress,
    balance,
    login,
    logout,
  }), [isReady, provider, publicAddress, balance, login, logout]);

  return (
    <Web3AuthContext.Provider value={contextValue}>
      {children}
    </Web3AuthContext.Provider>
  );
}


