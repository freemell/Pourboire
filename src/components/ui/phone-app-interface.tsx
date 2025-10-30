'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface PhoneAppInterfaceProps {
  currentStep: string;
  isVisible: boolean;
}

export default function PhoneAppInterface({ currentStep, isVisible }: PhoneAppInterfaceProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Show notification for confirmation step
  useEffect(() => {
    if (currentStep === 'confirmation') {
      setTimeout(() => setShowNotification(true), 1000);
    } else {
      setShowNotification(false);
    }
  }, [currentStep]);

  // Animate overlay based on current step
  useGSAP(() => {
    if (!overlayRef.current) return;

    if (isVisible) {
      gsap.fromTo(overlayRef.current, 
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
      );
    } else {
      gsap.to(overlayRef.current, { opacity: 0, scale: 0.8, duration: 0.3 });
    }
  }, [isVisible]);

  const renderHomeScreen = () => (
    <div className="h-full bg-gradient-to-b from-blue-900 to-black text-white">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-2 text-xs">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-2 bg-white rounded-sm"></div>
          <span>100%</span>
        </div>
      </div>

      {/* Pourboire Header */}
      <div className="text-center py-6 px-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💎</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Pourboire</h1>
        <p className="text-blue-300 text-sm">Tip anyone on X with Solana</p>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mb-6">
        <div className="bg-white/10 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">2.5 SOL</div>
              <div className="text-xs text-white/70">Balance</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">12</div>
              <div className="text-xs text-white/70">Tips Sent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Features */}
      <div className="px-4 space-y-3">
        <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-medium text-sm">
          Send Tip
        </button>
        <button className="w-full bg-white/10 text-white py-3 rounded-xl font-medium text-sm">
          Auto-Pay Rules
        </button>
        <button className="w-full bg-white/10 text-white py-3 rounded-xl font-medium text-sm">
          View History
        </button>
      </div>

      {/* Recent Activity */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-semibold mb-3 text-white/80">Recent Activity</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-400 text-sm">+</span>
              </div>
              <div>
                <div className="text-white text-sm">Received 0.5 SOL</div>
                <div className="text-white/60 text-xs">from @alice</div>
              </div>
            </div>
            <div className="text-green-400 text-xs">2m ago</div>
          </div>
          
          <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-red-400 text-sm">-</span>
              </div>
              <div>
                <div className="text-white text-sm">Sent 1.2 SOL</div>
                <div className="text-white/60 text-xs">to @bob</div>
              </div>
            </div>
            <div className="text-white/60 text-xs">1h ago</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTutorialStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="h-full bg-gradient-to-b from-blue-900 to-black text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-2xl">💎</span>
            </div>
            <h2 className="text-xl font-bold mb-3">Welcome to Pourboire</h2>
            <p className="text-blue-300 mb-4 leading-relaxed text-sm">
              Send instant SOL tips to anyone on X with just a mention.
            </p>
            <div className="space-y-2 w-full">
              <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 rounded-lg font-medium text-sm">
                Start Tutorial
              </button>
              <button className="w-full bg-white/10 text-white py-2 rounded-lg font-medium text-sm">
                Learn More
              </button>
            </div>
          </div>
        );

      case 'open-x':
        return (
          <div className="h-full bg-black text-white">
            {/* X App Interface */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">X</span>
                </div>
                <span className="font-semibold">X</span>
              </div>
              <div className="w-6 h-6 bg-white/20 rounded"></div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-400 rounded-full"></div>
                  <div>
                    <div className="text-white font-medium">@crypto_enthusiast</div>
                    <div className="text-white/60 text-sm">2h ago</div>
                  </div>
                </div>
                <div className="text-white mb-3">
                  Just discovered this amazing project! The potential is incredible 🚀
                  #Solana #DeFi #Innovation
                </div>
                <div className="flex items-center gap-6 text-white/60 text-sm">
                  <span>💬 12</span>
                  <span>🔄 8</span>
                  <span>❤️ 45</span>
                  <span>📤</span>
                </div>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-400 rounded-full"></div>
                  <div>
                    <div className="text-white font-medium">@solana_dev</div>
                    <div className="text-white/60 text-sm">4h ago</div>
                  </div>
                </div>
                <div className="text-white mb-3">
                  Building the future of finance, one transaction at a time ⚡
                </div>
                <div className="flex items-center gap-6 text-white/60 text-sm">
                  <span>💬 24</span>
                  <span>🔄 15</span>
                  <span>❤️ 89</span>
                  <span>📤</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'compose-reply':
        return (
          <div className="h-full bg-black text-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">X</span>
                </div>
                <span className="font-semibold">Reply</span>
              </div>
              <button className="text-blue-400 font-medium">Cancel</button>
            </div>
            
            <div className="p-4">
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
                  <div>
                    <div className="text-white font-medium">@crypto_enthusiast</div>
                    <div className="text-white/60 text-sm">2h ago</div>
                  </div>
                </div>
                <div className="text-white text-sm">
                  Just discovered this amazing project! The potential is incredible 🚀
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/20">
                <div className="text-white/50 text-sm mb-2">Add a reply...</div>
                <div className="h-20"></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <span>0/280</span>
                </div>
                <button className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-medium">
                  Reply
                </button>
              </div>
            </div>
          </div>
        );

      case 'type-command':
        return (
          <div className="h-full bg-black text-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">X</span>
                </div>
                <span className="font-semibold">Reply</span>
              </div>
              <button className="text-blue-400 font-medium">Cancel</button>
            </div>
            
            <div className="p-4">
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
                  <div>
                    <div className="text-white font-medium">@crypto_enthusiast</div>
                    <div className="text-white/60 text-sm">2h ago</div>
                  </div>
                </div>
                <div className="text-white text-sm">
                  Just discovered this amazing project! The potential is incredible 🚀
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30">
                <div className="text-blue-300 text-sm font-mono">@pourboireonsol tip 0.5 SOL</div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <span>18/280</span>
                </div>
                <button className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-medium">
                  Reply
                </button>
              </div>
            </div>
          </div>
        );

      case 'send-tip':
        return (
          <div className="h-full bg-black text-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">X</span>
                </div>
                <span className="font-semibold">Reply</span>
              </div>
              <button className="text-blue-400 font-medium">Cancel</button>
            </div>
            
            <div className="p-4">
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
                  <div>
                    <div className="text-white font-medium">@crypto_enthusiast</div>
                    <div className="text-white/60 text-sm">2h ago</div>
                  </div>
                </div>
                <div className="text-white text-sm">
                  Just discovered this amazing project! The potential is incredible 🚀
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30 mb-4">
                <div className="text-blue-300 text-sm font-mono">@pourboireonsol tip 0.5 SOL</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <span>18/280</span>
                </div>
                <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-medium animate-pulse">
                  Send Tip
                </button>
              </div>
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="h-full bg-black text-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">X</span>
                </div>
                <span className="font-semibold">X</span>
              </div>
              <div className="w-6 h-6 bg-white/20 rounded"></div>
            </div>
            
            <div className="p-4">
              <div className="bg-green-500/20 rounded-xl p-6 border border-green-500/30 text-center mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">✓</span>
                </div>
                <h3 className="text-green-400 font-bold text-lg mb-2">Tip Sent Successfully!</h3>
                <p className="text-green-300/80 text-sm mb-3">0.5 SOL sent to @crypto_enthusiast</p>
                <p className="text-green-300/60 text-xs font-mono">Transaction: 3x7k...9m2p</p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Amount</span>
                    <span className="text-white font-medium">0.5 SOL</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Network Fee</span>
                    <span className="text-white font-medium">0.000005 SOL</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Status</span>
                    <span className="text-green-400 font-medium">Confirmed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="h-full bg-gradient-to-b from-blue-900 to-black text-white overflow-y-auto">
            <div className="p-4">
              <h2 className="text-xl font-bold mb-6 text-center">Pourboire Features</h2>
              
              <div className="space-y-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <span className="text-xl">⚡</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Instant Tips</h3>
                      <p className="text-white/70 text-sm">Send SOL or USDC instantly</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🤖</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Auto-Pay</h3>
                      <p className="text-white/70 text-sm">Set up automatic tipping rules</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🔒</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Zero Fees</h3>
                      <p className="text-white/70 text-sm">Only pay Solana network fees</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <span className="text-xl">💳</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">x402 Integration</h3>
                      <p className="text-white/70 text-sm">Instant micropayments</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🎯</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Smart Giveaways</h3>
                      <p className="text-white/70 text-sm">Pick random winners automatically</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🔐</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Custodial Wallets</h3>
                      <p className="text-white/70 text-sm">Auto-create wallets for recipients</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'how-it-works':
        return (
          <div className="h-full bg-gradient-to-b from-gray-900 to-black text-white overflow-y-auto">
            <div className="p-4">
              <h2 className="text-xl font-bold mb-6 text-center">How It Works</h2>
              
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold">01</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Login with X (Web3Auth)</h3>
                  <p className="text-white/70 text-sm">Tap “Connect Account” and choose Twitter</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold">02</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Reply with @Pourboire</h3>
                  <p className="text-white/70 text-sm">Type "@Pourboire tip 0.5 SOL" in any X post</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold">03</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Instant Payment</h3>
                  <p className="text-white/70 text-sm">Our bot processes and sends SOL instantly</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold">04</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Set Auto-Pay</h3>
                  <p className="text-white/70 text-sm">Configure automatic tipping rules</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return renderHomeScreen();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 flex flex-col"
      style={{ 
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        borderRadius: '20px',
        overflow: 'hidden',
        background: 'transparent'
      }}
    >
      {renderTutorialStep()}
      
      {/* Notification for confirmation */}
      {showNotification && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-bounce">
          Tip sent!
        </div>
      )}
    </div>
  );
}
