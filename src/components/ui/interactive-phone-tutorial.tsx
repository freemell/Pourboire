'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Spline from '@splinetool/react-spline';
import { Application } from '@splinetool/runtime';
import PhoneAppInterface from './phone-app-interface';
import FallbackPhoneTutorial from './fallback-phone-tutorial';

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
    title: 'Type @pourboireonsol Command',
    description: 'Type "@pourboireonsol tip 0.5 SOL" to send a tip',
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

export default function InteractivePhoneTutorial() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const splineRef = useRef<Application | null>(null);
  
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
    setProgress(0);
    playStep(0);
  };

  // Play a specific tutorial step
  const playStep = (stepIndex: number) => {
    if (stepIndex >= tutorialSteps.length) {
      setIsPlaying(false);
      return;
    }

    const step = tutorialSteps[stepIndex];
    setCurrentStep(stepIndex);
    setProgress((stepIndex / tutorialSteps.length) * 100);

    // Update Spline scene based on step
    if (splineRef.current) {
      updateSplineScene(step);
    }

    // Auto-advance after duration
    if (step.duration) {
      setTimeout(() => {
        if (isPlaying) {
          playStep(stepIndex + 1);
        }
      }, step.duration);
    }
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
        'confirmation': { x: 0, y: 0, z: 3 }
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
      playStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      playStep(currentStep - 1);
    }
  };

  const resetTutorial = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setProgress(0);
    setTimeout(() => {
      startTutorial();
    }, 500);
  };

  // GSAP animations
  useGSAP(
    () => {
      if (!titleRef.current) return;

      gsap.set([titleRef.current, descriptionRef.current, canvasRef.current], {
        autoAlpha: 0,
        y: 30
      });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse'
        }
      });

      tl.to(titleRef.current, { autoAlpha: 1, y: 0, duration: 0.8 }, 0)
        .to(descriptionRef.current, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.2)
        .to(canvasRef.current, { autoAlpha: 1, y: 0, duration: 1, scale: 1 }, 0.4);
    },
    { scope: sectionRef }
  );

  const currentStepData = tutorialSteps[currentStep];

  // Use fallback if Spline fails to load
  if (splineError) {
    return <FallbackPhoneTutorial />;
  }

  return (
    <section ref={sectionRef} className="relative py-24 bg-black">
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
          {/* 3D Phone Scene */}
          <div ref={canvasRef} className="relative h-96 md:h-[600px] flex items-center justify-center">
            <div className="relative w-64 h-96">
              <Spline
                scene="/scene.splinecode"
                onLoad={onLoad}
                onError={onError}
                style={{ width: '100%', height: '100%' }}
              />
              
              {/* Phone App Interface */}
              {splineLoaded && (
                <PhoneAppInterface 
                  currentStep={currentStepData.id}
                  isVisible={isPlaying}
                />
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
              <div className="flex justify-between text-sm text-white/70">
                <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Current Step Info */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-2xl font-medium text-white mb-3">
                {currentStepData.title}
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                {currentStepData.description}
              </p>
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                {currentStepData.action}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex gap-4">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex-1 px-6 py-3 border border-white/20 text-white rounded-xl font-medium hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {currentStep < tutorialSteps.length - 1 ? (
                <button
                  onClick={nextStep}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={resetTutorial}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300"
                >
                  Restart Tutorial
                </button>
              )}
            </div>

            {/* Auto-play Toggle */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isPlaying 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}
              >
                {isPlaying ? 'Pause' : 'Auto-play'}
              </button>
              
              <span className="text-white/60 text-sm">
                {isPlaying ? 'Tutorial is playing automatically' : 'Click next to advance manually'}
              </span>
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="mt-16 flex justify-center">
          <div className="flex gap-3">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => playStep(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-blue-500 scale-125'
                    : index < currentStep
                    ? 'bg-blue-500/60'
                    : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Features Highlight */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h4 className="text-lg font-medium text-white mb-2">3D Interactive</h4>
            <p className="text-white/70 text-sm">Realistic iPhone model with interactive elements</p>
          </div>
          
          <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h4 className="text-lg font-medium text-white mb-2">Step-by-Step</h4>
            <p className="text-white/70 text-sm">Guided tutorial with visual highlights</p>
          </div>
          
          <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="text-lg font-medium text-white mb-2">Real-time</h4>
            <p className="text-white/70 text-sm">See the app in action as you learn</p>
          </div>
        </div>
      </div>
    </section>
  );
}
