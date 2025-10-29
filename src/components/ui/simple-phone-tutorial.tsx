'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action: string;
  highlight?: string;
  duration?: number;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Pourboire',
    description: 'Send instant SOL tips to anyone on X with just a mention',
    action: 'Tap to continue',
    duration: 3000
  },
  {
    id: 'open-x',
    title: 'Open X (Twitter)',
    description: 'Find any post you want to tip on',
    action: 'Tap the X app',
    highlight: 'x-app'
  },
  {
    id: 'compose-reply',
    title: 'Compose Reply',
    description: 'Tap the reply button to start typing',
    action: 'Tap reply',
    highlight: 'reply-button'
  },
  {
    id: 'type-command',
    title: 'Type @Pourboire Command',
    description: 'Type "@Pourboire tip 0.5 SOL" to send a tip',
    action: 'Type the command',
    highlight: 'text-input'
  },
  {
    id: 'send-tip',
    title: 'Send Your Tip',
    description: 'Tap send and watch the magic happen!',
    action: 'Tap send',
    highlight: 'send-button'
  },
  {
    id: 'confirmation',
    title: 'Tip Sent!',
    description: 'The recipient gets notified and can claim their SOL',
    action: 'View transaction',
    highlight: 'confirmation'
  },
  {
    id: 'features',
    title: 'Powerful Features',
    description: 'Everything you need to tip, donate, and reward on X',
    action: 'Explore features',
    duration: 5000
  },
  {
    id: 'how-it-works',
    title: 'How It Works',
    description: 'Get started in minutes with our simple 4-step process',
    action: 'Learn more',
    duration: 5000
  }
];

