'use client';

import * as React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';

interface LottieAiProcessProps {
  className?: string;
  size?: number;
}

export function LottieAiProcess({ className, size = 150 }: LottieAiProcessProps) {
  return (
    <div style={{ width: size, height: size }} className={cn("flex items-center justify-center shrink-0", className)}>
      <DotLottieReact
        src="https://lottie.host/13c60350-65e6-40cb-9303-62f93f5430ac/wTzkRbyHhT.lottie"
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
