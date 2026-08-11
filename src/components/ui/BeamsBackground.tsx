'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const Beams = dynamic(() => import('./Beams'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#000000]" />
});

interface BeamsBackgroundProps {
  beamWidth?: number;
  beamHeight?: number;
  lightColor?: string;
  beamNumber?: number;
  speed?: number;
  noiseIntensity?: number;
  scale?: number;
  rotation?: number;
}

export default function BeamsBackground({
  lightColor = '#ffffff',
  beamWidth = 3,
  beamHeight = 25,
  beamNumber = 10,
  speed = 2,
  noiseIntensity = 1.75,
  scale = 0.2,
  rotation = -35
}: BeamsBackgroundProps) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 bg-[#050606]">
      <Beams
        beamWidth={beamWidth}
        beamHeight={beamHeight}
        beamNumber={beamNumber}
        lightColor={lightColor}
        speed={speed}
        noiseIntensity={noiseIntensity}
        scale={scale}
        rotation={rotation}
      />
    </div>
  );
}
