'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface PhoneScreenOverlayProps {
  currentStep: string;
  isVisible: boolean;
}

export default function PhoneScreenOverlay({ currentStep, isVisible }: PhoneScreenOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [showNotification, setShowNotification] = useState(false);

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💎</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">SolTip</h3>
            <p className="text-white/70 text-sm">Tap to start tutorial</p>
          </div>
        );

      case 'open-x':
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">X</span>
                </div>
                <span className="text-white text-sm font-medium">X</span>
              </div>
              <div className="w-6 h-6 bg-white/20 rounded"></div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                  <div className="text-white text-xs">@username</div>
                </div>
                <div className="text-white/70 text-xs">Just posted something amazing! 🚀</div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                  <div className="text-white text-xs">@crypto_enthusiast</div>
                </div>
                <div className="text-white/70 text-xs">This is incredible! 🔥</div>
              </div>
            </div>
          </div>
        );

      case 'compose-reply':
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">X</span>
                </div>
                <span className="text-white text-sm font-medium">Reply</span>
              </div>
              <div className="w-6 h-6 bg-white/20 rounded"></div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                <div className="text-white text-xs">@username</div>
              </div>
              <div className="text-white/70 text-xs">Just posted something amazing! 🚀</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3 border border-white/20">
              <div className="text-white/50 text-xs">Add a reply...</div>
            </div>
          </div>
        );

      case 'type-command':
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">X</span>
                </div>
                <span className="text-white text-sm font-medium">Reply</span>
              </div>
              <div className="w-6 h-6 bg-white/20 rounded"></div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                <div className="text-white text-xs">@username</div>
              </div>
              <div className="text-white/70 text-xs">Just posted something amazing! 🚀</div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-3 border border-blue-500/30">
              <div className="text-blue-300 text-xs font-mono">@SolTip tip 0.5 SOL</div>
            </div>
          </div>
        );

      case 'send-tip':
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">X</span>
                </div>
                <span className="text-white text-sm font-medium">Reply</span>
              </div>
              <div className="w-6 h-6 bg-white/20 rounded"></div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                <div className="text-white text-xs">@username</div>
              </div>
              <div className="text-white/70 text-xs">Just posted something amazing! 🚀</div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-3 border border-blue-500/30 mb-3">
              <div className="text-blue-300 text-xs font-mono">@SolTip tip 0.5 SOL</div>
            </div>
            
            <div className="flex justify-end">
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-medium">
                Send
              </button>
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">X</span>
                </div>
                <span className="text-white text-sm font-medium">X</span>
              </div>
              <div className="w-6 h-6 bg-white/20 rounded"></div>
            </div>
            
            <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30 text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">✓</span>
              </div>
              <h4 className="text-green-400 font-semibold text-sm mb-1">Tip Sent!</h4>
              <p className="text-green-300/80 text-xs mb-2">0.5 SOL sent to @username</p>
              <p className="text-green-300/60 text-xs">Tx: 3x7k...9m2p</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      style={{ 
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '200px',
        height: '400px',
        borderRadius: '20px',
        overflow: 'hidden'
      }}
    >
      {renderStepContent()}
      
      {/* Notification for confirmation */}
      {showNotification && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-bounce">
          New tip!
        </div>
      )}
    </div>
  );
}