export default function SimplePhoneTutorial() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const phoneRef = useRef<HTMLDivElement | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Start the interactive tutorial
  const startTutorial = () => {
    setIsPlaying(true);
    setCurrentStep(0);
  };

  // Handle step navigation
  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsPlaying(false); // End of tutorial
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const restartTutorial = () => {
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // Effect to update progress
  useEffect(() => {
    setProgress(((currentStep + 1) / tutorialSteps.length) * 100);
  }, [currentStep]);

  // Auto-play functionality
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentStep < tutorialSteps.length - 1) {
      timer = setTimeout(() => {
        nextStep();
      }, tutorialSteps[currentStep].duration || 3000);
    } else if (isPlaying && currentStep === tutorialSteps.length - 1) {
      // If it's the last step and playing, stop playing after a delay
      timer = setTimeout(() => {
        setIsPlaying(false);
      }, tutorialSteps[currentStep].duration || 3000);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      
      gsap.set(sectionRef.current, { autoAlpha: 0, y: 50, scale: 0.95 });
      
      const elements = [titleRef.current, descriptionRef.current, canvasRef.current].filter(Boolean);
      if (elements.length > 0) {
        gsap.set(elements, { autoAlpha: 0, y: 20, scale: 0.98 });
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.to(sectionRef.current, { autoAlpha: 1, y: 0, scale: 1, duration: 1 });
      if (titleRef.current) {
        tl.to(titleRef.current, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.2);
      }
      if (descriptionRef.current) {
        tl.to(descriptionRef.current, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.3);
      }
      if (canvasRef.current) {
        tl.to(canvasRef.current, { autoAlpha: 1, y: 0, duration: 1, scale: 1 }, 0.4);
      }
    },
    { scope: sectionRef }
  );

  const currentStepData = tutorialSteps[currentStep];

  // Render phone screen content based on current step
  const renderPhoneScreenContent = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return (
          <div className="h-full bg-gradient-to-b from-blue-900 to-black text-white flex flex-col items-center justify-center p-4 text-center">
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
            {/* Status Bar */}
            <div className="flex justify-between items-center px-3 py-1 text-xs">
              <span>9:41</span>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-2 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
            
            {/* X App Interface */}
            <div className="flex-1 px-3 py-2">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-bold">X</h1>
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-900 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 bg-gray-600 rounded-full mr-2"></div>
                    <span className="text-sm font-bold">@user1</span>
                  </div>
                  <p className="text-xs text-gray-300">Just posted something amazing! 🚀</p>
                  <div className="flex justify-end mt-2">
                    <button className="text-blue-400 text-xs">Reply</button>
                  </div>
                </div>
                
                <div className="bg-gray-900 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 bg-gray-600 rounded-full mr-2"></div>
                    <span className="text-sm font-bold">@user2</span>
                  </div>
                  <p className="text-xs text-gray-300">Check out my new NFT collection!</p>
                  <div className="flex justify-end mt-2">
                    <button className="text-blue-400 text-xs">Reply</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'compose-reply':
        return (
          <div className="h-full bg-black text-white">
            {/* Status Bar */}
            <div className="flex justify-between items-center px-3 py-1 text-xs">
              <span>9:41</span>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-2 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
            
            {/* Reply Interface */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center p-3 border-b border-gray-800">
                <button className="text-blue-400 mr-2 text-sm">Cancel</button>
                <span className="flex-grow text-center text-lg font-bold">Reply</span>
                <button className="text-blue-400 opacity-50 text-sm">Tweet</button>
              </div>
              
              <div className="flex-1 p-3">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-gray-700 rounded-full mr-2"></div>
                  <textarea
                    className="flex-grow bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none text-xs"
                    placeholder="Post your reply"
                    rows={4}
                    value="@username "
                    readOnly
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        );

      case 'type-command':
        return (
          <div className="h-full bg-black text-white">
            {/* Status Bar */}
            <div className="flex justify-between items-center px-3 py-1 text-xs">
              <span>9:41</span>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-2 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
            
            {/* Reply Interface with Command */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center p-3 border-b border-gray-800">
                <button className="text-blue-400 mr-2 text-sm">Cancel</button>
                <span className="flex-grow text-center text-lg font-bold">Reply</span>
                <button className="text-blue-400 text-sm">Tweet</button>
              </div>
              
              <div className="flex-1 p-3">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-gray-700 rounded-full mr-2"></div>
                  <textarea
                    className="flex-grow bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none text-xs"
                    placeholder="Post your reply"
                    rows={4}
                    value="@username Just posted something amazing! 🚀 @Pourboire tip 0.5 SOL"
                    readOnly
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        );

      case 'send-tip':
        return (
          <div className="h-full bg-black text-white">
            {/* Status Bar */}
            <div className="flex justify-between items-center px-3 py-1 text-xs">
              <span>9:41</span>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-2 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
            
            {/* Reply Interface with Send Button */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center p-3 border-b border-gray-800">
                <button className="text-blue-400 mr-2 text-sm">Cancel</button>
                <span className="flex-grow text-center text-lg font-bold">Reply</span>
                <button className="text-blue-400 text-sm">Tweet</button>
              </div>
              
              <div className="flex-1 p-3">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-gray-700 rounded-full mr-2"></div>
                  <textarea
                    className="flex-grow bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none text-xs"
                    placeholder="Post your reply"
                    rows={4}
                    value="@username Just posted something amazing! 🚀 @Pourboire tip 0.5 SOL"
                    readOnly
                  ></textarea>
                </div>
              </div>
              
              <div className="p-3 border-t border-gray-800 flex justify-end">
                <button className="bg-blue-500 text-white px-4 py-2 rounded-full text-xs">Send</button>
              </div>
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="h-full bg-gradient-to-b from-green-600 to-emerald-500 text-white flex flex-col items-center justify-center p-4 text-center">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-xl font-bold mb-2">Tip Sent Successfully!</h3>
            <p className="text-sm mb-1">Tx: <span className="underline">0x123...abc</span></p>
            <p className="text-xs mt-2">Check your dashboard for details.</p>
          </div>
        );

      case 'features':
        return (
          <div className="h-full bg-gradient-to-b from-blue-900 to-black text-white p-3 overflow-y-auto">
            <h3 className="text-lg font-bold mb-3 text-center">Powerful Features</h3>
            <div className="space-y-2">
              {[
                { icon: '⚡', title: 'Instant Tips', desc: 'Send SOL instantly' },
                { icon: '🤖', title: 'Auto-Pay', desc: 'Set up automatic rules' },
                { icon: '🔒', title: 'Zero Fees', desc: 'Only network fees' },
                { icon: '💳', title: 'x402 Integration', desc: 'Micropayments' },
                { icon: '🎯', title: 'Smart Giveaways', desc: 'Pick winners automatically' },
                { icon: '🔐', title: 'Custodial Wallets', desc: 'Auto-create for recipients' }
              ].map((feature, index) => (
                <div key={index} className="bg-white/10 p-2 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{feature.icon}</span>
                    <div>
                      <div className="text-sm font-bold">{feature.title}</div>
                      <div className="text-xs text-blue-300">{feature.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'how-it-works':
        return (
          <div className="h-full bg-gradient-to-b from-purple-900 to-black text-white p-3 overflow-y-auto">
            <h3 className="text-lg font-bold mb-3 text-center">How It Works</h3>
            <div className="space-y-3">
              {[
                { step: '01', title: 'Connect Wallet', desc: 'Link your Solana wallet' },
                { step: '02', title: 'Reply with @Pourboire', desc: 'Use simple commands' },
                { step: '03', title: 'Instant Payment', desc: 'Bot processes instantly' },
                { step: '04', title: 'Set Auto-Pay', desc: 'Configure automatic rules' }
              ].map((step, index) => (
                <div key={index} className="bg-white/10 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-bold">{step.step}</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold">{step.title}</div>
                      <div className="text-xs text-purple-300">{step.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section id="tutorial" ref={sectionRef} className="relative py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <div className="text-center mb-16">
          <h2 ref={titleRef} className="text-4xl md:text-5xl font-extralight text-white mb-6">
            Tutorial
          </h2>
          <p ref={descriptionRef} className="text-lg text-white/75 max-w-2xl mx-auto">
            Learn how to send tips on X in seconds
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Simple Phone */}
          <div ref={canvasRef} className="relative h-96 md:h-[600px] flex items-center justify-center">
            <div 
              ref={phoneRef}
              className="relative w-64 h-96 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl border-4 border-gray-700 transform perspective-1000"
              style={{ 
                transformStyle: 'preserve-3d',
                transform: 'rotateY(-15deg) rotateX(5deg)'
              }}
            >
              {/* Screen */}
              <div className="absolute top-4 left-4 right-4 bottom-16 bg-black rounded-2xl overflow-hidden">
                {renderPhoneScreenContent()}
              </div>
              
              {/* Home Button */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gray-600 rounded-full border-2 border-gray-500"></div>
              
              {/* Side Buttons */}
              <div className="absolute right-0 top-16 w-1 h-8 bg-gray-600 rounded-l"></div>
              <div className="absolute right-0 top-28 w-1 h-12 bg-gray-600 rounded-l"></div>
              <div className="absolute right-0 top-44 w-1 h-12 bg-gray-600 rounded-l"></div>
              
              {/* Dynamic Island */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full border border-gray-600"></div>
              
              {/* Floating Elements */}
              <div className="absolute top-10 left-10 w-4 h-4 bg-blue-500 rounded-full animate-pulse opacity-60"></div>
              <div className="absolute top-20 right-10 w-3 h-3 bg-cyan-500 rounded-full animate-pulse delay-1000 opacity-60"></div>
              <div className="absolute bottom-20 left-10 w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-2000 opacity-60"></div>
            </div>
          </div>

          {/* Tutorial Controls */}
          <div className="space-y-8">
            {/* Progress Bar */}
            <div className="space-y-4">
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
            </div>

            {/* Step Content */}
            <div>
              <h3 className="text-3xl font-extralight text-white mb-4">
                {currentStepData.title}
              </h3>
              <p className="text-white/75 text-lg leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep === tutorialSteps.length - 1}
                className="px-6 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Next Step
              </button>
              <button
                onClick={togglePlay}
                className="px-6 py-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={restartTutorial}
                className="px-6 py-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
              >
                Restart
              </button>
            </div>
            <p className="text-sm text-white/50 mt-4">
              {isPlaying ? 'Tutorial is playing automatically' : 'Tutorial is paused'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
