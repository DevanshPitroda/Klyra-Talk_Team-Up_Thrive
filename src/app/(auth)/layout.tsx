import React from 'react';
import PageTransition from '@/components/shared/PageTransition';
import BeamsBackground from '@/components/ui/BeamsBackground';
import BorderGlow from '@/components/ui/BorderGlow';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050606] px-4 py-8 relative overflow-hidden">
      {/* React Bits Beams 3D Ambient Background */}
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
          className="w-full backdrop-blur-xl p-8 shadow-2xl border border-[#3b4a54]/80"
        >
          <PageTransition>{children}</PageTransition>
        </BorderGlow>
      </div>
    </div>
  );
}
