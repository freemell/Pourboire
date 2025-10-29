'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const features = [
  {
    icon: '⚡',
    title: 'Instant Tips',
    description: 'Send SOL or USDC to any X post instantly with a simple @Pourboire mention.',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: '🤖',
    title: 'Auto-Pay',
    description: 'Set up automatic tipping rules for followers, replies, or giveaways.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: '🔒',
    title: 'Zero Fees',
    description: 'Only pay Solana network fees (~0.000005 SOL). No platform fees ever.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: '💳',
    title: 'x402 Integration',
    description: 'Powered by x402 for instant micropayments and premium features.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: '🎯',
    title: 'Smart Giveaways',
    description: 'Pick random winners, highest likes, or first N replies automatically.',
    color: 'from-red-500 to-rose-500'
  },
  {
    icon: '🔐',
    title: 'Custodial Wallets',
    description: 'Auto-create wallets for recipients who haven\'t connected yet.',
    color: 'from-indigo-500 to-blue-500'
  }
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (!titleRef.current) return;

      gsap.set([titleRef.current, ...cardsRef.current], {
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
        .to(cardsRef.current, { 
          autoAlpha: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.1 
        }, 0.2);
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative py-24 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <div className="text-center mb-16">
          <h2 ref={titleRef} className="text-4xl md:text-5xl font-extralight text-white mb-6">
            Powerful features
          </h2>
          <p className="text-lg text-white/75 max-w-2xl mx-auto">
            Everything you need to tip, donate, and reward on X with Solana
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={el => { cardsRef.current[index] = el; }}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-medium text-white mb-4">
                {feature.title}
              </h3>
              
              <p className="text-white/70 leading-relaxed">
                {feature.description}
              </p>
              
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
