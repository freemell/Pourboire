'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWeb3Auth } from '@/components/providers/web3auth-provider';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import dynamic from 'next/dynamic';

// Dynamically import WalletMultiButton to prevent hydration issues
const DynamicWalletMultiButton = () => null;

type HistoryItem = {
  type: 'tip' | 'transfer';
  amount: number;
  token: 'SOL' | 'USDC';
  counterparty: string;
  txHash: string;
  date: string | Date;
};

export default function Dashboard() {
  const { isReady, publicAddress, login, logout, balance: embeddedBalance } = useWeb3Auth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'auto-pay' | 'settings'>('overview');
  const [userData, setUserData] = useState<any>(null);
  const [pendingTips, setPendingTips] = useState<any[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Client-side rendering check
  useEffect(() => { setIsClient(true); }, []);

  // Fetch balance from Privy embedded wallet
  useEffect(() => {
    if (publicAddress) {
      fetchWalletBalance(publicAddress);
      fetchPendingAndHistory(publicAddress);
    } else {
      setBalance(0);
      setLoading(false);
      setPendingTips([]);
      setHistory([]);
    }
  }, [publicAddress]);

  // Handle Privy user data
  useEffect(() => {
    if (publicAddress) {
      setUserData({
        id: publicAddress,
        handle: publicAddress,
        name: publicAddress.slice(0, 6),
        profileImage: `https://api.dicebear.com/8.x/identicon/svg?seed=${publicAddress}`,
        bio: 'Connected via Web3Auth',
        walletAddress: publicAddress,
        isEmbedded: true
      });
    } else {
      setUserData(null);
    }
  }, [publicAddress]);

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
      if (!dbUserId) return;
      const res = await fetch('/api/tips/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: dbUserId, tipId })
      });
      const data = await res.json();
      if (data.success) {
        setPendingTips(prev => prev.filter(t => (t.id || t._id) !== tipId));
        // refresh history after claim
        if (user?.wallet?.address) fetchPendingAndHistory(user.wallet.address);
      }
    } catch (e) {
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
              {userData && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-light">
                  {userData.handle}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {publicAddress ? (
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
                  onClick={() => login('twitter')}
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
        {!publicAddress ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-3xl">🔗</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Connect your account</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">
              Connect your account to start sending and receiving tips. Twitter login preferred, but email works too.
            </p>
            <button
              onClick={() => login('twitter')}
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
                    <div className="font-mono text-sm font-light">
                      {publicAddress ? 
                        `${publicAddress.slice(0, 8)}...${publicAddress.slice(-8)}` : 
                        'Creating wallet...'
                      }
                    </div>
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
                    ≈ ${(balance * 100).toFixed(2)} USD
                  </p>
                  <p className="text-xs text-white/50 mt-1 font-light">
                    Auto-created wallet for receiving tips
                  </p>
                </div>
                <div className="text-right">
                  <button 
                    onClick={() => {
                      // This will open a wallet connection modal for funding
                      alert('Connect your wallet to fund your tip account');
                    }}
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
                          alert('Connect your wallet to send tips');
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
                  {mockAutoPayRules.map((rule) => (
                    <div key={rule.id} className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-light">{rule.name}</h4>
                        <div className={`px-3 py-1 rounded-full text-sm font-light ${
                          rule.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-white/70 font-light">
                        <div>Condition: {rule.condition}</div>
                        <div>Amount: {formatAmount(rule.amount, rule.token)}</div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors font-light tracking-tight">
                          Edit
                        </button>
                        <button className="flex-1 border border-white/20 hover:bg-white/10 text-white py-2 px-4 rounded-lg transition-colors font-light tracking-tight">
                          {rule.active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  ))}
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
                          {publicAddress ? 'Account Connected' : 'Connect Account'}
                        </div>
                        <div className="text-sm text-white/70 font-light">
                          {publicAddress ? 
                            `Connected: ${userData?.handle} - Tip wallet auto-created` :
                            'Link your X account to get started'
                          }
                        </div>
                      </div>
                      {publicAddress ? (
                        <div className="flex items-center space-x-2 text-green-400">
                          <span className="text-sm">✓ Connected</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => login('twitter')}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                          Connect
                        </button>
                      )}
                    </div>
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
    </div>
  );
}