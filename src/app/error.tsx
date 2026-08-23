'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error caught:', error);
  }, [error]);

  return (
    <div className="h-[100dvh] w-full bg-[#111b21] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="bg-[#182229] border border-border-default/40 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-green/20 border border-brand-green/40 flex items-center justify-center text-2xl mx-auto">
          💬
        </div>
        <div>
          <h2 className="text-base font-bold text-text-primary">Klyra Chat</h2>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            A temporary connection glitch occurred. Tap below to refresh your session.
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="w-full py-2.5 bg-brand-green hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition shadow cursor-pointer"
        >
          🔄 Refresh Session
        </button>
      </div>
    </div>
  );
}
