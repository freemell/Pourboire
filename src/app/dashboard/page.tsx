'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';

// Dynamically import WalletMultiButton to prevent hydration issues
const DynamicWalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(m => m.WalletMultiButton),
  { ssr: false }
);

type HistoryItem = {
  type: 'tip' | 'transfer';
  amount: number;
  token: 'SOL' | 'USDC';
  counterparty: string;
  txHash: string;
  date: string | Date;
};

export default function Dashboard() {
  const { user, login, logout } = usePrivy();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'auto-pay' | 'settings'>('overview');
  const [userData, setUserData] = useState<any>(null);
  const [pendingTips, setPendingTips] = useState<any[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [tipAddress, setTipAddress] = useState<string | null>(null);
  const [showFund, setShowFund] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fundAmount, setFundAmount] = useState<string>("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawAddress, setWithdrawAddress] = useState<string>("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [solPrice, setSolPrice] = useState<number>(150); // Default to $150 if fetch fails
  const { publicKey, signTransaction, sendTransaction, connected } = useWallet();
  const rpcEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

  // Fetch SOL price from CoinGecko
  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        if (data?.solana?.usd) {
          setSolPrice(data.solana.usd);
        }
      } catch (error) {
        console.error('Failed to fetch SOL price, using default:', error);
        // Keep default price
      }
    };
    fetchSolPrice();
    // Refresh price every 5 minutes
    const interval = setInterval(fetchSolPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getSolanaAddress = (u: any): string | null => {
    if (!u) return null;
    // Prefer primary wallet if it’s Solana
    const primary = (u as any).wallet;
    if (primary?.address && (primary as any).chainType === 'solana') return primary.address;
    // Search linked accounts for a Solana wallet
    const linked = (u as any).linkedAccounts || [];
    const sol = linked.find((a: any) => a.type === 'wallet' && a.chainType === 'solana');
    if (sol?.address) return sol.address;
    return null;
  };

  const formatAddress = (addr?: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  // Client-side rendering check
  useEffect(() => { setIsClient(true); }, []);

  const ensureTipAccount = async (handle: string) => {
    try {
      const res = await fetch('/api/wallet/ensure-tip-account', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handle })
      });
      if (!res.ok) {
        console.error('ensure-tip-account failed', await res.text());
        const fallback = getSolanaAddress(user);
        if (fallback) {
          setTipAddress(fallback);
          await fetchWalletBalance(fallback);
          await fetchPendingAndHistory(fallback);
        }
        return;
      }
      const data = await res.json();
      if (data?.walletAddress) {
        setTipAddress(data.walletAddress);
        await fetchWalletBalance(data.walletAddress);
        await fetchPendingAndHistory(data.walletAddress);
      }
    } catch (e) {
      console.error('ensure-tip-account error', e);
      const fallback = getSolanaAddress(user);
      if (fallback) {
        setTipAddress(fallback);
        await fetchWalletBalance(fallback);
        await fetchPendingAndHistory(fallback);
      }
    }
  };

  // Fetch balance from embedded/custodial wallet
  useEffect(() => {
    if (!user) {
      setTipAddress(null);
      setBalance(0);
      setLoading(false);
      setPendingTips([]);
      setHistory([]);
      return;
    }
    const handle = userData?.handle;
    if (handle) {
      ensureTipAccount(handle);
    }
  }, [user?.wallet?.address, userData?.handle]);

  // Handle user profile from Privy linked accounts
  useEffect(() => {
    if (user) {
      const twitterAccount = user.linkedAccounts.find((a: any) => a.type === 'twitter_oauth') as any;
      const emailAccount = user.linkedAccounts.find((a: any) => a.type === 'email') as any;
      if (twitterAccount) {
        const handle = twitterAccount?.username ? `@${twitterAccount.username}` : '';
        const name = twitterAccount?.name || handle || 'User';
        const profileImage = twitterAccount?.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B82F6&color=fff`;
        setUserData({
          id: user.id,
          handle,
          name,
          profileImage,
          bio: '',
          walletAddress: getSolanaAddress(user) || '',
          isEmbedded: true,
        });
      } else if (emailAccount) {
        const name = emailAccount.address.split('@')[0];
        setUserData({
          id: user.id,
          handle: emailAccount.address,
          name,
          profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B82F6&color=fff`,
          bio: 'Connected via email',
          walletAddress: getSolanaAddress(user) || '',
          isEmbedded: true,
        });
      }
    } else {
      setUserData(null);
    }
  }, [user]);

  // Fetch real wallet balance
  const fetchWalletBalance = async (walletAddress: string) => {
    try {
      const response = await fetch(`/api/wallet/balance?address=${walletAddress}`);
      const data = await response.json();
      if (data.success) setBalance(data.sol.amount);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const fetchPendingAndHistory = async (walletAddress: string) => {
    try {
      const res = await fetch(`/api/tips/pending?walletAddress=${walletAddress}`);
      const data = await res.json();
      if (data.success) {
        setPendingTips((data.pending || []).map((p: any) => ({
          id: p._id || p.id,
          amount: p.amount,
          token: p.token,
          sender: p.sender,
          tweetId: p.fromTx,
          timestamp: new Date(),
          status: 'pending'
        })));
        setHistory((data.history || []).map((h: any) => ({ ...h })));
        setDbUserId(data.user?.id || null);
      }
    } catch (e) {
      console.error('Failed to fetch pending/history', e);
    }
  };

  const claimTip = async (tipId: string) => {
    try {
      if (!dbUserId) {
        console.error('Claim failed: User ID not found');
        return;
      }
      const res = await fetch('/api/tips/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: dbUserId, tipId })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Claim failed:', data.error || 'Unknown error');
        return;
      }
      if (data.success) {
        setPendingTips(prev => prev.filter(t => (t.id || t._id) !== tipId));
        // refresh history after claim
        const addr = getSolanaAddress(user);
        if (addr) fetchPendingAndHistory(addr);
      }
    } catch (e: any) {
      console.error('Claim failed', e);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatAmount = (amount: number, token: string) => {
    return `${amount} ${token}`;
  };

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/20 rounded-full blur-2xl"></div>
        </div>
        <div className="relative z-10 min-h-screen text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70 font-light">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient similar to hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen text-white">
        {/* Header */}
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-extralight tracking-tight">Pourboire Dashboard</h1>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-light">
                Live
              </span>
              <a href="https://x.com/Pourboireonsol" target="_blank" rel="noreferrer" className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-light hover:bg-blue-500/30">
                Follow on X
              </a>
              {userData && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-light">
                  {userData.handle}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-green-400">
                    <span className="text-sm font-light">✓ X Connected</span>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-xl transition-colors font-light tracking-tight"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => login()}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-xl transition-colors font-light tracking-tight"
                >
                  Connect Account
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {!user ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-3xl">🔗</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Connect your account</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">
              Connect your account to start sending and receiving tips. Twitter login preferred, but email works too.
            </p>
            <button
              onClick={() => login()}
              className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-8 rounded-xl transition-colors text-lg font-light tracking-tight"
            >
              Connect Account
            </button>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            {userData && (
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10 rounded-2xl p-8 mb-8 backdrop-blur-sm">
                <div className="flex items-center space-x-6">
                  <img
                    src={userData.profileImage}
                    alt={userData.name}
                    className="w-20 h-20 rounded-full border-2 border-white/20"
                  />
                  <div className="flex-1">
                    <h2 className="text-3xl font-extralight tracking-tight mb-2">{userData.name}</h2>
                    <p className="text-blue-300 text-lg font-light mb-2">{userData.handle}</p>
                    {userData.bio && (
                      <p className="text-white/70 text-sm font-light leading-relaxed">{userData.bio}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-light text-white/70 mb-1 tracking-tight">Tip Wallet Address</div>
                    <button
                      onClick={() => {
                        const addr = getSolanaAddress(user);
                        if (addr) { navigator.clipboard.writeText(addr); setCopied(true); setTimeout(()=>setCopied(false),1000); }
                      }}
                      className="font-mono text-sm font-light rounded px-2 py-1 hover:bg-white/5 transition"
                      title="Copy"
                    >
                      {getSolanaAddress(user) ? formatAddress(getSolanaAddress(user)) : 'Creating wallet...'}
                    </button>
                    <div className="text-xs text-green-400 mt-1 font-light">
                      ✓ Auto-created for tips
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10 rounded-2xl p-8 mb-8 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extralight tracking-tight mb-2">Tip Account Balance</h2>
                  <div className="text-4xl font-extralight tracking-tight">
                    {loading ? '...' : `${balance.toFixed(4)} SOL`}
                  </div>
                  <p className="text-white/70 mt-2 font-light">
                    ≈ ${(balance * solPrice).toFixed(2)} USD
                  </p>
                  <p className="text-xs text-white/50 mt-1 font-light">
                    Auto-created wallet for receiving tips
                  </p>
                </div>
                <div className="text-right">
                  <button 
                    onClick={async () => { setShowFund(true); if (userData?.handle) { try { await ensureTipAccount(userData.handle); } catch (e) { console.error('ensureTipAccount failed', e); } } }}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-xl transition-colors font-light tracking-tight"
                  >
                    Fund Account
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-8 bg-white/5 rounded-xl p-1 backdrop-blur-sm">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'transactions', label: 'Transactions' },
                { id: 'auto-pay', label: 'Auto-Pay' },
                { id: 'settings', label: 'Settings' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 rounded-lg font-light tracking-tight transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Pending Tips Alert */}
                {pendingTips.length > 0 && (
                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">💰</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-extralight tracking-tight text-yellow-400">Pending Tips</h3>
                          <p className="text-yellow-300/70 font-light">You have {pendingTips.length} tips waiting to be claimed</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('transactions')}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors font-light tracking-tight"
                      >
                        View All
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-extralight tracking-tight mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={() => {
                          // This will open a wallet connection modal for sending tips
                          console.error('Connect your wallet to send tips');
                        }}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors font-light tracking-tight"
                      >
                        Send Tip
                      </button>
                      <button className="w-full border border-white/20 hover:bg-white/10 text-white py-3 px-4 rounded-lg transition-colors font-light tracking-tight">
                        Set Auto-Pay Rule
                      </button>
                      <button className="w-full border border-white/20 hover:bg-white/10 text-white py-3 px-4 rounded-lg transition-colors font-light tracking-tight">
                        View Giveaways
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-extralight tracking-tight mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {history.slice(0, 3).map((tx, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              tx.type === 'transfer' ? 'bg-red-500' : 'bg-green-500'
                            }`} />
                            <span className="text-sm font-light">
                              {tx.type === 'transfer' ? 'Sent' : 'Received'} {formatAmount(tx.amount, tx.token)}
                            </span>
                          </div>
                          <span className="text-xs text-white/60 font-light">
                            {formatDate(new Date(tx.date))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-extralight tracking-tight mb-4">Auto-Pay Rules</h3>
                    <div className="space-y-3">
                      <div className="text-sm text-white/60 font-light">No rules yet</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-6">
                {/* Pending Tips Section */}
                {pendingTips.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                      <h3 className="text-lg font-semibold text-yellow-400">Pending Tips to Claim</h3>
                      <p className="text-sm text-white/70 mt-1">Tips sent to you on X that need to be claimed</p>
                    </div>
                    <div className="divide-y divide-white/10">
                      {pendingTips.map((tip) => (
                        <div key={tip.id} className="p-6 hover:bg-white/5 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                <span className="text-lg">💰</span>
                              </div>
                              <div>
                                <div className="font-medium">
                                  Received from {tip.sender}
                                </div>
                                <div className="text-sm text-white/60">
                                  {formatDate(tip.timestamp)} • Tweet #{tip.tweetId}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="font-medium text-yellow-400">
                                  +{formatAmount(tip.amount, tip.token)}
                                </div>
                                <div className="text-sm text-white/60 capitalize">
                                  {tip.status}
                                </div>
                              </div>
                              <button
                                onClick={() => claimTip(tip.id)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors"
                              >
                                Claim
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transaction History */}
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                  <div className="p-6 border-b border-white/10">
                    <h3 className="text-lg font-extralight tracking-tight">Transaction History</h3>
                  </div>
                  <div className="divide-y divide-white/10">
                    {history.map((tx, idx) => (
                      <div key={idx} className="p-6 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.type === 'transfer' ? 'bg-red-500/20' : 'bg-green-500/20'
                            }`}>
                              <span className="text-lg">
                                {tx.type === 'transfer' ? '↗️' : '↙️'}
                              </span>
                            </div>
                            <div>
                              <div className="font-light">
                                {tx.type === 'transfer' ? 'Sent to' : 'Received from'} {tx.counterparty}
                              </div>
                              <div className="text-sm text-white/60 font-light">
                                {formatDate(new Date(tx.date))} • 
                                <a 
                                  href={`https://solscan.io/tx/${tx.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 ml-1"
                                >
                                  {tx.txHash}
                                </a>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-light ${
                              tx.type === 'transfer' ? 'text-red-400' : 'text-green-400'
                            }`}>
                              {tx.type === 'transfer' ? '-' : '+'}{formatAmount(tx.amount, tx.token)}
                            </div>
                            <div className="text-sm text-white/60 capitalize font-light">
                              {tx.type}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'auto-pay' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-extralight tracking-tight">Auto-Pay Rules</h3>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors font-light tracking-tight">
                    Create Rule
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <div className="text-white/60 text-sm">No rules yet</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-extralight tracking-tight">Settings</h3>
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <h4 className="font-light mb-4">X (Twitter) Integration</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-light">
                          {user ? 'Account Connected' : 'Connect Account'}
                        </div>
                        <div className="text-sm text-white/70 font-light">
                          {user ? 
                            `Connected: ${userData?.handle} - Tip wallet auto-created` :
                            'Link your X account to get started'
                          }
                        </div>
                      </div>
                      {user ? (
                        <div className="flex items-center space-x-2 text-green-400">
                          <span className="text-sm">✓ Connected</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => login()}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <h4 className="font-light mb-4">Wallet Tools</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowWithdraw(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors font-light tracking-tight w-full"
                    >
                      Withdraw SOL from Tip Wallet
                    </button>
                    <div className="text-xs text-white/60 mb-3">
                      Transfer SOL from your tip wallet to another address
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          if (!userData?.handle) return;
                          const res = await fetch('/api/wallet/export', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ handle: userData.handle })
                          });
                          const data = await res.json();
                          if (!res.ok || !data.success) {
                            console.error('Export failed:', data.error || 'Unknown error');
                            return;
                          }
                          const blob = new Blob([
                            JSON.stringify({
                              address: data.walletAddress,
                              privateKeyHex: data.privateKeyHex,
                              note: 'Keep this file secret. Anyone with this key can spend your funds.'
                            }, null, 2)
                          ], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'pourboire-wallet-export.json';
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (e) {
                          console.error('export error', e);
                        }
                      }}
                      className="bg-red-500/90 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors font-light tracking-tight w-full"
                    >
                      Export Custodial Wallet (Dev only)
                    </button>
                    <div className="text-xs text-white/60">Only available in development and for custodial wallets.</div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <h4 className="font-light mb-4">Notification Preferences</h4>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="w-4 h-4 text-blue-500 rounded" defaultChecked />
                      <span className="font-light">Email notifications for received tips</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="w-4 h-4 text-blue-500 rounded" defaultChecked />
                      <span className="font-light">Push notifications for auto-pay triggers</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="w-4 h-4 text-blue-500 rounded" />
                      <span className="font-light">Weekly summary emails</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </div>
      {showFund && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-md text-white">
            <h3 className="text-xl font-extralight mb-2">Fund Tip Account</h3>
            <p className="text-white/70 text-sm mb-4">Send SOL to your deposit address. This funds your tipping account.</p>
            <button
              onClick={() => { if (tipAddress) { navigator.clipboard.writeText(tipAddress); setCopied(true); setTimeout(()=>setCopied(false),1000); }}}
              className="bg-black/50 rounded-xl px-4 py-3 font-mono text-sm w-full text-left hover:bg-black/60 transition"
              title="Copy"
            >
              {tipAddress ? formatAddress(tipAddress) : '...'}
            </button>
            <div className="mt-4 flex items-center gap-3">
              {tipAddress && (
                <a href={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('solana:'+tipAddress)}`} target="_blank" rel="noreferrer" className="px-3 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition">QR</a>
              )}
              <div className="flex-1" />
              <button onClick={() => setShowFund(false)} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg">Close</button>
            </div>
            <div className="mt-4">
              <label className="text-sm text-white/70">Amount (SOL)</label>
              <input value={fundAmount} onChange={(e)=>setFundAmount(e.target.value)} placeholder="e.g. 0.5" className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 outline-none" />
              {tipAddress && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DynamicWalletMultiButton className="w-full !bg-purple-600 hover:!bg-purple-700 !text-white !rounded-lg !h-11" />
                  <button
                    onClick={async () => {
                      if (!publicKey || !sendTransaction || !tipAddress) return;
                      try {
                        const conn = new Connection(rpcEndpoint);
                        const amountLamports = Math.floor((Number(fundAmount)||0) * LAMPORTS_PER_SOL);

                        const sendOnce = async (): Promise<string> => {
                          const tx = new Transaction({ feePayer: publicKey }).add(
                            SystemProgram.transfer({
                              fromPubkey: publicKey,
                              toPubkey: new PublicKey(tipAddress),
                              lamports: amountLamports
                            })
                          );
                          return await sendTransaction(tx, conn, { preflightCommitment: 'confirmed', maxRetries: 3 });
                        };

                        const waitFor = async (sig: string): Promise<boolean> => {
                          const start = Date.now();
                          while (Date.now() - start < 60000) {
                            const st = await (conn as any).getSignatureStatuses([sig], { searchTransactionHistory: true });
                            const v = st?.value?.[0];
                            if (v?.err) {
                              throw new Error('Transaction failed');
                            }
                            if (v?.confirmationStatus === 'confirmed' || v?.confirmationStatus === 'finalized') return true;
                            await new Promise(r => setTimeout(r, 1500));
                          }
                          return false;
                        };

                        // First attempt
                        let sig = await sendOnce();
                        let ok = await waitFor(sig);

                        // One automatic retry if not confirmed in time
                        if (!ok) {
                          sig = await sendOnce();
                          ok = await waitFor(sig);
                        }

                        if (!ok) throw new Error(`Timeout waiting for confirmation. Signature: ${sig}`);

                        await fetchWalletBalance(tipAddress);
                        setShowFund(false);
                      } catch (e: any) {
                        const msg = e?.message || String(e);
                        if (msg.includes('403') || msg.toLowerCase().includes('forbidden')) {
                          console.error('RPC blocked request (403). Set NEXT_PUBLIC_SOLANA_RPC_URL to a provider RPC with an API key (e.g. Helius, QuickNode, Triton) and reload.');
                        }
                        if (msg.toLowerCase().includes('debit') || msg.toLowerCase().includes('insufficient')) {
                          console.error('Insufficient funds: Connected wallet needs sufficient SOL to cover network fee and amount.');
                        }
                        console.error('Transfer failed:', msg);
                        if (typeof (e as any)?.getLogs === 'function') {
                          try { console.error('transaction logs', await (e as any).getLogs()); } catch {}
                        }
                        console.error('transfer error', e);
                      }
                    }}
                    className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50"
                    disabled={!connected || !fundAmount}
                  >
                    Transfer to Tip Wallet
                  </button>
                  <a
                    href={`https://phantom.app/ul/transfer?recipient=${encodeURIComponent(tipAddress)}&amount=${encodeURIComponent(fundAmount || '')}&label=Pourboire&message=Fund%20tip%20account`}
                    target="_blank" rel="noreferrer"
                    className="w-full px-3 py-2 border border-white/20 hover:bg-white/10 rounded-lg inline-flex items-center justify-center"
                  >
                    Open Wallet (Deep Link)
                  </a>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-md text-white">
            <h3 className="text-xl font-extralight mb-2">Withdraw SOL from Tip Wallet</h3>
            <p className="text-white/70 text-sm mb-4">
              Transfer SOL from your custodial tip wallet to another address
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/70 mb-1 block">Amount (SOL)</label>
                <input
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 0.5"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 outline-none"
                  disabled={withdrawing}
                />
              </div>
              
              <div>
                <label className="text-sm text-white/70 mb-1 block">Recipient Address</label>
                <input
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="Enter Solana address"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 outline-none font-mono text-sm"
                  disabled={withdrawing}
                />
                {connected && publicKey && (
                  <button
                    onClick={() => setWithdrawAddress(publicKey.toString())}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                    disabled={withdrawing}
                  >
                    Use Connected Wallet
                  </button>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowWithdraw(false);
                    setWithdrawAmount("");
                    setWithdrawAddress("");
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  disabled={withdrawing}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!userData?.handle || !withdrawAmount || !withdrawAddress) {
                      console.error('Withdraw: Missing required fields');
                      return;
                    }
                    
                    setWithdrawing(true);
                    try {
                      const res = await fetch('/api/wallet/withdraw', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          handle: userData.handle,
                          amount: withdrawAmount,
                          toAddress: withdrawAddress
                        })
                      });
                      
                      const data = await res.json();
                      
                      if (!res.ok) {
                        const errorMsg = data.details || data.error || 'Withdrawal failed';
                        console.error('Withdraw failed:', errorMsg);
                        return;
                      }
                      
                      console.log(`Withdrawal successful! Tx: ${data.txHash}\n\nView on Solscan: ${data.solscanUrl}`);
                      
                      // Refresh balance and history
                      if (tipAddress) {
                        await fetchWalletBalance(tipAddress);
                        await fetchPendingAndHistory(tipAddress);
                      }
                      
                      setShowWithdraw(false);
                      setWithdrawAmount("");
                      setWithdrawAddress("");
                    } catch (e: any) {
                      console.error('withdraw error', e);
                    } finally {
                      setWithdrawing(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
                  disabled={withdrawing || !withdrawAmount || !withdrawAddress}
                >
                  {withdrawing ? 'Processing...' : 'Withdraw'}
                </button>
              </div>
              
              {tipAddress && (
                <div className="mt-4 p-3 bg-black/40 rounded-lg">
                  <div className="text-xs text-white/70 mb-1">Tip Wallet Balance</div>
                  <div className="text-sm font-mono">{balance.toFixed(4)} SOL</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}