'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex flex-col flex-1 overflow-hidden">
      {children}
    </div>
  );
}
