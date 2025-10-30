'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const steps = [
  {
    number: '01',
    title: 'Login with X (Web3Auth)',
    description: 'Tap “Connect Account” and choose Twitter in the Web3Auth modal.',
    icon: '🔗'
  },
  {
    number: '02',
    title: 'Reply with @Pourboire',
    description: 'Simply reply to any X post with "@Pourboire tip 0.5 SOL" or similar command.',
    icon: '💬'
  },
  {
    number: '03',
    title: 'Instant payment',
    description: 'Our bot processes the payment and sends SOL/USDC instantly to the recipient.',
    icon: '⚡'
  },
  {
    number: '04',
    title: 'Set auto-pay rules',
    description: 'Configure automatic tipping for followers, giveaways, or specific hashtags.',
    icon: '🤖'
  }
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (!titleRef.current) return;

      gsap.set([titleRef.current, ...stepsRef.current], {
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
        .to(stepsRef.current, { 
          autoAlpha: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.15 
        }, 0.2);
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} id="how-it-works" className="relative py-24 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <div className="text-center mb-16">
          <h2 ref={titleRef} className="text-4xl md:text-5xl font-extralight text-white mb-6">
            How it works
          </h2>
          <p className="text-lg text-white/75 max-w-2xl mx-auto">
            Get started in minutes with our simple 4-step process
          </p>
        </div>

        <div className="relative">
          {/* Connection lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <div
                key={index}
                ref={el => { stepsRef.current[index] = el; }}
                className="relative group"
              >
                {/* Step number */}
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-white font-bold text-lg group-hover:scale-110 transition-transform duration-300">
                  {step.number}
                </div>
                
                {/* Step content */}
                <div className="text-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  
                  <h3 className="text-xl font-medium text-white mb-4">
                    {step.title}
                  </h3>
                  
                  <p className="text-white/70 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-medium text-white mb-4">
              Ready to start tipping?
            </h3>
            <p className="text-white/70 mb-6">
              Connect your wallet and start sending instant tips on X today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/dashboard"
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 hover:scale-105"
              >
                Connect Wallet
              </a>
              <a
                href="#features"
                className="px-8 py-3 border border-white/20 text-white rounded-xl font-medium hover:bg-white/10 transition-all duration-300"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
