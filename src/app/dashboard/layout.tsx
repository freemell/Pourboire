'use client';

import { WalletProvider } from '@/components/providers/wallet-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/@solana/wallet-adapter-react-ui@latest/styles.css"
      />
      <WalletProvider>
        {children}
      </WalletProvider>
    </>
  );
}

