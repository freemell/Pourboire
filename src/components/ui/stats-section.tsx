'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const stats = [
  {
    value: '0',
    suffix: 'K+',
    label: 'Tips sent',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    value: '0',
    suffix: '+',
    label: 'Active users',
    color: 'from-green-500 to-emerald-500'
  },
  {
    value: '0',
    suffix: ' SOL',
    label: 'Total volume',
    color: 'from-purple-500 to-pink-500'
  },
  {
    value: '0',
    suffix: 'ms',
    label: 'Avg. speed',
    color: 'from-orange-500 to-red-500'
  }
];

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const statsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0));

  useGSAP(
    () => {
      if (!titleRef.current) return;

      gsap.set([titleRef.current, ...statsRef.current], {
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
        .to(statsRef.current, { 
          autoAlpha: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.1 
        }, 0.2);
    },
    { scope: sectionRef }
  );

  // Animate numbers
  useEffect(() => {
    const animateNumbers = () => {
      stats.forEach((stat, index) => {
        const targetValue = stat.value === '0' ? 0 : parseInt(stat.value);
        if (targetValue > 0) {
          gsap.to(animatedStats, {
            [index]: targetValue,
            duration: 2,
            ease: 'power2.out',
            onUpdate: () => {
              setAnimatedStats(prev => [...prev]);
            }
          });
        }
      });
    };

    // Trigger animation when section comes into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateNumbers();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <div className="text-center mb-16">
          <h2 ref={titleRef} className="text-4xl md:text-5xl font-extralight text-white mb-6">
            SolTip by the numbers
          </h2>
          <p className="text-lg text-white/75 max-w-2xl mx-auto">
            Join thousands of users already tipping on X with Solana
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              ref={el => { statsRef.current[index] = el; }}
              className="text-center group"
            >
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r ${stat.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-2xl font-bold text-white">
                  {stat.value === '0' ? '0' : Math.floor(animatedStats[index])}
                  {stat.suffix}
                </span>
              </div>
              
              <h3 className="text-lg font-medium text-white mb-2">
                {stat.label}
              </h3>
              
              <div className={`h-1 w-16 mx-auto bg-gradient-to-r ${stat.color} rounded-full group-hover:w-20 transition-all duration-300`} />
            </div>
          ))}
        </div>

        {/* Additional info */}
        <div className="mt-16 text-center">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-medium text-white mb-4">
              Built on Solana
            </h3>
            <p className="text-white/70 mb-6 max-w-2xl mx-auto">
              Fast, secure, and low-cost transactions powered by the world's fastest blockchain. 
              Average transaction cost is less than $0.001.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-white/60">
              <span className="px-3 py-1 bg-white/10 rounded-full">~400ms finality</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">$0.00025 avg cost</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">65,000 TPS</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">Carbon neutral</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
