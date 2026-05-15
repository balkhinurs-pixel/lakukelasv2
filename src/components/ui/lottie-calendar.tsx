'use client';

import * as React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';

interface LottieCalendarProps {
  className?: string;
  size?: number;
}

export function LottieCalendar({ className, size = 100 }: LottieCalendarProps) {
  return (
    <div style={{ width: size, height: size }} className={cn("flex items-center justify-center shrink-0", className)}>
      <DotLottieReact
        src="https://lottie.host/f4b40275-14fb-4af6-ae8d-479777c2b1ca/r7jxlwOuGM.lottie"
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
