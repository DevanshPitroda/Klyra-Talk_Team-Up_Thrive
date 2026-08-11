import React from 'react';
import { auth } from '../lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import BeamsBackground from '@/components/ui/BeamsBackground';
import BorderGlow from '@/components/ui/BorderGlow';
import SpecularButton from '@/components/ui/SpecularButton';

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect('/chat');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050606] px-4 py-8 relative overflow-hidden select-none">
      {/* 3D Beams Ambient Background */}
      <BeamsBackground
        beamWidth={3}
        beamHeight={25}
        beamNumber={10}
        lightColor="#ffffff"
        speed={2}
        noiseIntensity={1.75}
        scale={0.2}
        rotation={-35}
      />

      {/* Main Glass Card Container */}
      <div className="relative z-10 w-full max-w-md">
        <BorderGlow
          edgeSensitivity={30}
          glowColor="0 0 100"
          backgroundColor="rgba(31, 44, 52, 0.85)"
          borderRadius={24}
          glowRadius={35}
          glowIntensity={1.2}
          coneSpread={30}
          animated={true}
          colors={['#ffffff', '#94a3b8', '#3b4a54']}
          className="w-full backdrop-blur-xl p-8 text-center shadow-2xl border border-[#3b4a54]/80 flex flex-col items-center"
        >
          {/* Brand Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-black/40 mb-5 mx-auto bg-[#2a3942] border border-[#3b4a54]/80">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-[#e9edef]">
              <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.278.187 2.228 1.306 2.228 2.594V11.25c0 1.278-.94 2.397-2.206 2.584A49.08 49.08 0 0 1 12 14.25c-2.43 0-4.817-.178-7.152-.52-1.278-.187-2.228-1.306-2.228-2.594V5.365c0-1.288.95-2.407 2.228-2.594ZM3.75 16.5v.008c0 .167.007.333.02.499.08 1.04.793 1.905 1.776 2.115A49.124 49.124 0 0 0 12 19.5a49.12 49.12 0 0 0 6.454-.378c.983-.21 1.696-1.075 1.776-2.115a4.3 4.3 0 0 0 .02-.499V16.5A1.5 1.5 0 0 0 18.75 15h-13.5A1.5 1.5 0 0 0 3.75 16.5Z" clipRule="evenodd" />
            </svg>
          </div>

          <h1 className="text-3xl font-extrabold text-[#e9edef] tracking-tight">Klyra</h1>
          <p className="text-[#8696a0] text-sm mt-2 mb-8 leading-relaxed max-w-sm">
            <span className="font-bold text-[#e9edef] block mb-1">Talk, Team-Up, Thrive</span>
            Real-time messaging, video study rooms, media sharing, and broadcast status stories.
          </p>

          <Link href="/login" className="w-full">
            <SpecularButton
              radius={12}
              tint="#ffffff"
              tintOpacity={0.18}
              lineColor="#ffffff"
              baseColor="#3b4a54"
              textColor="#ffffff"
              followMouse={true}
              autoAnimate={true}
              speed={0.4}
              className="w-full text-sm font-semibold border border-[#3b4a54]/80 shadow-lg shadow-black/30"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)' }}
            >
              Sign In to Get Started
            </SpecularButton>
          </Link>
        </BorderGlow>
      </div>
    </div>
  );
}
