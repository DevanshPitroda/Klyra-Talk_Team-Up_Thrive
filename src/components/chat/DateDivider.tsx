'use client';

import React from 'react';

interface DateDividerProps {
  date: string;
}

export default function DateDivider({ date }: DateDividerProps) {
  return (
    <div className="flex justify-center my-3 select-none">
      <div className="bg-[#182229] border border-border-default/20 text-[10px] font-semibold text-text-secondary tracking-wider uppercase px-3 py-1 rounded-lg shadow-sm">
        {date}
      </div>
    </div>
  );
}
