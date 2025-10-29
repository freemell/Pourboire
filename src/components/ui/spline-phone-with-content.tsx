'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Spline from '@splinetool/react-spline';
import { Application } from '@splinetool/runtime';

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

export default function SplinePhoneWithContent() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const splineRef = useRef<Application | null>(null);
  const phoneScreenRef = useRef<HTMLDivElement | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [splineError, setSplineError] = useState(false);

  // Initialize Spline scene
  const onLoad = (splineApp: Application) => {
    splineRef.current = splineApp;
    setSplineLoaded(true);
    console.log('Spline scene loaded');

    // Set initial camera position
    try {
      splineApp.setVariable('cameraPosition', JSON.stringify({ x: 0, y: 0, z: 5 }));
    } catch (error) {
      console.log('Could not set camera position:', error);
    }

    // Start the tutorial
    setTimeout(() => {
      startTutorial();
    }, 1000);
  };

  // Handle Spline error
  const onError = () => {
    setSplineError(true);
    console.log('Spline failed to load, using fallback');
  };

  // Start the interactive tutorial
  const startTutorial = () => {
    setIsPlaying(true);
    setCurrentStep(0);
  };

  // Update Spline scene for current step
  const updateSplineScene = (step: TutorialStep) => {
    if (!splineRef.current) return;

    // Reset all highlights
    try {
      splineRef.current.setVariable('highlightXApp', 'false');
      splineRef.current.setVariable('highlightReply', 'false');
      splineRef.current.setVariable('highlightText', 'false');
      splineRef.current.setVariable('highlightSend', 'false');
      splineRef.current.setVariable('showConfirmation', 'false');
    } catch (error) {
      console.log('Could not reset Spline variables:', error);
    }

    // Apply step-specific highlights
    try {
      switch (step.highlight) {
        case 'x-app':
          splineRef.current.setVariable('highlightXApp', 'true');
          break;
        case 'reply-button':
          splineRef.current.setVariable('highlightReply', 'true');
          break;
        case 'text-input':
          splineRef.current.setVariable('highlightText', 'true');
          break;
        case 'send-button':
          splineRef.current.setVariable('highlightSend', 'true');
          break;
        case 'confirmation':
          splineRef.current.setVariable('showConfirmation', 'true');
          break;
      }

      // Animate camera for different steps
      const cameraPositions = {
        'welcome': { x: 0, y: 0, z: 5 },
        'open-x': { x: -2, y: 1, z: 4 },
        'compose-reply': { x: 0, y: 0, z: 3 },
        'type-command': { x: 0, y: 0, z: 2.5 },
        'send-tip': { x: 0, y: 0, z: 2.5 },
        'confirmation': { x: 0, y: 0, z: 3 },
        'features': { x: 0, y: 0, z: 4 },
        'how-it-works': { x: 0, y: 0, z: 4 }
      };

      const position = cameraPositions[step.id as keyof typeof cameraPositions] || { x: 0, y: 0, z: 5 };
      splineRef.current.setVariable('cameraPosition', JSON.stringify(position));
    } catch (error) {
      console.log('Could not update Spline variables:', error);
    }
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

  // Effect to update Spline scene when currentStep changes
  useEffect(() => {
    if (splineLoaded && splineRef.current) {
      updateSplineScene(tutorialSteps[currentStep]);
    }
    setProgress(((currentStep + 1) / tutorialSteps.length) * 100);
  }, [currentStep, splineLoaded]);

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
      gsap.set(sectionRef.current, { autoAlpha: 0, y: 50, scale: 0.95 });
      gsap.set([titleRef.current, descriptionRef.current, canvasRef.current], { autoAlpha: 0, y: 20, scale: 0.98 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.to(sectionRef.current, { autoAlpha: 1, y: 0, scale: 1, duration: 1 });
      tl.to(titleRef.current, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.2);
      tl.to(descriptionRef.current, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.3);
      tl.to(canvasRef.current, { autoAlpha: 1, y: 0, duration: 1, scale: 1 }, 0.4);
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
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3">
              <span className="text-lg">💎</span>
            </div>
            <h2 className="text-lg font-bold mb-2">Welcome to Pourboire</h2>
            <p className="text-blue-300 mb-3 leading-relaxed text-xs">
              Send instant SOL tips to anyone on X with just a mention.
            </p>
            <div className="space-y-1 w-full">
              <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-1.5 rounded-lg font-medium text-xs">
                Start Tutorial
              </button>
              <button className="w-full bg-white/10 text-white py-1.5 rounded-lg font-medium text-xs">
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
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-lg font-bold mb-2">Tip Sent Successfully!</h3>
            <p className="text-sm mb-1">Tx: <span className="underline">0x123...abc</span></p>
            <p className="text-xs">Check your dashboard for details.</p>
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

  // Use fallback if Spline fails to load
  if (splineError) {
    return (
      <section ref={sectionRef} className="relative py-24 bg-black">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="text-center mb-16">
            <h2 ref={titleRef} className="text-4xl md:text-5xl font-extralight text-white mb-6">
              Interactive Tutorial
            </h2>
            <p ref={descriptionRef} className="text-lg text-white/75 max-w-2xl mx-auto">
              See how easy it is to send tips on X with our interactive 3D phone demo
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Fallback Phone */}
            <div ref={canvasRef} className="relative h-96 md:h-[600px] flex items-center justify-center">
              <div className="relative w-64 h-96 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl border-4 border-gray-700">
                {/* Screen */}
                <div className="absolute top-4 left-4 right-4 bottom-16 bg-black rounded-2xl overflow-hidden">
                  {renderPhoneScreenContent()}
                </div>
                
                {/* Home Button */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gray-600 rounded-full border-2 border-gray-500"></div>
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

  return (
    <section ref={sectionRef} className="relative py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <div className="text-center mb-16">
          <h2 ref={titleRef} className="text-4xl md:text-5xl font-extralight text-white mb-6">
            Interactive Tutorial
          </h2>
          <p ref={descriptionRef} className="text-lg text-white/75 max-w-2xl mx-auto">
            See how easy it is to send tips on X with our interactive 3D phone demo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 3D Phone Scene */}
          <div ref={canvasRef} className="relative h-96 md:h-[600px] flex items-center justify-center">
            <div className="relative w-64 h-96">
              <Spline
                scene="/scene.splinecode"
                onLoad={onLoad}
                onError={onError}
                style={{ width: '100%', height: '100%' }}
              />
              
              {/* Phone Screen Content Overlay */}
              {splineLoaded && (
                <div
                  ref={phoneScreenRef}
                  className="absolute inset-0 flex flex-col"
                  style={{ 
                    position: 'absolute',
                    top: '8%',
                    left: '8%',
                    right: '8%',
                    bottom: '20%',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    background: 'transparent'
                  }}
                >
                  {renderPhoneScreenContent()}
                </div>
              )}
              
              {/* Loading overlay */}
              {!splineLoaded && !splineError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                  <div className="text-white text-center">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Loading 3D scene...</p>
                  </div>
                </div>
              )}
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



