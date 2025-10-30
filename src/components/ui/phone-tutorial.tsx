'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Text, Html, useTexture, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

// Phone model component
function PhoneModel() {
  const meshRef = useRef<THREE.Group>(null!);
  const screenRef = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Phone body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 2.4, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Screen */}
      <mesh ref={screenRef} position={[0, 0, 0.16]}>
        <boxGeometry args={[1.0, 2.0, 0.02]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* Screen content */}
      <Html
        transform
        position={[0, 0, 0.17]}
        distanceFactor={1.5}
        style={{
          width: '200px',
          height: '400px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '20px',
          padding: '20px',
          color: 'white',
          fontSize: '12px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div className="w-full h-full flex flex-col">
          {/* Twitter-like interface */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
            <div className="text-xs text-gray-300">@soltipp</div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Reply to @username</div>
              <div className="text-sm">@pourboireonsol tip 0.5 SOL</div>
            </div>
            
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
              <div className="text-xs text-green-400 mb-1">✓ Payment sent</div>
              <div className="text-xs text-gray-300">Tx: 3x7k...9m2p</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Auto-pay rule</div>
              <div className="text-sm">#PourboirePay if following</div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <div className="text-xs text-gray-500">Powered by Solana</div>
          </div>
        </div>
      </Html>
      
      {/* Home button */}
      <mesh position={[0, -1.0, 0.16]}>
        <circleGeometry args={[0.08, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
}

// Floating particles
function Particles() {
  const points = useRef<THREE.Points>(null!);
  
  const particlesCount = 50;
  const positions = useMemo(() => {
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.1;
      points.current.rotation.x = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#00d4ff" transparent opacity={0.6} />
    </points>
  );
}


export default function PhoneTutorial() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <section ref={sectionRef} className="relative py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <div className="text-center mb-16">
          <h2 ref={titleRef} className="text-4xl md:text-5xl font-extralight text-white mb-6">
            How it works
          </h2>
          <p ref={descriptionRef} className="text-lg text-white/75 max-w-2xl mx-auto">
            Simply reply to any X post with @pourboireonsol and the amount. Our bot handles the rest automatically.
          </p>
        </div>

        <div ref={canvasRef} className="relative h-96 md:h-[500px]">
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
            style={{ width: '100%', height: '100%' }}
          >
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <pointLight position={[-5, -5, 5]} intensity={0.5} color="#00d4ff" />
            
            <Environment preset="city" />
            <PhoneModel />
            <Particles />
          </Canvas>
          
          {/* Floating labels */}
          <div className="absolute top-1/4 left-4 md:left-8 text-white">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 max-w-xs">
              <div className="text-sm font-medium">1. Reply with @pourboireonsol</div>
              <div className="text-xs text-white/70 mt-1">Mention our bot with amount</div>
            </div>
          </div>
          
          <div className="absolute top-1/2 right-4 md:right-8 text-white">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 max-w-xs">
              <div className="text-sm font-medium">2. Instant payment</div>
              <div className="text-xs text-white/70 mt-1">SOL/USDC sent automatically</div>
            </div>
          </div>
          
          <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 text-white">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 max-w-xs text-center">
              <div className="text-sm font-medium">3. Auto-pay features</div>
              <div className="text-xs text-white/70 mt-1">Set rules for automatic tipping</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
